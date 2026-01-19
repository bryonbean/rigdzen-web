import { NextResponse } from "next/server";
import { getSession, stopImpersonation } from "@/lib/auth/session";

export async function POST() {
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

    await stopImpersonation();

    return NextResponse.json({
      success: true,
      message: "Stopped impersonating",
    });
  } catch (error: any) {
    console.error("Stop impersonation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to stop impersonation" },
      { status: 500 }
    );
  }
}
