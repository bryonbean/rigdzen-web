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

    // Get all pending meal orders for this user and retreat
    const pendingOrders = await prisma.mealOrder.findMany({
      where: {
        userId: session.userId,
        retreatId,
        status: "PENDING",
      },
      include: {
        meal: true,
        menuItems: {
          include: {
            menuItem: true,
          },
        },
      },
    });

    if (pendingOrders.length === 0) {
      return NextResponse.json(
        { error: "No pending orders to pay for" },
        { status: 400 }
      );
    }

    // Calculate total amount
    const totalAmount = pendingOrders.reduce((sum, order) => {
      const quantities = order.menuItems
        .map((item) => item.quantity)
        .filter((q): q is number => q !== null);
      const maxQuantity = quantities.length > 0 ? Math.max(...quantities) : 1;
      return sum + order.meal.price * maxQuantity;
    }, 0);

    // Create PayPal order
    const orderRequest = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "CAD",
            value: totalAmount.toFixed(2),
          },
          description: `Meal orders for retreat: ${pendingOrders.length} meal(s)`,
        },
      ],
      application_context: {
        brand_name: "Rigdzen",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/retreats/${retreatId}?payment=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/retreats/${retreatId}?payment=cancelled`,
      },
    };

    const response = await paypalRequest("/v2/checkout/orders", {
      method: "POST",
      body: JSON.stringify(orderRequest),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("PayPal API error:", errorData);
      return NextResponse.json(
        { error: "Failed to create PayPal order" },
        { status: 500 }
      );
    }

    const orderData = await response.json();

    if (!orderData.id) {
      return NextResponse.json(
        { error: "Failed to create PayPal order" },
        { status: 500 }
      );
    }

    const paypalOrderId = orderData.id;

    // Check if a payment record already exists for any of these orders
    // If so, update it; otherwise create a new one without mealOrderId
    // (since we'll create individual payment records in the capture route)
    const existingPayment = await prisma.payment.findFirst({
      where: {
        userId: session.userId,
        paypalOrderId,
        status: "PENDING",
      },
    });

    let payment;
    if (existingPayment) {
      // Update existing payment
      payment = await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          amount: totalAmount,
        },
      });
    } else {
      // Create a payment record without mealOrderId to track the PayPal order
      // Individual payment records will be created in the capture route
      payment = await prisma.payment.create({
        data: {
          userId: session.userId,
          mealOrderId: null, // No specific meal order - this is for all pending orders
          amount: totalAmount,
          currency: "CAD",
          paypalOrderId,
          status: "PENDING",
        },
      });
    }

    // Find approval URL from links
    const approvalLink = orderData.links?.find(
      (link: { rel?: string; href?: string }) => link.rel === "approve"
    );

    return NextResponse.json({
      orderId: paypalOrderId,
      paymentId: payment.id,
      approvalUrl: approvalLink?.href,
    });
  } catch (error: any) {
    console.error("PayPal order creation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create PayPal order" },
      { status: 500 }
    );
  }
}
