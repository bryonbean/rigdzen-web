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

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const retreatId = parseInt(params.id);
    if (isNaN(retreatId)) {
      return NextResponse.json(
        { error: "Invalid retreat ID" },
        { status: 400 }
      );
    }

    // Verify retreat exists
    const retreat = await prisma.retreat.findUnique({
      where: { id: retreatId },
    });

    if (!retreat) {
      return NextResponse.json({ error: "Retreat not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const price = formData.get("price") as string;
    const mealDate = formData.get("mealDate") as string;
    const available = formData.get("available") === "on";

    // Validate required fields
    if (!name || !price || !mealDate) {
      return NextResponse.json(
        { error: "Name, price, and meal date are required" },
        { status: 400 }
      );
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return NextResponse.json(
        { error: "Price must be a valid number >= 0" },
        { status: 400 }
      );
    }

    // Create meal
    const meal = await prisma.meal.create({
      data: {
        retreatId,
        name: name.trim(),
        description: description?.trim() || null,
        price: priceNum,
        mealDate: new Date(mealDate),
        available,
      },
    });

    // Redirect back to meals page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/retreats/${retreatId}/meals`
    );
  } catch (error) {
    console.error("Meal creation error:", error);
    return NextResponse.json(
      { error: "Failed to create meal" },
      { status: 500 }
    );
  }
}
