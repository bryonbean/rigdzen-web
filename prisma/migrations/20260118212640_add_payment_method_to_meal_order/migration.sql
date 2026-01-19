-- AlterTable
ALTER TABLE "MealOrder" ADD COLUMN "paymentMethod" TEXT;

-- CreateIndex
CREATE INDEX "MealOrder_paymentMethod_idx" ON "MealOrder"("paymentMethod");
