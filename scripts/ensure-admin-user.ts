/**
 * Deployment script to ensure admin user exists
 * 
 * This script ensures that the primary admin user (Bryon Bean) exists in the database.
 * It's safe to run multiple times (idempotent).
 * 
 * Run this as part of the deployment process to ensure admin access is always available.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_USER = {
  email: "bryonbean@gmail.com",
  name: "Bryon Bean",
  role: "ADMIN",
};

async function ensureAdminUser() {
  console.log("Ensuring admin user exists...\n");

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
        await prisma.user.update({
          where: { email: ADMIN_USER.email },
          data: {
            name: ADMIN_USER.name,
            role: ADMIN_USER.role,
          },
        });
        console.log(
          `✓ Updated admin user: ${ADMIN_USER.name} (${ADMIN_USER.email}) - Role: ${ADMIN_USER.role}`
        );
      } else {
        console.log(
          `✓ Admin user already exists: ${ADMIN_USER.name} (${ADMIN_USER.email})`
        );
      }
    } else {
      // Create admin user
      const user = await prisma.user.create({
        data: {
          email: ADMIN_USER.email,
          name: ADMIN_USER.name,
          role: ADMIN_USER.role,
          profileCompleted: false, // Will be set when they complete profile
        },
      });
      console.log(
        `✓ Created admin user: ${user.name} (${user.email}) - Role: ${user.role} - ID: ${user.id}`
      );
    }

    console.log("\n✨ Admin user check completed successfully!");
  } catch (error) {
    console.error("Error ensuring admin user:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
ensureAdminUser()
  .then(() => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((e) => {
    console.error("\n⚠️  Warning: Could not ensure admin user during build:", e.message);
    console.log("💡 This is normal if the database is not accessible during build.");
    console.log("💡 You can manually ensure the admin user by:");
    console.log("   1. Calling GET /api/admin/ensure-admin after deployment");
    console.log("   2. Or running: yarn ensure:admin");
    console.log("\n⚠️  Continuing build despite admin user check failure...\n");
    // Exit with 0 to allow build to continue
    process.exit(0);
  });
