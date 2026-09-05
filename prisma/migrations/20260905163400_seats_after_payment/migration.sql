-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "address" TEXT;

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "quantity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "seatsChosenAt" TIMESTAMP(3);
