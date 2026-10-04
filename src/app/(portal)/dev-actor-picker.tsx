"use client";

import { useActionState } from "react";
import { clearDevActor, setDevActor, type ActorState } from "./dev-actor-actions";

const initialState: ActorState = {};

type Candidate = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export default function DevActorPicker({
  candidates,
  current,
}: {
  candidates: Candidate[];
  current: Candidate | null;
}) {
  const [state, formAction, isPending] = useActionState(setDevActor, initialState);

  const selectedId = current?.id ?? state.selectedId ?? "";

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
      <span className="text-xs font-medium uppercase tracking-wide text-amber-800">
        Actor de desarrollo
      </span>

      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <select
          key={current?.id ?? "none"}
          name="actorId"
          defaultValue={selectedId}
          className="rounded-md border border-amber-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="">Sin actor</option>
          {candidates.map((candidate) => (
            <option key={candidate.id} value={candidate.id}>
              {candidate.firstName} {candidate.lastName} · {candidate.email}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-amber-700 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          Aplicar
        </button>

        <button
          type="submit"
          formAction={clearDevActor}
          disabled={isPending || !current}
          className="rounded-md border border-amber-300 px-3 py-1.5 text-sm text-amber-900 disabled:opacity-50"
        >
          Limpiar
        </button>
      </form>

      {state.error ? (
        <p className="text-xs text-red-700">{state.error}</p>
      ) : (
        <p className="text-xs text-amber-800">
          {current
            ? `Actuando como ${current.firstName} ${current.lastName}`
            : "Sin actor: las acciones que escriben en stock quedan deshabilitadas."}
        </p>
      )}
    </div>
  );
}
