'use server';
import { revalidatePath } from "next/cache";
import { CoverageStatus } from "@/generated/prisma/enums";
import { requireArea } from "@/lib/actor";
import { prisma } from "@/lib/db";
import { hasErrors, isUuid, requiredText, type FieldErrors } from "@/lib/forms";

export type CoverageFormValues = {
  insuranceId: string;
  memberNumber: string;
  plan: string;
};

export type CoverageFormState = {
  errors?: FieldErrors;
  message?: string;
  success?: boolean;
  values?: CoverageFormValues;
};

function rawValue(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export async function savePatientCoverage( _previous: CoverageFormState, formData: FormData, ): Promise<CoverageFormState> {
  const errors: FieldErrors = {};
  const insuranceId = requiredText(
    formData.get("insuranceId"),
    "insuranceId",
    errors,
    "La obra social o prepaga",
  );
  const memberNumber = requiredText(
    formData.get("memberNumber"),
    "memberNumber",
    errors,
    "El número de afiliado",
  );
  const plan = rawValue(formData, "plan");
  const values = { insuranceId, memberNumber, plan };

  if (insuranceId && !isUuid(insuranceId)) {
    errors.insuranceId = "Seleccioná una obra social o prepaga válida.";
  }

  if (hasErrors(errors)) {
    return { errors, values };
  }

  const context = await requireArea("paciente");
  const provider = await prisma.insuranceProvider.findFirst({
    where: { id: insuranceId, accepted: true },
    select: { id: true },
  });

  if (!provider) {
    return {
      errors: {
        insuranceId:
          "La obra social o prepaga seleccionada no está disponible para nuevos registros.",
      },
      values,
    };
  }

  const updated = await prisma.patient.updateMany({
    where: { id: context.effective.id },
    data: {
      insuranceId: provider.id,
      memberNumber,
      plan: plan || null,
      coverageStatus: CoverageStatus.PENDIENTE,
    },
  });

  if (updated.count === 0) {
    return {
      message: "No se encontró el registro del paciente. Contactá con administración.",
      values,
    };
  }

  revalidatePath("/paciente/cobertura-medica");

  return {
    success: true,
    message: "La cobertura se guardó y quedó pendiente de validación administrativa.",
    values,
  };
}