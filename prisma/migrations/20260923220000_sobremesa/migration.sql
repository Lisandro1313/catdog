-- La sobremesa: temas y respuestas.
CREATE TABLE "Tema" (
    "id" TEXT NOT NULL,
    "eventId" TEXT,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "deviceKey" TEXT NOT NULL,
    "fromHouse" BOOLEAN NOT NULL DEFAULT false,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "hiddenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tema_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Respuesta" (
    "id" TEXT NOT NULL,
    "temaId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "deviceKey" TEXT NOT NULL,
    "fromHouse" BOOLEAN NOT NULL DEFAULT false,
    "hiddenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Respuesta_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Tema_hiddenAt_pinned_lastAt_idx" ON "Tema"("hiddenAt", "pinned", "lastAt");
CREATE INDEX "Respuesta_temaId_createdAt_idx" ON "Respuesta"("temaId", "createdAt");

ALTER TABLE "Tema" ADD CONSTRAINT "Tema_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Respuesta" ADD CONSTRAINT "Respuesta_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "Tema"("id") ON DELETE CASCADE ON UPDATE CASCADE;
