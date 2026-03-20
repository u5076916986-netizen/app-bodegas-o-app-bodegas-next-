-- AlterEnum: Add REPARTIDOR to Rol
ALTER TYPE "Rol" ADD VALUE 'REPARTIDOR';

-- AlterTable: Add rating fields to Usuario
ALTER TABLE "Usuario"
  ADD COLUMN IF NOT EXISTS "rating"       DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "totalReviews" INTEGER          NOT NULL DEFAULT 0;

-- AlterTable: Add imagenUrl to Producto
ALTER TABLE "Producto"
  ADD COLUMN IF NOT EXISTS "imagenUrl" TEXT;

-- AlterTable: Add repartidor fields to pedidos
ALTER TABLE "pedidos"
  ADD COLUMN IF NOT EXISTS "repartidorId"     TEXT,
  ADD COLUMN IF NOT EXISTS "repartidorNombre" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "notas"            TEXT;

-- CreateIndex on pedidos
CREATE INDEX IF NOT EXISTS "pedidos_repartidorId_idx"  ON "pedidos"("repartidorId");
CREATE INDEX IF NOT EXISTS "pedidos_bodegaId_idx"      ON "pedidos"("bodegaId");
CREATE INDEX IF NOT EXISTS "pedidos_estado_idx"        ON "pedidos"("estado");
CREATE INDEX IF NOT EXISTS "pedidos_telefono_idx"      ON "pedidos"("telefono");

-- CreateTable: BodegaConfig
CREATE TABLE IF NOT EXISTS "BodegaConfig" (
    "id"               TEXT         NOT NULL,
    "bodegaId"         TEXT         NOT NULL,
    "suscripcionPlan"  TEXT         NOT NULL DEFAULT 'basico',
    "suscripcionVence" TIMESTAMP(3),
    "rating"           DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReviews"     INTEGER      NOT NULL DEFAULT 0,
    "activo"           BOOLEAN      NOT NULL DEFAULT true,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BodegaConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex on BodegaConfig
CREATE UNIQUE INDEX IF NOT EXISTS "BodegaConfig_bodegaId_key" ON "BodegaConfig"("bodegaId");
CREATE INDEX IF NOT EXISTS "BodegaConfig_bodegaId_idx"       ON "BodegaConfig"("bodegaId");
CREATE INDEX IF NOT EXISTS "BodegaConfig_suscripcionPlan_idx" ON "BodegaConfig"("suscripcionPlan");
