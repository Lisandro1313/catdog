-- AlterTable
ALTER TABLE "Event" ADD COLUMN "servedStep" INTEGER,
ADD COLUMN "servedAt" TIMESTAMP(3),
ADD COLUMN "recipeGift" TEXT,
ADD COLUMN "recipeSentAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Huella" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "deviceKey" TEXT NOT NULL,
    "table" INTEGER,
    "name" TEXT NOT NULL,
    "text" TEXT,
    "photoUrl" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Huella_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voto" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "deviceKey" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "choice" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Voto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "deviceKey" TEXT NOT NULL,
    "table" INTEGER NOT NULL,
    "item" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'pendiente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doneAt" TIMESTAMP(3),

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sugerencia" (
    "id" TEXT NOT NULL,
    "eventId" TEXT,
    "deviceKey" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seenAt" TIMESTAMP(3),

    CONSTRAINT "Sugerencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Huella_eventId_idx" ON "Huella"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Voto_eventId_deviceKey_kind_key" ON "Voto"("eventId", "deviceKey", "kind");

-- CreateIndex
CREATE INDEX "Pedido_eventId_status_idx" ON "Pedido"("eventId", "status");

-- AddForeignKey
ALTER TABLE "Huella" ADD CONSTRAINT "Huella_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voto" ADD CONSTRAINT "Voto_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sugerencia" ADD CONSTRAINT "Sugerencia_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
