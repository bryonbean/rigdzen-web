import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; mealId: string; menuItemId: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const retreatId = parseInt(params.id);
    const mealId = parseInt(params.mealId);
    const menuItemId = parseInt(params.menuItemId);

    if (isNaN(retreatId) || isNaN(mealId) || isNaN(menuItemId)) {
      return NextResponse.json(
        { error: "Invalid retreat, meal, or menu item ID" },
        { status: 400 }
      );
    }

    // Verify menu item belongs to meal and retreat
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: {
        meal: true,
      },
    });

    if (
      !menuItem ||
      menuItem.mealId !== mealId ||
      menuItem.meal.retreatId !== retreatId
    ) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      );
    }

    // Delete menu item (cascade will delete meal order items)
    await prisma.menuItem.delete({
      where: { id: menuItemId },
    });

    // Redirect back to menu items page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/retreats/${retreatId}/meals/${mealId}/menu-items`
    );
  } catch (error) {
    console.error("Menu item deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete menu item" },
      { status: 500 }
    );
  }
}
