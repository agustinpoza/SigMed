-- Sprint 3 (US-4.2 / US-4.4 / US-4.7)
-- 1. Trazabilidad de la validacion de cobertura del paciente.
-- 2. El pago pasa a tener estado y concepto para representar intentos online
--    (pendiente / aprobado / rechazado) y deudas por inasistencia.
--    Los pagos preexistentes se consideran cobros confirmados.

CREATE TYPE "estado_pago" AS ENUM ('pendiente', 'aprobado', 'rechazado', 'anulado');
CREATE TYPE "concepto_pago" AS ENUM ('consulta', 'inasistencia');

ALTER TABLE "paciente"
    ADD COLUMN "fecha_validacion_cobertura" TIMESTAMPTZ(3),
    ADD COLUMN "id_usuario_validacion_cobertura" UUID,
    ADD COLUMN "nota_validacion_cobertura" TEXT;

CREATE INDEX "paciente_id_usuario_validacion_cobertura_idx"
    ON "paciente"("id_usuario_validacion_cobertura");

ALTER TABLE "paciente"
    ADD CONSTRAINT "paciente_id_usuario_validacion_cobertura_fkey"
    FOREIGN KEY ("id_usuario_validacion_cobertura")
    REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Los pagos registrados antes de esta migracion eran cobros ya concretados.
ALTER TABLE "pago"
    ADD COLUMN "estado" "estado_pago" NOT NULL DEFAULT 'pendiente',
    ADD COLUMN "concepto" "concepto_pago" NOT NULL DEFAULT 'consulta',
    ADD COLUMN "fecha_pago" TIMESTAMPTZ(3);

UPDATE "pago"
SET "estado" = 'aprobado',
    "fecha_pago" = "fecha_hora";

CREATE INDEX "pago_estado_concepto_idx" ON "pago"("estado", "concepto");
