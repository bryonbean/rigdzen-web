import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * Copy meals (with menu items) and duties (without assignments) from source retreat to new retreat
 */
async function copyRetreatData(
  sourceRetreatId: number,
  newRetreatId: number
): Promise<void> {
  // Get source retreat with meals, duties, and duty assignments
  const sourceRetreat = await prisma.retreat.findUnique({
    where: { id: sourceRetreatId },
    include: {
      meals: {
        include: {
          menuItems: true,
        },
      },
      duties: {
        include: {
          assignments: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!sourceRetreat) {
    throw new Error("Source retreat not found");
  }

  // Copy meals with menu items
  for (const meal of sourceRetreat.meals) {
    const newMeal = await prisma.meal.create({
      data: {
        retreatId: newRetreatId,
        name: meal.name,
        description: meal.description,
        price: meal.price,
        mealDate: meal.mealDate,
        available: meal.available,
        menuItems: {
          create: meal.menuItems.map((menuItem) => ({
            name: menuItem.name,
            description: menuItem.description,
            requiresQuantity: menuItem.requiresQuantity,
          })),
        },
      },
    });
  }

  // Copy duties with assignments (participants)
  for (const duty of sourceRetreat.duties) {
    const newDuty = await prisma.duty.create({
      data: {
        retreatId: newRetreatId,
        title: duty.title,
        description: duty.description,
        status: duty.assignments.length > 0 ? "ASSIGNED" : "PENDING",
        assignments: {
          create: duty.assignments.map((assignment) => ({
            userId: assignment.userId,
            status: "ASSIGNED", // Reset to ASSIGNED for new retreat
            assignedAt: new Date(),
            // Don't copy completedAt - reset acknowledgment status
          })),
        },
      },
    });
  }
}

export async function POST(request: Request) {
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

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const location = formData.get("location") as string | null;
    const mealOrderDeadline = formData.get("mealOrderDeadline") as
      | string
      | null;
    const status = formData.get("status") as string;
    const sourceRetreatId = formData.get("sourceRetreatId") as string | null;

    // Validate required fields
    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Name, start date, and end date are required" },
        { status: 400 }
      );
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const deadline = mealOrderDeadline ? new Date(mealOrderDeadline) : null;

    // Validate date logic
    if (start >= end) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Create retreat
    const retreat = await prisma.retreat.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        startDate: start,
        endDate: end,
        location: location?.trim() || null,
        mealOrderDeadline: deadline,
        status: status || "UPCOMING",
      },
    });

    // Copy meals and duties from source retreat if specified
    if (sourceRetreatId) {
      const sourceRetreatIdNum = parseInt(sourceRetreatId);
      if (!isNaN(sourceRetreatIdNum)) {
        try {
          await copyRetreatData(sourceRetreatIdNum, retreat.id);
        } catch (copyError) {
          console.error("Error copying retreat data:", copyError);
          // Continue even if copy fails - retreat is already created
        }
      }
    }

    // Return JSON with retreat ID for client-side redirect
    return NextResponse.json({
      success: true,
      retreatId: retreat.id,
      redirectUrl: `/admin/retreats/${retreat.id}`,
    });
  } catch (error) {
    console.error("Retreat creation error:", error);
    return NextResponse.json(
      { error: "Failed to create retreat" },
      { status: 500 }
    );
  }
}
