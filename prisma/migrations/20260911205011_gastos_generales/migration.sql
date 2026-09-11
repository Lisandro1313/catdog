-- AlterTable
ALTER TABLE "LedgerEntry" ADD COLUMN     "by" TEXT,
ADD COLUMN     "day" DATE NOT NULL DEFAULT CURRENT_DATE,
ALTER COLUMN "eventId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "LedgerEntry_day_idx" ON "LedgerEntry"("day");
