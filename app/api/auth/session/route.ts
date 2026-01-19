import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { authenticated: false, session: null },
      { status: 200 }
    );
  }

  // Return session data (excluding sensitive info if needed)
  return NextResponse.json({
    authenticated: true,
    session: {
      userId: session.userId,
      email: session.email,
      role: session.role,
      expiresAt: new Date(session.expiresAt).toISOString(),
      expiresIn:
        Math.floor((session.expiresAt - Date.now()) / (1000 * 60 * 60 * 24)) +
        " days",
    },
  });
}
