/**
 * API route to ensure admin user exists
 * 
 * This can be called after deployment to ensure the admin user is created.
 * Safe to call multiple times (idempotent).
 * 
 * GET /api/admin/ensure-admin
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ADMIN_USER = {
  email: "bryonbean@gmail.com",
  name: "Bryon Bean",
  role: "ADMIN",
};

export async function GET() {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: ADMIN_USER.email },
    });

    if (existingUser) {
      // Update if role or name has changed
      if (
        existingUser.role !== ADMIN_USER.role ||
        existingUser.name !== ADMIN_USER.name
      ) {
        const updated = await prisma.user.update({
          where: { email: ADMIN_USER.email },
          data: {
            name: ADMIN_USER.name,
            role: ADMIN_USER.role,
          },
        });
        return NextResponse.json({
          success: true,
          action: "updated",
          user: {
            id: updated.id,
            email: updated.email,
            name: updated.name,
            role: updated.role,
          },
        });
      } else {
        return NextResponse.json({
          success: true,
          action: "exists",
          user: {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
            role: existingUser.role,
          },
        });
      }
    } else {
      // Create admin user
      const user = await prisma.user.create({
        data: {
          email: ADMIN_USER.email,
          name: ADMIN_USER.name,
          role: ADMIN_USER.role,
          profileCompleted: false,
        },
      });
      return NextResponse.json({
        success: true,
        action: "created",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    }
  } catch (error) {
    console.error("Error ensuring admin user:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to ensure admin user",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
