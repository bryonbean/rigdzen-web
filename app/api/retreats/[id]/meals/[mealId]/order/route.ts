import { NextResponse } from "next/server";
import { getEffectiveSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string; mealId: string } }
) {
  try {
    const session = await getEffectiveSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const retreatId = parseInt(params.id);
    const mealId = parseInt(params.mealId);

    if (isNaN(retreatId) || isNaN(mealId)) {
      return NextResponse.json(
        { error: "Invalid retreat or meal ID" },
        { status: 400 }
      );
    }

    // Verify meal belongs to retreat
    const meal = await prisma.meal.findUnique({
      where: { id: mealId },
      include: {
        menuItems: true,
      },
    });

    if (!meal || meal.retreatId !== retreatId) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    }

    // Check if meal is available
    if (!meal.available) {
      return NextResponse.json(
        { error: "Meal is not available for ordering" },
        { status: 400 }
      );
    }

    // Check ordering deadline
    const retreat = await prisma.retreat.findUnique({
      where: { id: retreatId },
    });

    if (retreat?.mealOrderDeadline) {
      const now = new Date();
      if (new Date(retreat.mealOrderDeadline) < now) {
        return NextResponse.json(
          { error: "Ordering deadline has passed" },
          { status: 400 }
        );
      }
    }

    const body = await request.json();
    const { menuItems } = body as {
      menuItems: Array<{ menuItemId: number; quantity: number | null }>;
    };

    // Check for existing order first
    const existingOrder = await prisma.mealOrder.findUnique({
      where: {
        userId_mealId: {
          userId: session.userId,
          mealId: meal.id,
        },
      },
      include: {
        menuItems: true,
        payment: true,
      },
    });

    // If no menu items selected and order exists, cancel/delete the order
    if ((!menuItems || menuItems.length === 0) && existingOrder) {
      // If order is already paid, don't allow deletion - user should contact admin
      if (existingOrder.status === "PAID" || existingOrder.payment) {
        return NextResponse.json(
          {
            error:
              "Cannot cancel a paid order. Please contact an administrator for a refund.",
          },
          { status: 400 }
        );
      }

      // Delete all menu items (effectively canceling the order)
      await prisma.mealOrderMenuItem.deleteMany({
        where: { mealOrderId: existingOrder.id },
      });

      // Delete the order itself (only if not paid)
      await prisma.mealOrder.delete({
        where: { id: existingOrder.id },
      });

      return NextResponse.json({ success: true, message: "Order cancelled" });
    }

    // If no menu items selected and no existing order, nothing to do
    if (!menuItems || menuItems.length === 0) {
      return NextResponse.json({ success: true });
    }

    // Validate menu items belong to meal and quantities
    const menuItemIds = meal.menuItems.map((mi) => mi.id);
    for (const orderItem of menuItems) {
      if (!menuItemIds.includes(orderItem.menuItemId)) {
        return NextResponse.json(
          {
            error: `Menu item ${orderItem.menuItemId} does not belong to this meal`,
          },
          { status: 400 }
        );
      }

      const menuItem = meal.menuItems.find(
        (mi) => mi.id === orderItem.menuItemId
      );
      if (menuItem?.requiresQuantity) {
        if (!orderItem.quantity || orderItem.quantity <= 0) {
          return NextResponse.json(
            {
              error: `Quantity must be greater than zero for ${menuItem.name}`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Update or create order
    if (existingOrder) {
      // Update existing order
      // Delete existing menu item selections
      await prisma.mealOrderMenuItem.deleteMany({
        where: { mealOrderId: existingOrder.id },
      });

      // Create new menu item selections
      await prisma.mealOrderMenuItem.createMany({
        data: menuItems.map((item) => ({
          mealOrderId: existingOrder.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
      });
    } else {
      // Create new order
      const mealOrder = await prisma.mealOrder.create({
        data: {
          userId: session.userId,
          retreatId,
          mealId: meal.id,
          status: "PENDING",
          menuItems: {
            create: menuItems.map((item) => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
            })),
          },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Meal order error:", error);
    return NextResponse.json(
      { error: "Failed to place order" },
      { status: 500 }
    );
  }
}
