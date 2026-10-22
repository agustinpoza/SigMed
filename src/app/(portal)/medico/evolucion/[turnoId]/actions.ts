"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma, isUniqueViolation } from "@/lib/db";
import { type FieldErrors, hasErrors, isUuid, requiredText } from "@/lib/forms";
import { requireMedico } from "@/lib/actor-guard";
import { obtenerTurnoParaEvolucion } from "@/lib/clinical-records";
import { CLINICAL_RECORD_MAX_LENGTH } from "@/lib/clinical-records-limits";
import { AppointmentState, AuditAction, AuditEntity } from "@/generated/prisma/enums";
import { buildExerciseAudit, insertAudit } from "@/lib/audit";

export type EvolutionFormState = {
  errors?: FieldErrors;
  message?: string;
  values?: Record<string, string>;
};

function optionalText(value: FormDataEntryValue | null) {
  const raw = typeof value === "string" ? value.trim() : "";
  return raw || null;
}

function checkLength(
  value: string | null,
  field: keyof typeof CLINICAL_RECORD_MAX_LENGTH,
  errors: FieldErrors,
  label: string,
) {
  const max = CLINICAL_RECORD_MAX_LENGTH[field];

  if (value && value.length > max) {
    errors[field] = `${label} no puede superar ${max} caracteres.`;
  }
}

export async function registrarEvolucion(
  _previous: EvolutionFormState,
  formData: FormData,
): Promise<EvolutionFormState> {
  const errors: FieldErrors = {};

  const turnoId = requiredText(formData.get("turnoId"), "turnoId", errors, "El turno");
  if (turnoId && !isUuid(turnoId)) {
    errors.turnoId = "El turno seleccionado no es válido.";
  }

  const diagnosis = requiredText(formData.get("diagnosis"), "diagnosis", errors, "El diagnóstico");
  const treatment = optionalText(formData.get("treatment"));
  const indications = optionalText(formData.get("indications"));

  checkLength(diagnosis, "diagnosis", errors, "El diagnóstico");
  checkLength(treatment, "treatment", errors, "El tratamiento");
  checkLength(indications, "indications", errors, "Las indicaciones");

  const values = {
    diagnosis,
    treatment: treatment ?? "",
    indications: indications ?? "",
  };

  if (hasErrors(errors)) {
    return { errors, values };
  }

  const guard = await requireMedico();

  if ("error" in guard) {
    return { message: guard.error, values };
  }

  // CA1: el registro se asienta sobre un turno propio del médico, por lo que
  // queda en la ficha del paciente de ese turno.
  const turno = await obtenerTurnoParaEvolucion(turnoId, guard.actor.id);

  if (!turno) {
    return { message: "El turno no existe o no pertenece a tu agenda.", values };
  }

  if (turno.status !== AppointmentState.ATENDIDO) {
    return {
      message: "Solo se puede registrar la evolución de un turno atendido.",
      values,
    };
  }

  if (turno.clinicalRecord) {
    return { message: "Este turno ya tiene una evolución registrada.", values };
  }

  const audit = buildExerciseAudit(guard.context, {
    action: AuditAction.CREAR_EVOLUCION,
    entity: AuditEntity.REGISTRO_CLINICO,
    details: { turnoId: turno.id, pacienteId: turno.patientId },
  });

  try {
    await prisma.$transaction(async (tx) => {
      const record = await tx.clinicalRecord.create({
        data: { appointmentId: turno.id, diagnosis, treatment, indications },
      });

      if (audit) {
        await insertAudit(tx, { ...audit, entityId: record.id });
      }
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { message: "Este turno ya tiene una evolución registrada.", values };
    }

    throw error;
  }

  const historial = `/medico/pacientes/${turno.patientId}/historial`;

  revalidatePath("/medico/agenda");
  revalidatePath("/paciente/historial");
  revalidatePath(historial);

  redirect(`${historial}?registrado=1`);
}
