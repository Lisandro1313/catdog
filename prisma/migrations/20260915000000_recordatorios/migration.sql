-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "reviewsRequestedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "remindedAt" TIMESTAMP(3);
