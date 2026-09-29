-- Quién entra a jugar con Google: lo justo para saber quién viene y cuántas veces.
CREATE TABLE "Jugador" (
    "id" TEXT NOT NULL,
    "googleSub" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "foto" TEXT,
    "noches" INTEGER NOT NULL DEFAULT 0,
    "ultimaDia" TEXT,
    "primeraAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimaAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Jugador_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Jugador_googleSub_key" ON "Jugador"("googleSub");
CREATE INDEX "Jugador_ultimaAt_idx" ON "Jugador"("ultimaAt");
