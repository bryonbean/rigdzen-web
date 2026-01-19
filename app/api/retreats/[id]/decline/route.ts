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

    // Find existing registration
    const registration = await prisma.retreatRegistration.findUnique({
      where: {
        userId_retreatId: {
          userId: session.userId,
          retreatId,
        },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Not currently attending this retreat" },
        { status: 404 }
      );
    }

    // Update status to CANCELLED (don't delete, keep history)
    await prisma.retreatRegistration.update({
      where: { id: registration.id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully declined attendance",
    });
  } catch (error: any) {
    console.error("Decline retreat error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to decline attendance" },
      { status: 500 }
    );
  }
}
