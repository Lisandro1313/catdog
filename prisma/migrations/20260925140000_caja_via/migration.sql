-- Cómo entró o salió cada peso, para poder separar la caja de efectivo de la virtual.
-- Columna nueva y opcional: los movimientos viejos quedan en NULL y se tratan como efectivo.
ALTER TABLE "LedgerEntry" ADD COLUMN "via" TEXT;
