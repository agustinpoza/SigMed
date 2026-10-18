"use client";

import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { crearPersonal, type StaffFormState } from "./actions";
import { STAFF_ROLES, STAFF_ROLE_LABELS } from "@/lib/staff-roles";

const initialState: StaffFormState = {};

const controlClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900";

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
    >
      {pending ? "Creando..." : "Crear cuenta"}
    </button>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-zinc-900">
        {label}
      </label>
      <div className="mt-1">{children}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function errorProps(id: string, error?: string) {
  return {
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? `${id}-error` : undefined,
  };
}

export function StaffForm() {
  const [state, formAction] = useActionState(crearPersonal, initialState);
  const errors = state.errors ?? {};
  const values = state.values ?? {};

  return (
    <form action={formAction} className="space-y-5">
      {state.message ? (
        <p
          role={state.success ? "status" : "alert"}
          className={
            state.success
              ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
              : "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          }
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="firstName" label="Nombre" error={errors.firstName}>
          <input
            id="firstName"
            name="firstName"
            autoComplete="off"
            defaultValue={values.firstName}
            placeholder="Nombre"
            className={controlClass}
            {...errorProps("firstName", errors.firstName)}
          />
        </Field>

        <Field id="lastName" label="Apellido" error={errors.lastName}>
          <input
            id="lastName"
            name="lastName"
            autoComplete="off"
            defaultValue={values.lastName}
            placeholder="Apellido"
            className={controlClass}
            {...errorProps("lastName", errors.lastName)}
          />
        </Field>

        <Field id="dni" label="DNI" error={errors.dni}>
          <input
            id="dni"
            name="dni"
            inputMode="numeric"
            autoComplete="off"
            defaultValue={values.dni}
            placeholder="Número de documento"
            className={controlClass}
            {...errorProps("dni", errors.dni)}
          />
        </Field>

        <Field id="email" label="Correo electrónico" error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="off"
            defaultValue={values.email}
            placeholder="nombre@correo.com"
            className={controlClass}
            {...errorProps("email", errors.email)}
          />
        </Field>

        <Field id="password" label="Contraseña inicial" error={errors.password}>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className={controlClass}
            {...errorProps("password", errors.password)}
          />
        </Field>

        <Field id="role" label="Rol" error={errors.role}>
          <select
            key={values.role ?? ""}
            id="role"
            name="role"
            defaultValue={values.role ?? ""}
            className={controlClass}
            {...errorProps("role", errors.role)}
          >
            <option value="" disabled>
              Seleccioná un rol
            </option>
            {STAFF_ROLES.map((role) => (
              <option key={role} value={role}>
                {STAFF_ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <p className="text-xs text-zinc-500">Roles disponibles: Médico y Enfermera.</p>

      <div className="flex justify-end gap-3 border-t border-zinc-200 pt-4">
        <Link
          href="/admin"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          Cancelar
        </Link>
        <SaveButton />
      </div>
    </form>
  );
}
