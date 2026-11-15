"use client";

type ReportModuleSelectProps = {
  value: "turnos-especialidad" | "stock-vacunas" | "ingresos-ausentismo";
};

export default function ReportModuleSelect({ value }: ReportModuleSelectProps) {
  return (
    <select
      id="modulo"
      name="modulo"
      defaultValue={value}
      onChange={(event) => event.currentTarget.form?.requestSubmit()}
      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
    >
      <option value="turnos-especialidad">
        Reporte de turnos atendidos y cancelados por especialidad
      </option>
      <option value="stock-vacunas">Reporte de stock y consumo de vacunas</option>
      <option value="ingresos-ausentismo">
        Reporte de ingresos y ausentismo de pacientes
      </option>
    </select>
  );
}
