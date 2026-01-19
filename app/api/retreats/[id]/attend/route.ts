import { NextResponse } from "next/server";
import { getEffectiveSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

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

    // Verify retreat exists
    const retreat = await prisma.retreat.findUnique({
      where: { id: retreatId },
    });

    if (!retreat) {
      return NextResponse.json({ error: "Retreat not found" }, { status: 404 });
    }

    // Check if already attending
    const existingRegistration = await prisma.retreatRegistration.findUnique({
      where: {
        userId_retreatId: {
          userId: session.userId,
          retreatId,
        },
      },
    });

    if (existingRegistration) {
      // Already attending - update status to REGISTERED if it was CANCELLED
      if (existingRegistration.status === "CANCELLED") {
        await prisma.retreatRegistration.update({
          where: { id: existingRegistration.id },
          data: { status: "REGISTERED" },
        });
      }
      return NextResponse.json({
        success: true,
        message: "Already attending this retreat",
      });
    }

    // Create new registration
    await prisma.retreatRegistration.create({
      data: {
        userId: session.userId,
        retreatId,
        status: "REGISTERED",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully marked as attending",
    });
  } catch (error: any) {
    console.error("Attend retreat error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to mark as attending" },
      { status: 500 }
    );
  }
}
