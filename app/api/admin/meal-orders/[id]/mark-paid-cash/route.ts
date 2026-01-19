import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can mark orders as paid
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const mealOrderId = parseInt(params.id);
    if (isNaN(mealOrderId)) {
      return NextResponse.json(
        { error: "Invalid meal order ID" },
        { status: 400 }
      );
    }

    // Get meal order with details
    const mealOrder = await prisma.mealOrder.findUnique({
      where: { id: mealOrderId },
      include: {
        meal: true,
        menuItems: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!mealOrder) {
      return NextResponse.json(
        { error: "Meal order not found" },
        { status: 404 }
      );
    }

    // Check if already paid
    if (mealOrder.status === "PAID") {
      return NextResponse.json(
        { error: "Meal order is already marked as paid" },
        { status: 400 }
      );
    }

    // Calculate order amount
    const quantities = mealOrder.menuItems
      .map((item) => item.quantity)
      .filter((q): q is number => q !== null);
    const maxQuantity = quantities.length > 0 ? Math.max(...quantities) : 1;
    const amount = mealOrder.meal.price * maxQuantity;

    // Create payment record and update order in a transaction
    await prisma.$transaction(async (tx) => {
      // Check if payment already exists
      const existingPayment = await tx.payment.findUnique({
        where: { mealOrderId: mealOrder.id },
      });

      if (existingPayment) {
        // Update existing payment
        await tx.payment.update({
          where: { id: existingPayment.id },
          data: {
            amount,
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });
      } else {
        // Create new payment record
        await tx.payment.create({
          data: {
            userId: mealOrder.userId,
            mealOrderId: mealOrder.id,
            amount,
            currency: "CAD",
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });
      }

      // Update meal order status and payment method
      await tx.mealOrder.update({
        where: { id: mealOrder.id },
        data: {
          status: "PAID",
          paymentMethod: "CASH",
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Meal order marked as paid with cash",
    });
  } catch (error: any) {
    console.error("Mark paid cash error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to mark as paid" },
      { status: 500 }
    );
  }
}
