import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { startImpersonation } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    // Disable impersonation in production
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "Impersonation is only available in development" },
        { status: 403 }
      );
    }

    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = body as { userId: number };

    if (!userId || typeof userId !== "number") {
      return NextResponse.json(
        { error: "Valid user ID is required" },
        { status: 400 }
      );
    }

    // Get the user to impersonate
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Start impersonation
    await startImpersonation(user.id, user.email, user.role);

    return NextResponse.json({
      success: true,
      message: `Now viewing as ${user.name || user.email}`,
      impersonatedUser: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Start impersonation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to start impersonation" },
      { status: 500 }
    );
  }
}
