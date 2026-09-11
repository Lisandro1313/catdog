-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LedgerKind" ADD VALUE 'CONTRIBUTION';
ALTER TYPE "LedgerKind" ADD VALUE 'WITHDRAWAL';

-- AlterTable
ALTER TABLE "LedgerEntry" ADD COLUMN     "fromPocket" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);
