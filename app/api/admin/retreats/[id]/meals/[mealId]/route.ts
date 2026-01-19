import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function DELETE(
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
      include: {
        _count: {
          select: {
            mealOrders: true,
          },
        },
      },
    });

    if (!meal || meal.retreatId !== retreatId) {
      return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    }

    // Delete meal (cascade will delete meal orders)
    await prisma.meal.delete({
      where: { id: mealId },
    });

    // Redirect back to meals page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/retreats/${retreatId}/meals`
    );
  } catch (error) {
    console.error("Meal deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete meal" },
      { status: 500 }
    );
  }
}
