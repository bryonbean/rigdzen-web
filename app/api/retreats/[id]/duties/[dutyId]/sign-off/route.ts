import { NextResponse } from "next/server";
import { getEffectiveSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; dutyId: string } }
) {
  try {
    const session = await getEffectiveSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Find the user's assignment for this duty
    const assignment = await prisma.dutyAssignment.findUnique({
      where: {
        dutyId_userId: {
          dutyId,
          userId: session.userId,
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "You are not assigned to this duty" },
        { status: 404 }
      );
    }

    if (assignment.status === "COMPLETED") {
      return NextResponse.json(
        { error: "You have already acknowledged this duty" },
        { status: 400 }
      );
    }

    // Update assignment to mark as acknowledged/signed off
    const updatedAssignment = await prisma.dutyAssignment.update({
      where: {
        dutyId_userId: {
          dutyId,
          userId: session.userId,
        },
      },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // Check if all assignments for this duty are completed
    const allAssignments = await prisma.dutyAssignment.findMany({
      where: { dutyId },
    });

    const allCompleted = allAssignments.every((a) => a.status === "COMPLETED");

    // Update duty status if all assignments are completed
    if (allCompleted) {
      await prisma.duty.update({
        where: { id: dutyId },
        data: {
          status: "COMPLETED",
        },
      });
    }

    return NextResponse.json({
      success: true,
      assignment: updatedAssignment,
    });
  } catch (error) {
    console.error("Duty acknowledge error:", error);
    return NextResponse.json(
      { error: "Failed to acknowledge duty" },
      { status: 500 }
    );
  }
}
