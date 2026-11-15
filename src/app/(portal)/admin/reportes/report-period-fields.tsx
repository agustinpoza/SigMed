"use client";

import { useState } from "react";

type ReportPeriodFieldsProps = {
  desde: string;
  hasta: string;
  showVaccineFilter?: boolean;
  vaccines?: { id: string; name: string }[];
  selectedVaccine?: string;
};

export default function ReportPeriodFields({
  desde,
  hasta,
  showVaccineFilter = false,
  vaccines = [],
  selectedVaccine = "todas",
}: ReportPeriodFieldsProps) {
  const [fechaDesde, setFechaDesde] = useState(desde);
  const [fechaHasta, setFechaHasta] = useState(hasta);

  return (
    <div
      className={`grid items-end gap-3 ${
        showVaccineFilter
          ? "sm:grid-cols-[1.25fr_1fr_1fr_auto]"
          : "sm:grid-cols-[1fr_1fr_auto]"
      }`}
    >
      {showVaccineFilter ? (
        <div>
          <label htmlFor="vacuna" className="mb-1 block text-xs font-medium text-zinc-600">
            Filtrar por vacuna
          </label>
          <select
            id="vacuna"
            name="vacuna"
            defaultValue={selectedVaccine}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
          >
            <option value="todas">Todas las vacunas en catálogo</option>
            {vaccines.map((vaccine) => (
              <option key={vaccine.id} value={vaccine.id}>{vaccine.name}</option>
            ))}
          </select>
        </div>
      ) : null}
      <div>
        <label htmlFor="desde" className="mb-1 block text-xs font-medium text-zinc-600">
          Fecha Desde
        </label>
        <input
          id="desde"
          name="desde"
          type="date"
          required
          max={fechaHasta}
          value={fechaDesde}
          onChange={(event) => setFechaDesde(event.currentTarget.value)}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        />
      </div>
      <div>
        <label htmlFor="hasta" className="mb-1 block text-xs font-medium text-zinc-600">
          Fecha Hasta
        </label>
        <input
          id="hasta"
          name="hasta"
          type="date"
          required
          min={fechaDesde}
          value={fechaHasta}
          onChange={(event) => setFechaHasta(event.currentTarget.value)}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
        />
      </div>
      <button
        type="submit"
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
      >
        Generar Reporte
      </button>
    </div>
  );
}
