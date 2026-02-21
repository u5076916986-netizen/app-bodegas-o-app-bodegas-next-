-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'confirmado',
    "bodegaId" TEXT NOT NULL DEFAULT 'default',

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);
