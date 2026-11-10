"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdministrador } from "@/lib/actor-guard";
import { isUuid, type FieldErrors, hasErrors } from "@/lib/forms";
import { CoverageStatus } from "@/generated/prisma/enums";

export type CoverageFormState = {
  errors?: FieldErrors;
  message?: string;
  success?: boolean;
};

const MAX_NOTE_LENGTH = 300;

const STATUS_LABELS: Record<CoverageStatus, string> = {
  VALIDADA: "validada",
  RECHAZADA: "rechazada",
  PENDIENTE: "pendiente",
};

function rawValue(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * US-4.2 / RF-14: el administrador registra el resultado de la validación de
 * cobertura. Una cobertura solo puede quedar validada si la obra social está
 * aceptada y el paciente tiene número de afiliado.
 */
export async function validarCobertura(
  _previous: CoverageFormState,
  formData: FormData,
): Promise<CoverageFormState> {
  const errors: FieldErrors = {};

  const patientId = rawValue(formData, "patientId");
  const statusRaw = rawValue(formData, "status");
  const note = rawValue(formData, "note");

  if (!patientId) {
    errors.patientId = "El paciente es obligatorio.";
  } else if (!isUuid(patientId)) {
    errors.patientId = "El paciente indicado no es válido.";
  }

  if (!statusRaw) {
    errors.status = "Seleccioná el resultado de la validación.";
  } else if (!(statusRaw in STATUS_LABELS)) {
    errors.status = "El resultado de la validación no es válido.";
  }

  if (note.length > MAX_NOTE_LENGTH) {
    errors.note = `La nota no puede superar ${MAX_NOTE_LENGTH} caracteres.`;
  }

  if (hasErrors(errors) || !(statusRaw in STATUS_LABELS)) {
    return { errors };
  }

  const guard = await requireAdministrador();

  if ("error" in guard) {
    return { message: guard.error };
  }

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: { profile: true, insurance: true },
  });

  if (!patient) {
    return { message: "El paciente indicado no existe." };
  }

  if (!patient.insurance) {
    return {
      message:
        "El paciente no tiene una obra social registrada. Primero debe registrar su cobertura.",
    };
  }

  if (!patient.memberNumber?.trim()) {
    return {
      message:
        "El paciente no tiene número de afiliado: la cobertura no puede validarse.",
    };
  }

  const status = statusRaw as CoverageStatus;

  if (status === CoverageStatus.VALIDADA && !patient.insurance.accepted) {
    return {
      message: `${patient.insurance.name} no está aceptada por la institución: la cobertura no puede validarse.`,
    };
  }

  await prisma.patient.update({
    where: { id: patient.id },
    data: {
      coverageStatus: status,
      coverageValidatedAt: new Date(),
      coverageValidatedById: guard.actor.id,
      coverageValidationNote: note || null,
    },
  });

  revalidatePath("/admin/coberturas");

  return {
    success: true,
    message: `Cobertura de ${patient.profile.firstName} ${patient.profile.lastName} registrada como ${STATUS_LABELS[status]}.`,
  };
}
