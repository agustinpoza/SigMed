"use client";

import { useActionState } from "react";
import { validarCobertura, type CoverageFormState } from "./actions";
import { CoverageStatus } from "@/generated/prisma/enums";

const initialState: CoverageFormState = {};

const controlClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900";

const STATUS_OPTIONS: Array<{ value: CoverageStatus; label: string }> = [
  { value: CoverageStatus.VALIDADA, label: "Cobertura validada" },
  { value: CoverageStatus.PENDIENTE, label: "Validación pendiente" },
  { value: CoverageStatus.RECHAZADA, label: "Cobertura rechazada" },
];

export function CoverageForm({
  patientId,
  currentStatus,
  currentNote,
}: {
  patientId: string;
  currentStatus: CoverageStatus | null;
  currentNote: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    validarCobertura,
    initialState,
  );
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="mt-3 space-y-3 border-t border-zinc-200 pt-3">
      <input type="hidden" name="patientId" value={patientId} />

      {state.message ? (
        <p
          role={state.success ? "status" : "alert"}
          className={
            state.success
              ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800"
              : "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          }
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] sm:items-end">
        <div>
          <label
            htmlFor={`status-${patientId}`}
            className="block text-xs font-semibold text-zinc-700"
          >
            Resultado de la validación
          </label>
          <select
            id={`status-${patientId}`}
            name="status"
            defaultValue={currentStatus ?? ""}
            className={`${controlClass} mt-1`}
            aria-invalid={Boolean(errors.status)}
          >
            <option value="" disabled>
              Seleccioná un resultado
            </option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.status ? (
            <p className="mt-1 text-xs text-red-600">{errors.status}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor={`note-${patientId}`}
            className="block text-xs font-semibold text-zinc-700"
          >
            Nota de la validación (opcional)
          </label>
          <input
            id={`note-${patientId}`}
            name="note"
            maxLength={300}
            defaultValue={currentNote ?? ""}
            placeholder="Ej.: afiliación confirmada por la obra social"
            className={`${controlClass} mt-1`}
            aria-invalid={Boolean(errors.note)}
          />
          {errors.note ? (
            <p className="mt-1 text-xs text-red-600">{errors.note}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {pending ? "Guardando..." : "Guardar validación"}
        </button>
      </div>

      {errors.patientId ? (
        <p className="text-xs text-red-600">{errors.patientId}</p>
      ) : null}
    </form>
  );
}
