-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "welcomeDrink" TEXT;

-- CreateTable
CREATE TABLE "EventStep" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "secret" TEXT,
    "decoys" TEXT,
    "why" TEXT,

    CONSTRAINT "EventStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guess" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "stepIndex" INTEGER NOT NULL,
    "deviceKey" TEXT NOT NULL,
    "choice" TEXT NOT NULL,
    "stake" INTEGER NOT NULL DEFAULT 1,
    "correct" BOOLEAN NOT NULL,
    "table" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Guess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventStep_eventId_index_key" ON "EventStep"("eventId", "index");

-- CreateIndex
CREATE UNIQUE INDEX "Guess_eventId_stepIndex_deviceKey_key" ON "Guess"("eventId", "stepIndex", "deviceKey");

-- CreateIndex
CREATE INDEX "Guess_eventId_stepIndex_idx" ON "Guess"("eventId", "stepIndex");

-- AddForeignKey
ALTER TABLE "EventStep" ADD CONSTRAINT "EventStep_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guess" ADD CONSTRAINT "Guess_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
