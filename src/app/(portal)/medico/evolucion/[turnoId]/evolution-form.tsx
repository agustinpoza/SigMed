"use client";

import Link from "next/link";
import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { registrarEvolucion, type EvolutionFormState } from "./actions";
import { CLINICAL_RECORD_MAX_LENGTH } from "@/lib/clinical-records-limits";

const initialState: EvolutionFormState = {};

const controlClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900";

const readOnlyClass =
  "w-full rounded-md border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm text-zinc-600";

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
    >
      {pending ? "Guardando..." : "Guardar evolución"}
    </button>
  );
}

function ReadOnlyField({ id, label, value }: { id: string; label: string; value: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs text-zinc-500">
        {label}
      </label>
      <input id={id} value={value} readOnly className={`mt-1 ${readOnlyClass}`} />
    </div>
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

export function EvolutionForm({
  turnoId,
  patient,
  appointmentDate,
  doctor,
}: {
  turnoId: string;
  patient: string;
  appointmentDate: string;
  doctor: string;
}) {
  const [state, formAction] = useActionState(registrarEvolucion, initialState);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="turnoId" value={turnoId} />

      {state.message ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[2fr_1.4fr_1.4fr]">
        <ReadOnlyField id="patient" label="Paciente" value={patient} />
        <ReadOnlyField id="appointmentDate" label="Fecha del turno" value={appointmentDate} />
        <ReadOnlyField id="doctor" label="Profesional" value={doctor} />
      </div>

      <div className="space-y-4 border-t border-zinc-200 pt-5">
        <Field id="diagnosis" label="Diagnóstico" error={errors.diagnosis}>
          <input
            id="diagnosis"
            name="diagnosis"
            required
            maxLength={CLINICAL_RECORD_MAX_LENGTH.diagnosis}
            defaultValue={state.values?.diagnosis}
            aria-invalid={Boolean(errors.diagnosis)}
            aria-describedby={errors.diagnosis ? "diagnosis-error" : undefined}
            className={controlClass}
            placeholder="Infección respiratoria alta"
          />
        </Field>

        <Field id="treatment" label="Tratamiento" error={errors.treatment}>
          <textarea
            id="treatment"
            name="treatment"
            rows={2}
            maxLength={CLINICAL_RECORD_MAX_LENGTH.treatment}
            defaultValue={state.values?.treatment}
            aria-invalid={Boolean(errors.treatment)}
            aria-describedby={errors.treatment ? "treatment-error" : undefined}
            className={controlClass}
            placeholder="Paracetamol 500 mg cada 8 horas si hay fiebre."
          />
        </Field>

        <Field id="indications" label="Indicaciones" error={errors.indications}>
          <textarea
            id="indications"
            name="indications"
            rows={3}
            maxLength={CLINICAL_RECORD_MAX_LENGTH.indications}
            defaultValue={state.values?.indications}
            aria-invalid={Boolean(errors.indications)}
            aria-describedby={errors.indications ? "indications-error" : undefined}
            className={controlClass}
            placeholder="Reposo relativo e hidratación abundante."
          />
        </Field>
      </div>

      <div className="flex justify-end gap-3 border-t border-zinc-200 pt-4">
        <Link
          href="/medico/agenda"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          Cancelar
        </Link>
        <SaveButton />
      </div>
    </form>
  );
}
