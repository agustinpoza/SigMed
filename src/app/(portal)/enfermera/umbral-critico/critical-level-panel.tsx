"use client";

import { useActionState, useMemo, useState } from "react";
import { saveCriticalLevel, type CriticalLevelState } from "./actions";
import type { VaccineCriticalConfig } from "@/services/vaccineService";

const initial: CriticalLevelState = {};

export default function CriticalLevelPanel({
  vaccines,
}: {
  vaccines: VaccineCriticalConfig[];
}) {
  const [selectedId, setSelectedId] = useState(vaccines[0]?.id ?? "");
  const [level, setLevel] = useState<string>(
    vaccines[0]?.criticalLevel != null ? String(vaccines[0].criticalLevel) : "",
  );
  const [state, formAction, pending] = useActionState(saveCriticalLevel, initial);

  const selected = useMemo(
    () => vaccines.find((v) => v.id === selectedId) ?? null,
    [vaccines, selectedId],
  );

  function onSelect(id: string) {
    setSelectedId(id);
    const v = vaccines.find((x) => x.id === id);
    setLevel(v?.criticalLevel != null ? String(v.criticalLevel) : "");
  }

  const numericLevel = level === "" ? 0 : Number.parseInt(level, 10);
  const safeLevel = Number.isFinite(numericLevel) ? numericLevel : 0;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="vaccineId" value={selectedId} />

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-zinc-900">Selección de vacuna a modificar</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Seleccionar vacuna del inventario</span>
            <select
              className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
              value={selectedId}
              onChange={(e) => onSelect(e.target.value)}
              required
            >
              {vaccines.length === 0 ? <option value="">No hay vacunas</option> : null}
              {vaccines.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Laboratorio / Origen</span>
            <input
              readOnly
              tabIndex={-1}
              value={selected?.laboratory ?? ""}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700"
            />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-zinc-900">Configuración de umbral crítico</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Stock Físico Actual (Referencia)</span>
            <input
              readOnly
              tabIndex={-1}
              value={selected ? String(selected.physicalStock) : ""}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Nivel Stock Crítico (umbral de alerta)</span>
            <div className="mt-1 flex items-stretch rounded-md border border-zinc-300 bg-white">
              <button
                type="button"
                aria-label="Disminuir umbral"
                className="px-3 text-zinc-700 hover:bg-zinc-100 disabled:opacity-40"
                disabled={pending || safeLevel <= 0}
                onClick={() => setLevel(String(Math.max(0, safeLevel - 1)))}
              >
                -
              </button>
              <input
                name="criticalLevel"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full border-x border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none"
                placeholder="Sin umbral"
              />
              <button
                type="button"
                aria-label="Aumentar umbral"
                className="px-3 text-zinc-700 hover:bg-zinc-100 disabled:opacity-40"
                disabled={pending}
                onClick={() => setLevel(String(safeLevel + 1))}
              >
                +
              </button>
            </div>
          </label>
        </div>
      </section>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-emerald-700">{state.message}</p> : null}

      <div>
        <button
          type="submit"
          disabled={pending || !selectedId}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {pending ? "Guardando..." : "Guardar umbral"}
        </button>
      </div>
    </form>
  );
}
