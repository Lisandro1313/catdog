-- CreateTable
CREATE TABLE "BarSale" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "table" INTEGER NOT NULL,
    "item" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "settledAt" TIMESTAMP(3),

    CONSTRAINT "BarSale_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BarSale_eventId_table_item_key" ON "BarSale"("eventId", "table", "item");

-- AddForeignKey
ALTER TABLE "BarSale" ADD CONSTRAINT "BarSale_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
