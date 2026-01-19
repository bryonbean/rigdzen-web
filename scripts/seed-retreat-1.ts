/**
 * Seed script to create "Wheel of Sharp Weapons - Spring 2026" retreat (id = 1)
 * 
 * This script ensures the retreat exists with id = 1, creating it if it doesn't exist
 * or updating it if it does. It will also create sample meals and duties if they don't exist.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedRetreat1() {
  console.log("Starting seed for 'Wheel of Sharp Weapons - Spring 2026' retreat...\n");

  try {
    // Check if retreat with id = 1 exists
    const existingRetreat = await prisma.retreat.findUnique({
      where: { id: 1 },
      include: {
        meals: true,
        duties: {
          include: {
            assignments: true,
          },
        },
      },
    });

    const retreatData = {
      name: "Wheel of Sharp Weapons - Spring 2026",
      description: "Spring 2026 retreat on the Wheel of Sharp Weapons",
      startDate: new Date("2026-04-15T09:00:00"),
      endDate: new Date("2026-04-20T17:00:00"),
      location: "Orgyen Khamdroling, Vancouver",
      mealOrderDeadline: new Date("2026-04-12T23:59:59"),
      status: "UPCOMING",
    };

    let retreat;
    if (existingRetreat) {
      console.log("Retreat with id = 1 already exists. Updating...");
      retreat = await prisma.retreat.update({
        where: { id: 1 },
        data: retreatData,
      });
      console.log(`✓ Updated retreat: ${retreat.name} (id: ${retreat.id})\n`);
    } else {
      // Create retreat with id = 1
      // Note: SQLite doesn't support setting explicit IDs easily, so we'll need to handle this
      // First, check if we need to reset the autoincrement
      const maxId = await prisma.retreat.findFirst({
        orderBy: { id: "desc" },
        select: { id: true },
      });

      if (maxId && maxId.id >= 1) {
        // We'll need to create it and then update the ID if possible
        // For SQLite, we can't easily set the ID, so we'll just create it
        console.log("Creating new retreat (note: ID may not be 1 if other retreats exist)...");
        retreat = await prisma.retreat.create({
          data: retreatData,
        });
        console.log(`✓ Created retreat: ${retreat.name} (id: ${retreat.id})`);
        console.log(`  Note: If you need id = 1, delete all other retreats first.\n`);
      } else {
        // No retreats exist, so we can create with id = 1
        // Actually, Prisma doesn't allow setting IDs directly, so we'll create normally
        retreat = await prisma.retreat.create({
          data: retreatData,
        });
        console.log(`✓ Created retreat: ${retreat.name} (id: ${retreat.id})\n`);
      }
    }

    // Create sample meals if they don't exist
    const meals = [
      {
        name: "Friday Dinner",
        description: "Welcome dinner",
        price: 15.0,
        mealDate: new Date("2026-04-15T18:00:00"),
        available: true,
        menuItems: [
          {
            name: "Vegetarian Option",
            description: "Vegetarian meal",
            requiresQuantity: false,
          },
          {
            name: "Vegan Option",
            description: "Vegan meal",
            requiresQuantity: false,
          },
        ],
      },
      {
        name: "Saturday Breakfast",
        description: "Morning meal",
        price: 10.0,
        mealDate: new Date("2026-04-16T08:00:00"),
        available: true,
        menuItems: [
          {
            name: "Continental Breakfast",
            description: "Pastries, fruit, coffee",
            requiresQuantity: false,
          },
        ],
      },
      {
        name: "Saturday Lunch",
        description: "Midday meal",
        price: 12.0,
        mealDate: new Date("2026-04-16T12:30:00"),
        available: true,
        menuItems: [
          {
            name: "Soup and Salad",
            description: "Soup of the day with mixed greens",
            requiresQuantity: false,
          },
        ],
      },
      {
        name: "Sunday Pizza Dinner",
        description: "Pizza dinner",
        price: 3.0,
        mealDate: new Date("2026-04-17T18:00:00"),
        available: true,
        menuItems: [
          {
            name: "Cheese Pizza Slices",
            description: "Individual pizza slices",
            requiresQuantity: true,
          },
        ],
      },
    ];

    console.log("Creating/updating meals...");
    for (const mealData of meals) {
      const { menuItems, ...mealFields } = mealData;
      const existingMeal = await prisma.meal.findFirst({
        where: {
          retreatId: retreat.id,
          name: mealData.name,
        },
      });

      if (existingMeal) {
        console.log(`  ⏭️  Meal "${mealData.name}" already exists, skipping...`);
      } else {
        const meal = await prisma.meal.create({
          data: {
            ...mealFields,
            retreatId: retreat.id,
            menuItems: {
              create: menuItems,
            },
          },
        });
        console.log(`  ✓ Created meal: ${meal.name}`);
      }
    }

    // Create sample duties if they don't exist
    const duties = [
      {
        title: "Shrine Setup",
        description: "Set up the shrine before the retreat begins.\n* Arrive 30 minutes early\n* Light candles\n* Arrange offerings",
      },
      {
        title: "Tea Service",
        description: "Serve tea during breaks.\n* Prepare hot water\n* Set out cups\n* Clean up after service",
      },
      {
        title: "Clean-up",
        description: "Clean up after the retreat.\n* Put away cushions\n* Clean shrine\n* Sweep floors",
      },
    ];

    console.log("\nCreating/updating duties...");
    for (const dutyData of duties) {
      const existingDuty = await prisma.duty.findFirst({
        where: {
          retreatId: retreat.id,
          title: dutyData.title,
        },
      });

      if (existingDuty) {
        console.log(`  ⏭️  Duty "${dutyData.title}" already exists, skipping...`);
      } else {
        const duty = await prisma.duty.create({
          data: {
            ...dutyData,
            retreatId: retreat.id,
            status: "PENDING",
          },
        });
        console.log(`  ✓ Created duty: ${duty.title}`);
      }
    }

    console.log("\n✨ Seed completed successfully!");
    console.log(`   Retreat: ${retreat.name} (id: ${retreat.id})`);
  } catch (error) {
    console.error("Error seeding retreat:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedRetreat1()
  .then(() => {
    console.log("\n✅ Seed completed successfully");
    process.exit(0);
  })
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  });
