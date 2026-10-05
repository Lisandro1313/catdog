-- Las reacciones de la sobremesa: un emoji por persona y por mensaje.
-- Sin clave foránea a propósito: sirve para temas y para respuestas, y los huérfanos se limpian
-- cuando se borra el tema (ver borrarTemaDefinitivo).
CREATE TABLE "Reaccion" (
    "id" TEXT NOT NULL,
    "sobre" TEXT NOT NULL,
    "objetoId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "deviceKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reaccion_pkey" PRIMARY KEY ("id")
);

-- Una persona no puede poner dos veces el mismo emoji en el mismo mensaje.
CREATE UNIQUE INDEX "Reaccion_sobre_objetoId_emoji_deviceKey_key" ON "Reaccion"("sobre", "objetoId", "emoji", "deviceKey");

CREATE INDEX "Reaccion_sobre_objetoId_idx" ON "Reaccion"("sobre", "objetoId");
