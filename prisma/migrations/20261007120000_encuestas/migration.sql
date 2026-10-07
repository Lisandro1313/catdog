-- Encuestas de la sobremesa: la casa pregunta y se vota con un toque.
CREATE TABLE "Encuesta" (
    "id" TEXT NOT NULL,
    "temaId" TEXT NOT NULL,
    "pregunta" TEXT NOT NULL,
    "opciones" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Encuesta_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VotoEncuesta" (
    "id" TEXT NOT NULL,
    "encuestaId" TEXT NOT NULL,
    "opcion" INTEGER NOT NULL,
    "deviceKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VotoEncuesta_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Encuesta_temaId_key" ON "Encuesta"("temaId");
CREATE INDEX "VotoEncuesta_encuestaId_idx" ON "VotoEncuesta"("encuestaId");
CREATE UNIQUE INDEX "VotoEncuesta_encuestaId_deviceKey_key" ON "VotoEncuesta"("encuestaId", "deviceKey");

ALTER TABLE "Encuesta" ADD CONSTRAINT "Encuesta_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "Tema"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VotoEncuesta" ADD CONSTRAINT "VotoEncuesta_encuestaId_fkey" FOREIGN KEY ("encuestaId") REFERENCES "Encuesta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
