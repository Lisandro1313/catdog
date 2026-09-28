-- La mesa de juegos (pool, ping pong, la que sea): se abre cuando empiezan y se cierra al cobrar.
CREATE TABLE "PartidaMesa" (
    "id" TEXT NOT NULL,
    "mesa" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "modo" TEXT,
    "minutos" INTEGER,
    "amount" INTEGER,
    "via" TEXT,
    "by" TEXT,

    CONSTRAINT "PartidaMesa_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PartidaMesa_closedAt_idx" ON "PartidaMesa"("closedAt");
