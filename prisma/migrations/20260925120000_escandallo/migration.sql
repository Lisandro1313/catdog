-- El escandallo: insumos que se compran, recetas y qué lleva cada receta.
-- Todo nuevo y aparte: no toca ninguna tabla existente.

CREATE TABLE "Insumo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "unidad" TEXT NOT NULL DEFAULT 'g',
    "precio" INTEGER NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "merma" INTEGER NOT NULL DEFAULT 0,
    "category" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Insumo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Insumo_nombre_key" ON "Insumo"("nombre");

CREATE TABLE "Receta" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "porciones" INTEGER NOT NULL DEFAULT 1,
    "precioVenta" INTEGER,
    "notas" TEXT,
    "cartaItem" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receta_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Receta_cartaItem_idx" ON "Receta"("cartaItem");

CREATE TABLE "RecetaItem" (
    "id" TEXT NOT NULL,
    "recetaId" TEXT NOT NULL,
    "insumoId" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "merma" INTEGER,

    CONSTRAINT "RecetaItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RecetaItem_recetaId_idx" ON "RecetaItem"("recetaId");
CREATE UNIQUE INDEX "RecetaItem_recetaId_insumoId_key" ON "RecetaItem"("recetaId", "insumoId");

-- Una receta borrada se lleva sus ingredientes; un insumo usado en alguna receta no se puede borrar.
ALTER TABLE "RecetaItem" ADD CONSTRAINT "RecetaItem_recetaId_fkey" FOREIGN KEY ("recetaId") REFERENCES "Receta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecetaItem" ADD CONSTRAINT "RecetaItem_insumoId_fkey" FOREIGN KEY ("insumoId") REFERENCES "Insumo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
