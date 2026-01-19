/**
 * Migration script to reset payment records for testing
 * 
 * This script:
 * 1. Deletes all payment records
 * 2. Resets all meal orders back to PENDING status
 * 3. Allows you to test the payment flow again from scratch
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetPayments() {
  console.log("Starting payment reset...\n");

  try {
    // Count existing records
    const paymentCount = await prisma.payment.count();
    const mealOrderCount = await prisma.mealOrder.count();
    const paidOrderCount = await prisma.mealOrder.count({
      where: {
        status: "PAID",
      },
    });

    console.log(`Found ${paymentCount} payment record(s)`);
    console.log(`Found ${mealOrderCount} meal order(s) (${paidOrderCount} PAID)\n`);

    if (paymentCount === 0 && mealOrderCount === 0) {
      console.log("No payments or meal orders to reset. Nothing to do.");
      return;
    }

    // Delete all payment records
    console.log("Deleting all payment records...");
    const deletedPayments = await prisma.payment.deleteMany({});
    console.log(`✓ Deleted ${deletedPayments.count} payment record(s)\n`);

    // Delete all meal order menu items first (foreign key constraint)
    console.log("Deleting meal order menu items...");
    const deletedMenuItems = await prisma.mealOrderMenuItem.deleteMany({});
    console.log(`✓ Deleted ${deletedMenuItems.count} meal order menu item(s)\n`);

    // Delete all meal orders
    console.log("Deleting all meal orders...");
    const deletedOrders = await prisma.mealOrder.deleteMany({});
    console.log(`✓ Deleted ${deletedOrders.count} meal order(s)\n`);

    // Verify reset
    const remainingPayments = await prisma.payment.count();
    const remainingOrders = await prisma.mealOrder.count();

    console.log("Verification:");
    console.log(`  Remaining payments: ${remainingPayments}`);
    console.log(`  Remaining meal orders: ${remainingOrders}`);

    if (remainingPayments === 0 && remainingOrders === 0) {
      console.log("\n✓ Payment and meal order reset completed successfully!");
      console.log("\nYou can now test the payment flow again from scratch.");
    } else {
      console.log("\n⚠ Warning: Some records may still exist");
    }
  } catch (error) {
    console.error("Error resetting payments:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reset
resetPayments()
  .then(() => {
    console.log("\nReset completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nReset failed:", error);
    process.exit(1);
  });
