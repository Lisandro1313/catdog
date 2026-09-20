-- DropIndex
DROP INDEX "GameScore_deviceKey_game_key";

-- AlterTable
ALTER TABLE "GameScore" ADD COLUMN     "day" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "GameScore_deviceKey_game_day_key" ON "GameScore"("deviceKey", "game", "day");

-- CreateIndex
CREATE INDEX "GameScore_game_best_idx" ON "GameScore"("game", "best");
