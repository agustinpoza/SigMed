"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { prisma, isUniqueViolation } from "@/lib/db";
import { type FieldErrors, hasErrors, requiredText } from "@/lib/forms";
import { requireAdministrador } from "@/lib/actor-guard";
import { STAFF_ROLE_LABELS, isStaffRole } from "@/lib/staff-roles";

export type StaffFormState = {
  errors?: FieldErrors;
  message?: string;
  success?: boolean;
  values?: Record<string, string>;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DNI_PATTERN = /^\d{7,9}$/;
const MAX_NAME_LENGTH = 80;

function rawValue(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Las reglas de contraseña (largo mínimo, complejidad) se configuran en el
 * dashboard de Clerk, así que se validan allá y acá solo se traducen.
 */
function passwordMessage(code: string, clerkMessage: string): string {
  switch (code) {
    case "form_password_length_too_short": {
      const minimo = clerkMessage.match(/\d+/)?.[0];
      return minimo
        ? `La contraseña debe tener al menos ${minimo} caracteres.`
        : "La contraseña es demasiado corta.";
    }
    case "form_password_pwned":
    case "form_password_compromised":
      return "Esa contraseña apareció en filtraciones conocidas. Elegí otra.";
    case "form_password_not_strong_enough":
      return "La contraseña es muy débil. Combiná mayúsculas, minúsculas, números y símbolos.";
    case "form_password_matches_identifier":
      return "La contraseña no puede ser igual al correo electrónico.";
    case "form_password_size_in_bytes_exceeded":
      return "La contraseña es demasiado larga.";
    default:
      return "La contraseña no cumple los requisitos de seguridad.";
  }
}

/** Traduce los errores de la API de Clerk a errores de campo del formulario. */
function clerkErrors(error: unknown): FieldErrors | null {
  if (!isClerkAPIResponseError(error)) return null;

  const errors: FieldErrors = {};

  for (const item of error.errors) {
    if (item.code === "form_identifier_exists") {
      errors.email = "Ya existe una cuenta con ese correo electrónico.";
    } else if (item.code.startsWith("form_password")) {
      errors.password = passwordMessage(item.code, item.longMessage ?? item.message);
    } else if (item.meta?.paramName === "email_address") {
      errors.email = "El correo electrónico no es válido.";
    }
  }

  return hasErrors(errors) ? errors : null;
}

export async function crearPersonal(
  _previous: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  const errors: FieldErrors = {};

  const firstName = requiredText(formData.get("firstName"), "firstName", errors, "El nombre");
  const lastName = requiredText(formData.get("lastName"), "lastName", errors, "El apellido");
  const dni = requiredText(formData.get("dni"), "dni", errors, "El DNI");
  const email = requiredText(formData.get("email"), "email", errors, "El correo electrónico").toLowerCase();
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  const role = rawValue(formData, "role");

  if (firstName.length > MAX_NAME_LENGTH) {
    errors.firstName = `El nombre no puede superar ${MAX_NAME_LENGTH} caracteres.`;
  }
  if (lastName.length > MAX_NAME_LENGTH) {
    errors.lastName = `El apellido no puede superar ${MAX_NAME_LENGTH} caracteres.`;
  }
  if (dni && !DNI_PATTERN.test(dni)) {
    errors.dni = "Ingresá un DNI válido (solo números, 7 a 9 dígitos).";
  }
  if (email && !EMAIL_PATTERN.test(email)) {
    errors.email = "El correo electrónico no es válido.";
  }
  if (!password) {
    errors.password = "La contraseña inicial es obligatoria.";
  }
  if (!isStaffRole(role)) {
    errors.role = "Seleccioná un rol: Médico o Enfermera.";
  }

  // La contraseña nunca se devuelve al formulario.
  const values = { firstName, lastName, dni, email, role };

  if (hasErrors(errors) || !isStaffRole(role)) {
    return { errors, values };
  }

  // CA2: solo un administrador puede efectuar el alta.
  const guard = await requireAdministrador();

  if ("error" in guard) {
    return { message: guard.error, values };
  }

  const existing = await prisma.userProfile.findFirst({
    where: { OR: [{ dni }, { email }] },
    select: { dni: true, email: true },
  });

  if (existing) {
    return {
      errors: existing.dni === dni
        ? { dni: "Ya existe un usuario con ese DNI." }
        : { email: "Ya existe una cuenta con ese correo electrónico." },
      values,
    };
  }

  const clerk = await clerkClient();
  let clerkUserId: string;

  try {
    const user = await clerk.users.createUser({
      emailAddress: [email],
      password,
      firstName,
      lastName,
      // El rol en Clerk es un espejo de la base (D-02); la base es la fuente de verdad.
      publicMetadata: { role },
      unsafeMetadata: { dni },
    });
    clerkUserId = user.id;
  } catch (error) {
    const fieldErrors = clerkErrors(error);
    if (fieldErrors) return { errors: fieldErrors, values };

    console.error("[personal] no se pudo crear la cuenta en Clerk:", error);
    return { message: "No se pudo crear la cuenta. Intentá nuevamente.", values };
  }

  try {
    await prisma.userProfile.create({
      data: { firstName, lastName, dni, email, role, clerkUserId },
    });
  } catch (error) {
    // Sin perfil en la base la cuenta de Clerk quedaría huérfana: se deshace.
    await clerk.users.deleteUser(clerkUserId).catch((cleanupError: unknown) => {
      console.error("[personal] no se pudo deshacer la cuenta de Clerk:", cleanupError);
    });

    if (isUniqueViolation(error)) {
      return { message: "Ya existe un usuario con ese DNI o correo electrónico.", values };
    }

    throw error;
  }

  revalidatePath("/admin/personal");

  return {
    success: true,
    message: `Se creó la cuenta de ${firstName} ${lastName} con rol ${STAFF_ROLE_LABELS[role]}.`,
  };
}
