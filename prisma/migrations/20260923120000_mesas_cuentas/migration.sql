-- AlterTable
ALTER TABLE "Event" ADD COLUMN "salaCode" TEXT;

-- CreateTable
CREATE TABLE "Cuenta" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "table" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "reservationId" TEXT,
    "deviceKey" TEXT NOT NULL,
    "cover" INTEGER NOT NULL,
    "coverNote" TEXT,
    "coverPaidAt" TIMESTAMP(3),
    "coverVia" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "closedVia" TEXT,

    CONSTRAINT "Cuenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consumo" (
    "id" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "stepIndex" INTEGER,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "price" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pendiente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doneAt" TIMESTAMP(3),

    CONSTRAINT "Consumo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Cuenta_eventId_table_idx" ON "Cuenta"("eventId", "table");

-- CreateIndex
CREATE INDEX "Cuenta_eventId_deviceKey_idx" ON "Cuenta"("eventId", "deviceKey");

-- CreateIndex
CREATE INDEX "Consumo_cuentaId_idx" ON "Consumo"("cuentaId");

-- AddForeignKey
ALTER TABLE "Cuenta" ADD CONSTRAINT "Cuenta_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consumo" ADD CONSTRAINT "Consumo_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
