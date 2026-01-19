import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; dutyId: string } }
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
    const dutyId = parseInt(params.dutyId);

    if (isNaN(retreatId) || isNaN(dutyId)) {
      return NextResponse.json(
        { error: "Invalid retreat or duty ID" },
        { status: 400 }
      );
    }

    // Verify duty belongs to retreat
    const duty = await prisma.duty.findUnique({
      where: { id: dutyId },
    });

    if (!duty || duty.retreatId !== retreatId) {
      return NextResponse.json({ error: "Duty not found" }, { status: 404 });
    }

    const body = await request.json();
    const { userId, action } = body as {
      userId: number | null;
      action?: "add" | "remove";
    };

    // Default action is "add" if userId is provided, "remove" if null
    const assignAction = action || (userId ? "add" : "remove");

    if (assignAction === "add" && userId !== null && userId !== undefined) {
      // Verify user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Add assignment (or update if exists)
      await prisma.dutyAssignment.upsert({
        where: {
          dutyId_userId: {
            dutyId,
            userId,
          },
        },
        create: {
          dutyId,
          userId,
          status: "ASSIGNED",
          assignedAt: new Date(),
        },
        update: {
          status: "ASSIGNED",
        },
      });

      // Update duty status if no assignments exist, set to ASSIGNED
      const assignments = await prisma.dutyAssignment.count({
        where: { dutyId },
      });

      await prisma.duty.update({
        where: { id: dutyId },
        data: {
          status: assignments > 0 ? "ASSIGNED" : "PENDING",
        },
      });
    } else if (
      assignAction === "remove" &&
      userId !== null &&
      userId !== undefined
    ) {
      // Remove assignment
      await prisma.dutyAssignment.deleteMany({
        where: {
          dutyId,
          userId,
        },
      });

      // Update duty status if no assignments remain
      const assignments = await prisma.dutyAssignment.count({
        where: { dutyId },
      });

      await prisma.duty.update({
        where: { id: dutyId },
        data: {
          status: assignments > 0 ? "ASSIGNED" : "PENDING",
        },
      });
    } else {
      return NextResponse.json(
        { error: "Invalid request: userId is required for add/remove" },
        { status: 400 }
      );
    }

    // Return updated duty with assignments
    const updatedDuty = await prisma.duty.findUnique({
      where: { id: dutyId },
      include: {
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      duty: updatedDuty,
    });
  } catch (error) {
    console.error("Duty assignment error:", error);
    return NextResponse.json(
      { error: "Failed to assign duty" },
      { status: 500 }
    );
  }
}
