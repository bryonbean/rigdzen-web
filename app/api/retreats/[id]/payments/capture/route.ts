import { NextResponse } from "next/server";
import { getEffectiveSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { paypalRequest } from "@/lib/paypal/config";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getEffectiveSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const retreatId = parseInt(params.id);
    if (isNaN(retreatId)) {
      return NextResponse.json(
        { error: "Invalid retreat ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { orderId } = body as { orderId: string };

    if (!orderId) {
      return NextResponse.json(
        { error: "PayPal order ID is required" },
        { status: 400 }
      );
    }

    // Find payment record (may not have mealOrderId if created for multiple orders)
    const payment = await prisma.payment.findFirst({
      where: {
        paypalOrderId: orderId,
        userId: session.userId,
        status: "PENDING",
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Capture the PayPal order
    const captureResponse = await paypalRequest(
      `/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        body: JSON.stringify({}),
      }
    );

    if (!captureResponse.ok) {
      const errorData = await captureResponse.json();
      console.error("PayPal capture error:", errorData);
      return NextResponse.json(
        { error: "Failed to capture PayPal payment" },
        { status: 500 }
      );
    }

    const captureData = await captureResponse.json();

    if (!captureData.id) {
      return NextResponse.json(
        { error: "Failed to capture PayPal payment" },
        { status: 500 }
      );
    }

    const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];
    const payer = captureData.payer;

    if (!capture || capture.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Payment capture not completed" },
        { status: 400 }
      );
    }

    // Get the actual captured amount from PayPal
    const capturedAmount = parseFloat(capture.amount?.value || "0");

    // Get all pending meal orders for this user and retreat
    const pendingOrders = await prisma.mealOrder.findMany({
      where: {
        userId: session.userId,
        retreatId,
        status: "PENDING",
      },
      include: {
        meal: true,
        menuItems: true,
      },
    });

    // Calculate individual order amounts (for proportional split)
    const orderAmounts = pendingOrders.map((order) => {
      const quantities = order.menuItems
        .map((item) => item.quantity)
        .filter((q): q is number => q !== null);
      const maxQuantity = quantities.length > 0 ? Math.max(...quantities) : 1;
      return order.meal.price * maxQuantity;
    });

    const totalCalculatedAmount = orderAmounts.reduce(
      (sum, amount) => sum + amount,
      0
    );

    // Track which payment record will get the paypalOrderId (due to unique constraint)
    // If the tracking payment already has a mealOrderId, that one keeps the paypalOrderId
    // Otherwise, the first pending order's payment will get it
    let paypalOrderIdAssigned = false;
    const trackingPaymentMealOrderId = payment.mealOrderId;

    // Update or delete the tracking payment record (if it has no mealOrderId)
    // Individual payment records will be created below for each meal order
    if (payment.mealOrderId === null) {
      // Delete the tracking payment since we'll create individual ones
      await prisma.payment.delete({
        where: { id: payment.id },
      });
    } else {
      // This payment was linked to a specific order - it already has the paypalOrderId
      // We'll update it below in the loop, but mark that paypalOrderId is already assigned
      paypalOrderIdAssigned = true;
    }

    // Create or update payment records for all pending orders using actual PayPal amounts
    // Split proportionally if amounts don't match exactly
    // Note: Only one payment record gets the paypalOrderId (due to unique constraint)
    for (let i = 0; i < pendingOrders.length; i++) {
      const order = pendingOrders[i];

      // Check if payment already exists for this order
      const existingPayment = await prisma.payment.findUnique({
        where: { mealOrderId: order.id },
      });

      // Calculate proportional amount based on PayPal capture
      // Use actual PayPal amount, split proportionally if needed
      let amount: number;
      if (
        totalCalculatedAmount > 0 &&
        Math.abs(totalCalculatedAmount - capturedAmount) < 0.01
      ) {
        // Amounts match, use calculated amount
        amount = orderAmounts[i];
      } else if (totalCalculatedAmount > 0) {
        // Amounts don't match, split proportionally
        const proportion = orderAmounts[i] / totalCalculatedAmount;
        amount = capturedAmount * proportion;
      } else {
        // Fallback: split equally
        amount = capturedAmount / pendingOrders.length;
      }

      // Determine if this payment should get the paypalOrderId
      // - If tracking payment had a mealOrderId matching this order, it keeps it
      // - Otherwise, only the first payment gets it
      const shouldHavePaypalOrderId =
        trackingPaymentMealOrderId === order.id ||
        (!paypalOrderIdAssigned && i === 0);

      if (existingPayment) {
        // Update existing payment with actual PayPal amount
        const updateData: {
          amount: number;
          status: string;
          completedAt: Date;
          paypalPayerId: string | null;
          paypalOrderId?: string | null;
        } = {
          amount,
          status: "COMPLETED",
          completedAt: new Date(),
          paypalPayerId: payer?.payer_id || null,
        };

        // Only update paypalOrderId if this payment should have it and doesn't already
        if (shouldHavePaypalOrderId && !existingPayment.paypalOrderId) {
          updateData.paypalOrderId = orderId;
          paypalOrderIdAssigned = true;
        } else if (!shouldHavePaypalOrderId && existingPayment.paypalOrderId) {
          // Remove paypalOrderId if this payment shouldn't have it (shouldn't happen, but safety check)
          updateData.paypalOrderId = null;
        }

        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: updateData,
        });
      } else {
        // Create new payment record
        await prisma.payment.create({
          data: {
            userId: session.userId,
            mealOrderId: order.id,
            amount,
            currency: capture.amount?.currency_code || "CAD",
            paypalOrderId: shouldHavePaypalOrderId ? orderId : null,
            paypalPayerId: payer?.payer_id || null,
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });

        if (shouldHavePaypalOrderId) {
          paypalOrderIdAssigned = true;
        }
      }

      // Update meal order status and payment method
      await prisma.mealOrder.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          paymentMethod: "PAYPAL",
        },
      });
    }

    // Get the first created payment record to return
    const createdPayment = await prisma.payment.findFirst({
      where: {
        paypalOrderId: orderId,
        userId: session.userId,
        status: "COMPLETED",
      },
    });

    return NextResponse.json({
      success: true,
      paymentId: createdPayment?.id || payment.id,
      captureId: capture.id,
      orderId: captureData.id,
    });
  } catch (error: any) {
    console.error("PayPal capture error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to capture PayPal payment" },
      { status: 500 }
    );
  }
}
