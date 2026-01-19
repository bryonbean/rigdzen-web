/**
 * Script to delete all retreats except retreat with id = 1
 * 
 * This script:
 * 1. Finds all retreats except id = 1
 * 2. Deletes them (cascade will handle related meals, duties, orders, etc.)
 * 3. Reports what was deleted
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteOtherRetreats() {
  console.log("Starting deletion of retreats (except id = 1)...\n");

  try {
    // Check if retreat with id = 1 exists
    const retreat1 = await prisma.retreat.findUnique({
      where: { id: 1 },
      select: { id: true, name: true },
    });

    if (!retreat1) {
      console.log("⚠️  Warning: Retreat with id = 1 does not exist.");
      console.log("   All retreats will be deleted.\n");
    } else {
      console.log(`✓ Found retreat to keep: ${retreat1.name} (id: ${retreat1.id})\n`);
    }

    // Get all retreats except id = 1
    const retreatsToDelete = await prisma.retreat.findMany({
      where: {
        id: { not: 1 },
      },
      select: {
        id: true,
        name: true,
        startDate: true,
      },
      orderBy: { id: "asc" },
    });

    if (retreatsToDelete.length === 0) {
      console.log("No retreats to delete (only retreat id = 1 exists or no retreats exist).");
      return;
    }

    console.log(`Found ${retreatsToDelete.length} retreat(s) to delete:\n`);
    retreatsToDelete.forEach((retreat) => {
      console.log(`  - ${retreat.name} (id: ${retreat.id})`);
    });

    console.log("\nDeleting retreats (this will cascade delete meals, duties, orders, etc.)...");

    // Delete all retreats except id = 1
    // Cascade will handle related records
    const result = await prisma.retreat.deleteMany({
      where: {
        id: { not: 1 },
      },
    });

    console.log(`\n✓ Deleted ${result.count} retreat(s)`);

    // Verify deletion
    const remainingRetreats = await prisma.retreat.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { id: "asc" },
    });

    console.log("\nRemaining retreats:");
    if (remainingRetreats.length === 0) {
      console.log("  (none)");
    } else {
      remainingRetreats.forEach((retreat) => {
        console.log(`  - ${retreat.name} (id: ${retreat.id})`);
      });
    }

    console.log("\n✨ Deletion completed successfully!");
  } catch (error) {
    console.error("Error deleting retreats:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the deletion
deleteOtherRetreats()
  .then(() => {
    console.log("\n✅ Deletion completed successfully");
    process.exit(0);
  })
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  });
