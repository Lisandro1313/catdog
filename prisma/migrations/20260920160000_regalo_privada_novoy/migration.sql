-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "unlisted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "declinedAt" TIMESTAMP(3),
ADD COLUMN     "giftEmail" TEXT,
ADD COLUMN     "giftMessage" TEXT,
ADD COLUMN     "giftName" TEXT;
