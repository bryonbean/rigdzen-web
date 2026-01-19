-- CreateTable
CREATE TABLE "MenuItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mealId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requiresQuantity" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MenuItem_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MealOrderMenuItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mealOrderId" INTEGER NOT NULL,
    "menuItemId" INTEGER NOT NULL,
    "quantity" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MealOrderMenuItem_mealOrderId_fkey" FOREIGN KEY ("mealOrderId") REFERENCES "MealOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MealOrderMenuItem_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MenuItem_mealId_idx" ON "MenuItem"("mealId");

-- CreateIndex
CREATE INDEX "MealOrderMenuItem_mealOrderId_idx" ON "MealOrderMenuItem"("mealOrderId");

-- CreateIndex
CREATE INDEX "MealOrderMenuItem_menuItemId_idx" ON "MealOrderMenuItem"("menuItemId");

-- CreateIndex
CREATE UNIQUE INDEX "MealOrderMenuItem_mealOrderId_menuItemId_key" ON "MealOrderMenuItem"("mealOrderId", "menuItemId");
