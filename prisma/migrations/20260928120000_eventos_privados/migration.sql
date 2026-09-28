-- Consultas de eventos privados (cumpleaños, juntadas): se piden con anticipación y se presupuestan.
CREATE TABLE "PedidoEvento" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contacto" TEXT NOT NULL,
    "email" TEXT,
    "fecha" TEXT NOT NULL,
    "personas" INTEGER NOT NULL,
    "paquete" TEXT,
    "conMesa" BOOLEAN NOT NULL DEFAULT false,
    "mensaje" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'consulta',
    "presupuesto" INTEGER,
    "sena" INTEGER,
    "notas" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "PedidoEvento_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PedidoEvento_estado_createdAt_idx" ON "PedidoEvento"("estado", "createdAt");
