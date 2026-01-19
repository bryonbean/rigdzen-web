import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { id: string; mealId: string } }
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

    if (isNaN(retreatId) || isNaN(mealId)) {
      return NextResponse.json(
        { error: "Invalid retreat or meal ID" },
        { status: 400 }
      );
    }

    // Verify meal belongs to retreat
    const meal = await prisma.meal.findUnique({
      where: { id: mealId },
    });

    if (!meal || meal.retreatId !== retreatId) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const requiresQuantity = formData.get("requiresQuantity") === "on";

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Create menu item
    const menuItem = await prisma.menuItem.create({
      data: {
        mealId,
        name: name.trim(),
        description: description?.trim() || null,
        requiresQuantity,
      },
    });

    // Redirect back to menu items page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/retreats/${retreatId}/meals/${mealId}/menu-items`
    );
  } catch (error) {
    console.error("Menu item creation error:", error);
    return NextResponse.json(
      { error: "Failed to create menu item" },
      { status: 500 }
    );
  }
}
