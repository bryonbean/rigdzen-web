/**
 * Upsert users from CSV file
 * 
 * Reads a CSV file with name,email columns and upserts users into the database.
 * Sets specified users as ADMIN role.
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";
import { parse } from "papaparse";

const prisma = new PrismaClient();

// Users to set as ADMIN
const ADMIN_USERS = ["Johanna Okker", "Patrick St-Amant"];

interface CSVRow {
  name: string;
  email: string;
}

async function upsertUsersFromCSV() {
  console.log("Starting user upsert from CSV...\n");

  try {
    // Read CSV file
    const csvPath = join(process.cwd(), ".local", "contact_list.csv");
    const csvContent = readFileSync(csvPath, "utf-8");

    // Parse CSV
    const parseResult = parse<CSVRow>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      transform: (value) => value.trim(),
    });

    if (parseResult.errors.length > 0) {
      console.error("CSV parsing errors:", parseResult.errors);
      throw new Error("Failed to parse CSV file");
    }

    const users = parseResult.data.filter(
      (row) => row.name && row.email && row.email.includes("@")
    );

    console.log(`Found ${users.length} users in CSV\n`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const userData of users) {
      try {
        // Determine role
        const isAdmin = ADMIN_USERS.includes(userData.name);
        const role = isAdmin ? "ADMIN" : "PARTICIPANT";

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email },
        });

        if (existingUser) {
          // Update existing user
          const needsUpdate =
            existingUser.name !== userData.name ||
            existingUser.role !== role;

          if (needsUpdate) {
            await prisma.user.update({
              where: { email: userData.email },
              data: {
                name: userData.name,
                role: role,
              },
            });

            console.log(
              `🔄 Updated: ${userData.name} (${userData.email}) - Role: ${role}`
            );
            updated++;
          } else {
            console.log(
              `⏭️  Skipped: ${userData.name} (${userData.email}) - no changes`
            );
            skipped++;
          }
        } else {
          // Create new user
          const user = await prisma.user.create({
            data: {
              email: userData.email,
              name: userData.name,
              role: role,
              profileCompleted: false,
            },
          });

          console.log(
            `✅ Created: ${user.name} (${user.email}) - Role: ${role} - ID: ${user.id}`
          );
          created++;
        }
      } catch (error: any) {
        console.error(
          `❌ Error processing ${userData.name} (${userData.email}):`,
          error.message
        );
      }
    }

    console.log(`\n✨ Upsert completed!`);
    console.log(`   ✅ Created: ${created}`);
    console.log(`   🔄 Updated: ${updated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   👑 Admin users: ${ADMIN_USERS.join(", ")}`);
  } catch (error: any) {
    console.error("Error upserting users:", error);
    throw error;
  }
}

// Run the upsert
upsertUsersFromCSV()
  .then(() => {
    console.log("\n✅ Upsert completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Upsert failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
