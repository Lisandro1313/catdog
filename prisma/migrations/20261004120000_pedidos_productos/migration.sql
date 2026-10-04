-- Pedidos anticipados de los productos de la casa: alguien dice "lo quiero" antes de que se produzca.
CREATE TABLE "PedidoProducto" (
    "id" TEXT NOT NULL,
    "producto" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "contacto" TEXT NOT NULL,
    "mensaje" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'nuevo',
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "PedidoProducto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PedidoProducto_producto_estado_idx" ON "PedidoProducto"("producto", "estado");
