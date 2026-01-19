/**
 * Migration script to fix existing payment records
 * 
 * This script:
 * 1. Finds all PENDING payments and marks them as COMPLETED
 * 2. Recalculates payment amounts based on actual meal order costs
 * 3. Ensures payment amounts match the meal price * max quantity
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixPaymentRecords() {
  console.log("Starting payment records fix...\n");

  try {
    // Find all PENDING payments
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        mealOrder: {
          include: {
            meal: true,
            menuItems: {
              include: {
                menuItem: true,
              },
            },
          },
        },
      },
    });

    console.log(`Found ${pendingPayments.length} PENDING payment(s) to fix\n`);

    for (const payment of pendingPayments) {
      if (!payment.mealOrderId || !payment.mealOrder) {
        console.log(
          `Skipping payment ${payment.id} - no meal order linked (tracking payment)`
        );
        continue;
      }

      const order = payment.mealOrder;
      const meal = order.meal;

      // Calculate correct amount based on meal price and quantities
      const quantities = order.menuItems
        .map((item) => item.quantity)
        .filter((q): q is number => q !== null);
      const maxQuantity = quantities.length > 0 ? Math.max(...quantities) : 1;
      const correctAmount = meal.price * maxQuantity;

      console.log(`Payment ${payment.id}:`);
      console.log(`  Meal Order: ${order.id} (${meal.name})`);
      console.log(`  Current amount: $${payment.amount.toFixed(2)}`);
      console.log(`  Correct amount: $${correctAmount.toFixed(2)}`);
      console.log(`  Status: ${payment.status} -> COMPLETED`);

      // Update payment with correct amount and status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          amount: correctAmount,
          status: "COMPLETED",
          completedAt: payment.completedAt || new Date(),
        },
      });

      console.log(`  ✓ Updated\n`);
    }

    // Verify all payments are now correct
    console.log("Verifying all payments...\n");

    const allPayments = await prisma.payment.findMany({
      where: {
        status: "COMPLETED",
      },
      include: {
        mealOrder: {
          include: {
            meal: true,
            menuItems: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    let totalAmount = 0;

    for (const payment of allPayments) {
      if (payment.mealOrder) {
        const order = payment.mealOrder;
        const quantities = order.menuItems
          .map((item) => item.quantity)
          .filter((q): q is number => q !== null);
        const maxQuantity =
          quantities.length > 0 ? Math.max(...quantities) : 1;
        const expectedAmount = order.meal.price * maxQuantity;

        const isCorrect =
          Math.abs(payment.amount - expectedAmount) < 0.01 &&
          payment.status === "COMPLETED";

        console.log(
          `Payment ${payment.id}: $${payment.amount.toFixed(2)} (${payment.mealOrder.meal.name}) - ${
            isCorrect ? "✓" : "✗ INCORRECT"
          }`
        );

        if (!isCorrect) {
          console.log(
            `  Expected: $${expectedAmount.toFixed(2)}, Status: COMPLETED`
          );
        }

        totalAmount += payment.amount;
      }
    }

    console.log(`\nTotal paid amount: $${totalAmount.toFixed(2)} CAD`);

    console.log("\n✓ Payment records fix completed successfully!");
  } catch (error) {
    console.error("Error fixing payment records:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
fixPaymentRecords()
  .then(() => {
    console.log("\nMigration completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nMigration failed:", error);
    process.exit(1);
  });
