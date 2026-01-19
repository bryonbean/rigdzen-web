-- CreateTable
CREATE TABLE "DutyAssignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dutyId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    CONSTRAINT "DutyAssignment_dutyId_fkey" FOREIGN KEY ("dutyId") REFERENCES "Duty" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DutyAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DutyAssignment_dutyId_userId_key" ON "DutyAssignment"("dutyId", "userId");

-- CreateIndex
CREATE INDEX "DutyAssignment_dutyId_idx" ON "DutyAssignment"("dutyId");

-- CreateIndex
CREATE INDEX "DutyAssignment_userId_idx" ON "DutyAssignment"("userId");

-- CreateIndex
CREATE INDEX "DutyAssignment_status_idx" ON "DutyAssignment"("status");

-- Migrate existing duty assignments to DutyAssignment table
INSERT INTO "DutyAssignment" ("dutyId", "userId", "assignedAt", "completedAt", "status")
SELECT 
    "id" as "dutyId",
    "userId",
    COALESCE("assignedAt", CURRENT_TIMESTAMP) as "assignedAt",
    "completedAt",
    CASE 
        WHEN "completedAt" IS NOT NULL THEN 'COMPLETED'
        WHEN "userId" IS NOT NULL THEN 'ASSIGNED'
        ELSE 'ASSIGNED'
    END as "status"
FROM "Duty"
WHERE "userId" IS NOT NULL;

-- Drop the old columns from Duty table
CREATE TABLE "Duty_new" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "retreatId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Duty_retreatId_fkey" FOREIGN KEY ("retreatId") REFERENCES "Retreat" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Copy data from old table to new table
INSERT INTO "Duty_new" ("id", "retreatId", "title", "description", "status", "createdAt", "updatedAt")
SELECT "id", "retreatId", "title", "description", "status", "createdAt", "updatedAt"
FROM "Duty";

-- Drop old table
DROP TABLE "Duty";

-- Rename new table to original name
ALTER TABLE "Duty_new" RENAME TO "Duty";

-- Recreate indexes
CREATE INDEX "Duty_retreatId_idx" ON "Duty"("retreatId");
CREATE INDEX "Duty_status_idx" ON "Duty"("status");
