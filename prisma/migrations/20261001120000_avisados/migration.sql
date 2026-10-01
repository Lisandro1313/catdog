-- La lista de avisos: gente que dejó su WhatsApp para que le contemos qué hay esta semana.
-- Tabla nueva y nada más: no toca ninguna de las que ya están.
CREATE TABLE "Avisado" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "nombre" TEXT NOT NULL DEFAULT '',
    "de" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bajaAt" TIMESTAMP(3),

    CONSTRAINT "Avisado_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Avisado_phone_key" ON "Avisado"("phone");

CREATE INDEX "Avisado_createdAt_idx" ON "Avisado"("createdAt");
