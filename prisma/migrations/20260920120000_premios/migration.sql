-- CreateTable
CREATE TABLE "GameScore" (
    "id" TEXT NOT NULL,
    "deviceKey" TEXT NOT NULL,
    "game" TEXT NOT NULL,
    "best" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prize" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "deviceKey" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedAt" TIMESTAMP(3),
    "redeemedBy" TEXT,

    CONSTRAINT "Prize_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameScore_deviceKey_game_key" ON "GameScore"("deviceKey", "game");

-- CreateIndex
CREATE UNIQUE INDEX "Prize_code_key" ON "Prize"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Prize_deviceKey_day_key" ON "Prize"("deviceKey", "day");
