-- CreateTable
CREATE TABLE "Retreat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "location" TEXT,
    "mealOrderDeadline" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Meal" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "retreatId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "mealDate" DATETIME NOT NULL,
    "price" REAL NOT NULL DEFAULT 0.0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Meal_retreatId_fkey" FOREIGN KEY ("retreatId") REFERENCES "Retreat" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MealOrder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "retreatId" INTEGER NOT NULL,
    "mealId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MealOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MealOrder_retreatId_fkey" FOREIGN KEY ("retreatId") REFERENCES "Retreat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MealOrder_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Duty" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "retreatId" INTEGER NOT NULL,
    "userId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignedAt" DATETIME,
    "completedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Duty_retreatId_fkey" FOREIGN KEY ("retreatId") REFERENCES "Retreat" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Duty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "mealOrderId" INTEGER,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "paypalOrderId" TEXT,
    "paypalPayerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_mealOrderId_fkey" FOREIGN KEY ("mealOrderId") REFERENCES "MealOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RetreatRegistration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "retreatId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RetreatRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RetreatRegistration_retreatId_fkey" FOREIGN KEY ("retreatId") REFERENCES "Retreat" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Retreat_startDate_idx" ON "Retreat"("startDate");

-- CreateIndex
CREATE INDEX "Retreat_status_idx" ON "Retreat"("status");

-- CreateIndex
CREATE INDEX "Meal_retreatId_idx" ON "Meal"("retreatId");

-- CreateIndex
CREATE INDEX "Meal_mealDate_idx" ON "Meal"("mealDate");

-- CreateIndex
CREATE INDEX "MealOrder_userId_idx" ON "MealOrder"("userId");

-- CreateIndex
CREATE INDEX "MealOrder_retreatId_idx" ON "MealOrder"("retreatId");

-- CreateIndex
CREATE INDEX "MealOrder_status_idx" ON "MealOrder"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MealOrder_userId_mealId_key" ON "MealOrder"("userId", "mealId");

-- CreateIndex
CREATE INDEX "Duty_retreatId_idx" ON "Duty"("retreatId");

-- CreateIndex
CREATE INDEX "Duty_userId_idx" ON "Duty"("userId");

-- CreateIndex
CREATE INDEX "Duty_status_idx" ON "Duty"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_mealOrderId_key" ON "Payment"("mealOrderId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paypalOrderId_key" ON "Payment"("paypalOrderId");

-- CreateIndex
CREATE INDEX "RetreatRegistration_userId_idx" ON "RetreatRegistration"("userId");

-- CreateIndex
CREATE INDEX "RetreatRegistration_retreatId_idx" ON "RetreatRegistration"("retreatId");

-- CreateIndex
CREATE UNIQUE INDEX "RetreatRegistration_userId_retreatId_key" ON "RetreatRegistration"("userId", "retreatId");
