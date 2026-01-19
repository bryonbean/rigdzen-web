import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { getSession } from "./session";

export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}?error=unauthorized`
    );
  }

  return null; // User is authenticated
}

export async function requireAdmin() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  if (session.role !== "ADMIN") {
    redirect("/dashboard?error=unauthorized");
  }

  return session; // User is authenticated and is admin
}
