/**
 * Seed script to create test meal orders
 * 
 * Creates meal orders for users with:
 * - Some paid, some unpaid
 * - Pizza quantities ranging from 0-4 pieces
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedMealOrders() {
  console.log("Starting meal order seeding...\n");

  try {
    // Get all users
    const users = await prisma.user.findMany({
      orderBy: { name: "asc" },
    });

    if (users.length === 0) {
      console.log("❌ No users found. Please run seed:users first.");
      return;
    }

    // Get all retreats with meals and menu items
    const retreats = await prisma.retreat.findMany({
      include: {
        meals: {
          include: {
            menuItems: true,
          },
          orderBy: { mealDate: "asc" },
        },
      },
      orderBy: { startDate: "desc" },
    });

    if (retreats.length === 0) {
      console.log("❌ No retreats found. Please create a retreat first.");
      return;
    }

    console.log(`Found ${users.length} users and ${retreats.length} retreat(s)\n`);

    let ordersCreated = 0;
    let paymentsCreated = 0;

    // Process each retreat
    for (const retreat of retreats) {
      if (retreat.meals.length === 0) {
        console.log(`⏭️  Skipping ${retreat.name} - no meals`);
        continue;
      }

      console.log(`\n📋 Processing retreat: ${retreat.name}`);

      // Process each meal
      for (const meal of retreat.meals) {
        if (meal.menuItems.length === 0) {
          console.log(`  ⏭️  Skipping ${meal.name} - no menu items`);
          continue;
        }

        // Find pizza menu items (items that require quantity)
        const pizzaItems = meal.menuItems.filter((item) => item.requiresQuantity);
        const nonPizzaItems = meal.menuItems.filter((item) => !item.requiresQuantity);

        if (pizzaItems.length === 0 && nonPizzaItems.length === 0) {
          continue;
        }

        // Create orders for a subset of users (not all users order all meals)
        // Randomly select 60-80% of users for each meal
        const usersForMeal = users
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.floor(users.length * (0.6 + Math.random() * 0.2)));

        console.log(`  🍽️  ${meal.name}: Creating orders for ${usersForMeal.length} users`);

        for (const user of usersForMeal) {
          try {
            // Check if order already exists
            const existingOrder = await prisma.mealOrder.findUnique({
              where: {
                userId_mealId: {
                  userId: user.id,
                  mealId: meal.id,
                },
              },
            });

            if (existingOrder) {
              continue; // Skip if order already exists
            }

            // Build menu item selections
            const menuItemSelections: Array<{
              menuItemId: number;
              quantity: number | null;
            }> = [];

            // Add non-pizza items (always include at least one)
            if (nonPizzaItems.length > 0) {
              // Select 1-2 non-pizza items randomly
              const selectedNonPizza = nonPizzaItems
                .sort(() => Math.random() - 0.5)
                .slice(0, Math.min(2, Math.floor(Math.random() * 2) + 1));

              selectedNonPizza.forEach((item) => {
                menuItemSelections.push({
                  menuItemId: item.id,
                  quantity: null,
                });
              });
            }

            // Add pizza items with quantities 0-4
            if (pizzaItems.length > 0) {
              // Select 0-1 pizza items (not everyone orders pizza)
              // Ensure we get a good distribution of quantities 0-4
              if (Math.random() > 0.3) {
                // 70% chance of ordering pizza
                const selectedPizza = pizzaItems[
                  Math.floor(Math.random() * pizzaItems.length)
                ];
                // Distribute quantities more evenly: 0-4 pieces
                // Use a weighted random to ensure we get some 0s and 4s
                const rand = Math.random();
                let pizzaQuantity: number;
                if (rand < 0.15) {
                  pizzaQuantity = 0; // 15% chance of 0
                } else if (rand < 0.35) {
                  pizzaQuantity = 1; // 20% chance of 1
                } else if (rand < 0.55) {
                  pizzaQuantity = 2; // 20% chance of 2
                } else if (rand < 0.75) {
                  pizzaQuantity = 3; // 20% chance of 3
                } else {
                  pizzaQuantity = 4; // 25% chance of 4
                }

                menuItemSelections.push({
                  menuItemId: selectedPizza.id,
                  quantity: pizzaQuantity,
                });
              }
            }

            // Ensure at least one menu item is selected
            if (menuItemSelections.length === 0 && nonPizzaItems.length > 0) {
              menuItemSelections.push({
                menuItemId: nonPizzaItems[0].id,
                quantity: null,
              });
            }

            if (menuItemSelections.length === 0) {
              continue; // Skip if no menu items to select
            }

            // Create meal order
            const mealOrder = await prisma.mealOrder.create({
              data: {
                userId: user.id,
                retreatId: retreat.id,
                mealId: meal.id,
                status: "PENDING",
                menuItems: {
                  create: menuItemSelections.map((item) => ({
                    menuItemId: item.menuItemId,
                    quantity: item.quantity,
                  })),
                },
              },
            });

            ordersCreated++;

            // Randomly mark some orders as paid (60% chance)
            if (Math.random() < 0.6) {
              // Calculate order amount
              const quantities = menuItemSelections
                .map((item) => item.quantity)
                .filter((q): q is number => q !== null);
              const maxQuantity =
                quantities.length > 0 ? Math.max(...quantities) : 1;
              const amount = meal.price * maxQuantity;

              // Create payment record
              await prisma.payment.create({
                data: {
                  userId: user.id,
                  mealOrderId: mealOrder.id,
                  amount: amount,
                  currency: "CAD",
                  status: "COMPLETED",
                  completedAt: new Date(),
                },
              });

              // Update order status to PAID with PAYPAL payment method
              // (Note: In real scenario, seed script payments would be PAYPAL, but for testing we'll use CASH)
              await prisma.mealOrder.update({
                where: { id: mealOrder.id },
                data: { status: "PAID", paymentMethod: "CASH" },
              });

              paymentsCreated++;
            }

            // Log pizza quantities for verification
            const pizzaSelection = menuItemSelections.find(
              (item) =>
                pizzaItems.some((pizza) => pizza.id === item.menuItemId) &&
                item.quantity !== null
            );
            if (pizzaSelection) {
              const pizzaItem = pizzaItems.find(
                (p) => p.id === pizzaSelection.menuItemId
              );
              console.log(
                `    ✅ ${user.name}: ${pizzaItem?.name} (${pizzaSelection.quantity} pieces) - ${
                  mealOrder.status === "PAID" ? "PAID" : "PENDING"
                }`
              );
            }
          } catch (error: any) {
            console.error(
              `    ❌ Error creating order for ${user.name}:`,
              error.message
            );
          }
        }
      }
    }

    console.log(`\n✨ Seeding completed!`);
    console.log(`   📦 Orders created: ${ordersCreated}`);
    console.log(`   💰 Payments created: ${paymentsCreated}`);
    console.log(`   ⏳ Pending orders: ${ordersCreated - paymentsCreated}`);
  } catch (error: any) {
    console.error("Error seeding meal orders:", error);
    throw error;
  }
}

// Run the seed
seedMealOrders()
  .then(() => {
    console.log("\n✅ Seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
