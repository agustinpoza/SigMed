"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  updateVaccineCriticalLevel,
  type VaccineFormState,
} from "./actions";

const initialState: VaccineFormState = {};

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
    >
      {pending ? "Guardando..." : "Guardar"}
    </button>
  );
}

export function CriticalLevelInput({
  vaccineId,
  initial,
}: {
  vaccineId: string;
  initial: number | null;
}) {
  const [state, formAction] = useActionState(
    updateVaccineCriticalLevel,
    initialState,
  );
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="vaccineId" value={vaccineId} />
      <input
        type="number"
        name="criticalLevel"
        min={0}
        step={1}
        defaultValue={initial ?? ""}
        aria-invalid={Boolean(errors.criticalLevel)}
        className="w-20 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 shadow-sm outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
      />
      <SaveButton />
      {state.message || errors.criticalLevel ? (
        <span
          role="status"
          className={
            errors.criticalLevel
              ? "text-xs text-red-600"
              : "text-xs text-zinc-500"
          }
        >
          {errors.criticalLevel ?? state.message}
        </span>
      ) : null}
    </form>
  );
}