-- ============================================================================
-- US-7.5 / RF-26: auditoria del modo ejercicio del administrador.
--
-- Cambio aditivo: no se modifica ni se borra ninguna tabla existente. Se crea
-- una tabla nueva (append-only) con la FK hacia "usuario" y los indices que
-- necesita. El enum "rol_usuario" se reutiliza tal cual.
--
-- La tabla registra unicamente el alcance de US-7.5: el inicio y el fin del
-- modo ejercicio y las escrituras hechas mientras se ejerce. La auditoria
-- general de todo el sistema (RNF-04) sigue fuera de alcance.
-- ============================================================================

-- CreateEnum
CREATE TYPE "accion_auditoria" AS ENUM ('ejercicio_inicio', 'ejercicio_fin', 'crear_evolucion', 'guardar_disponibilidad', 'crear_movimiento_stock', 'crear_vacuna', 'actualizar_vacuna', 'crear_turno_vacunacion', 'cancelar_turno_vacunacion');

-- CreateEnum
CREATE TYPE "entidad_auditoria" AS ENUM ('ejercicio', 'registro_clinico', 'horario_atencion', 'movimiento_stock', 'vacuna', 'turno_vacunacion');

-- CreateTable
CREATE TABLE "auditoria" (
    "id_auditoria" UUID NOT NULL,
    "id_usuario" UUID NOT NULL,
    "rol_efectivo" "rol_usuario" NOT NULL,
    "accion" "accion_auditoria" NOT NULL,
    "entidad" "entidad_auditoria",
    "id_entidad" UUID,
    "id_objetivo" UUID,
    "detalles" JSONB,
    "fecha_hora" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id_auditoria")
);

-- CreateIndex
CREATE INDEX "auditoria_id_usuario_fecha_hora_idx" ON "auditoria"("id_usuario", "fecha_hora");

-- CreateIndex
CREATE INDEX "auditoria_entidad_id_entidad_idx" ON "auditoria"("entidad", "id_entidad");

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- La auditoria es append-only, igual que "movimiento_stock" y "registro_clinico":
-- se reutiliza la funcion "fn_append_only" que ya creo la migracion de reforma.
CREATE TRIGGER "auditoria_no_update" BEFORE UPDATE ON "auditoria"
FOR EACH ROW EXECUTE FUNCTION "fn_append_only"();
CREATE TRIGGER "auditoria_no_delete" BEFORE DELETE ON "auditoria"
FOR EACH ROW EXECUTE FUNCTION "fn_append_only"();
