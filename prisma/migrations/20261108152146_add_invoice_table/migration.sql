-- CreateEnum
CREATE TYPE "estado_factura" AS ENUM ('pendiente', 'pagada', 'anulada');

-- CreateTable
CREATE TABLE "factura" (
    "id_factura" UUID NOT NULL,
    "id_paciente" UUID NOT NULL,
    "fecha" TIMESTAMPTZ(3) NOT NULL,
    "tipo" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "estado" "estado_factura" NOT NULL,
    "ruta_archivo" TEXT,
    "fecha_alta" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3),

    CONSTRAINT "factura_pkey" PRIMARY KEY ("id_factura")
);

-- CreateIndex
CREATE UNIQUE INDEX "factura_numero_key" ON "factura"("numero");

-- CreateIndex
CREATE INDEX "factura_id_paciente_idx" ON "factura"("id_paciente");

-- AddForeignKey
ALTER TABLE "factura" ADD CONSTRAINT "factura_id_paciente_fkey" FOREIGN KEY ("id_paciente") REFERENCES "paciente"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;
