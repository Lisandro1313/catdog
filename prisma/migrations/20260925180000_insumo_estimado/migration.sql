-- Marca los insumos cuyo precio se cargó a ojo y todavía nadie confirmó contra un ticket.
ALTER TABLE "Insumo" ADD COLUMN "estimado" BOOLEAN NOT NULL DEFAULT false;
