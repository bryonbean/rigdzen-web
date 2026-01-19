import { NextResponse } from "next/server";
import { getEffectiveSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getEffectiveSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const skip = searchParams.get("skip");

    if (skip === "true") {
      // Get existing user data
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
      });

      // Mark profile as completed with existing data
      await prisma.user.update({
        where: { id: session.userId },
        data: {
          profileCompleted: true,
          // Ensure name exists (should come from OAuth)
          name: user?.name || session.email.split("@")[0],
        },
      });

      // Redirect to dashboard
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`
      );
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Profile skip error:", error);
    return NextResponse.json(
      { error: "Failed to skip profile completion" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getEffectiveSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get("name") as string;
    const dietaryRestrictions = formData.getAll(
      "dietaryRestrictions"
    ) as string[];
    const dietaryNotes = formData.get("dietaryNotes") as string | null;

    // Validate name is required
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Combine dietary restrictions into JSON array
    const dietaryRestrictionsJson = JSON.stringify(
      dietaryNotes
        ? [...dietaryRestrictions, dietaryNotes]
        : dietaryRestrictions
    );

    // Update user profile
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        name: name.trim(),
        dietaryRestrictions: dietaryRestrictionsJson,
        profileCompleted: true,
      },
    });

    // Redirect to dashboard
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard`
    );
  } catch (error) {
    console.error("Profile completion error:", error);
    return NextResponse.json(
      { error: "Failed to complete profile" },
      { status: 500 }
    );
  }
}
