import { formatReportDate, resolveReportPeriod } from "@/lib/report-period";
import {
  reporteIngresosAusentismo,
  reporteStockVacunas,
  reporteTurnosPorEspecialidad,
} from "@/lib/reports";
import PrintButton from "./print-button";
import ReportModuleSelect from "./report-module-select";
import ReportPeriodFields from "./report-period-fields";

export const metadata = {
  title: "Reportes administrativos | SigMed",
};

type SearchParams = {
  desde?: string;
  hasta?: string;
  modulo?: string;
  vacuna?: string;
};

const numberFormatter = new Intl.NumberFormat("es-AR");
const percentFormatter = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });
const moneyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function porcentaje(parte: number, total: number): number {
  return total === 0 ? 0 : (parte / total) * 100;
}

// El layout de /admin ya exige rol ADMINISTRADOR.
export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const resolved = resolveReportPeriod(params.desde, params.hasta);
  const { period } = resolved;
  const modulo =
    params.modulo === "stock-vacunas"
      ? "stock-vacunas"
      : params.modulo === "ingresos-ausentismo"
        ? "ingresos-ausentismo"
        : "turnos-especialidad";
  const report = resolved.ok && modulo === "turnos-especialidad"
    ? await reporteTurnosPorEspecialidad(period)
    : null;
  const stockReport = resolved.ok && modulo === "stock-vacunas"
    ? await reporteStockVacunas(
        period,
        params.vacuna && params.vacuna !== "todas" ? params.vacuna : undefined,
      )
    : null;
  const financialReport = resolved.ok && modulo === "ingresos-ausentismo"
    ? await reporteIngresosAusentismo(period)
    : null;

  const exportParams = new URLSearchParams({ desde: period.desde, hasta: period.hasta, modulo });
  if (modulo === "stock-vacunas" && params.vacuna) exportParams.set("vacuna", params.vacuna);
  const exportHref = `/admin/reportes/exportar?${exportParams.toString()}`;
  const rango = `${formatReportDate(period.desde)} al ${formatReportDate(period.hasta)}`;
  const attendanceTotal = financialReport?.totals.attendanceCount ?? 0;
  const attendancePercent = attendanceTotal > 0
    ? ((financialReport?.totals.attended ?? 0) / attendanceTotal) * 100
    : 0;
  const absencePercent = attendanceTotal > 0
    ? ((financialReport?.totals.absent ?? 0) / attendanceTotal) * 100
    : 0;
  const financialTotal = (financialReport?.totals.income ?? 0) +
    (financialReport?.totals.pendingAbsenceDebt ?? 0);
  const incomeShare = financialTotal > 0
    ? ((financialReport?.totals.income ?? 0) / financialTotal) * 100
    : 0;
  const debtShare = financialTotal > 0
    ? ((financialReport?.totals.pendingAbsenceDebt ?? 0) / financialTotal) * 100
    : 0;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-5 rounded-lg bg-white p-6 shadow-sm print:max-w-none print:p-0 print:shadow-none">
      <header className="border-b border-zinc-200 pb-3">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Reportes Administrativos
        </h1>
      </header>

      <form method="get" className="flex flex-col gap-5 print:hidden">
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
          <label htmlFor="modulo" className="mb-1 block text-xs font-medium text-zinc-600">
            Seleccionar Módulo de Reporte
          </label>
          <ReportModuleSelect value={modulo} />
        </div>

        <ReportPeriodFields
          desde={period.desde}
          hasta={period.hasta}
          showVaccineFilter={modulo === "stock-vacunas"}
          vaccines={stockReport?.vaccines}
          selectedVaccine={params.vacuna ?? "todas"}
        />
      </form>

      {!resolved.ok ? (
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {resolved.error}
        </p>
      ) : null}

      {stockReport ? (
        <>
          <div className="rounded-md border border-zinc-200 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-zinc-900">
                Relación de Consumo y Stock Actual por Biológico
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600">
                <span className="flex items-center gap-1">
                  <span className="size-2.5 rounded-sm bg-amber-500 [print-color-adjust:exact]" />
                  Dosis Consumidas
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2.5 rounded-sm bg-blue-600 [print-color-adjust:exact]" />
                  Stock Disponible
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2.5 rounded-sm bg-rose-600 [print-color-adjust:exact]" />
                  Stock Crítico
                </span>
              </div>
            </div>
            {stockReport.rows.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-600">
                No hay vacunas registradas para el filtro seleccionado.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {stockReport.rows.map((row) => {
                  const consumedDoses = Math.abs(row.consumed);
                  const denominator = consumedDoses + row.currentStock;
                  const consumedShare = denominator > 0 ? (consumedDoses / denominator) * 100 : 0;
                  const stockShare = denominator > 0 ? (row.currentStock / denominator) * 100 : 0;
                  const stockColor = row.stockStatus === "critico" ? "bg-rose-600" : "bg-blue-600";
                  return (
                    <li
                      key={row.vaccineId}
                      className="grid grid-cols-[8rem_1fr] items-center gap-3 text-xs"
                    >
                      <span className="font-medium text-zinc-700">{row.name}</span>
                      {denominator === 0 ? (
                        <div className="flex h-5 items-center justify-center rounded-sm bg-zinc-100 text-[11px] text-zinc-500">
                          Sin datos
                        </div>
                      ) : (
                        <div
                          role="img"
                          aria-label={`${row.name}: ${percentFormatter.format(consumedShare)}% consumido, ${percentFormatter.format(stockShare)}% disponible`}
                          className="flex h-5 overflow-hidden rounded-sm"
                        >
                          {consumedDoses > 0 ? (
                            <div
                              title={`Consumo del período: ${numberFormatter.format(row.consumed)} dosis`}
                              className="flex items-center justify-center overflow-hidden bg-amber-500 text-[11px] font-semibold text-white [print-color-adjust:exact]"
                              style={{ width: `${consumedShare}%` }}
                            >
                              {consumedShare >= 10 ? `${percentFormatter.format(consumedShare)}%` : null}
                            </div>
                          ) : null}
                          {row.currentStock > 0 ? (
                            <div
                              title={`${row.stockStatus === "critico" ? "Stock crítico" : "Stock disponible"}: ${numberFormatter.format(row.currentStock)} dosis${row.criticalLevel === null ? "" : ` (umbral: ${numberFormatter.format(row.criticalLevel)})`}`}
                              className={`flex items-center justify-center overflow-hidden ${stockColor} text-[11px] font-semibold text-white [print-color-adjust:exact]`}
                              style={{ width: `${stockShare}%` }}
                            >
                              {stockShare >= 10 ? `${percentFormatter.format(stockShare)}%` : null}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-zinc-900">
              Detalle de inventario consolidado ({formatReportDate(period.desde)} al {formatReportDate(period.hasta)})
            </h2>
            <div className="overflow-x-auto rounded-md border border-zinc-200">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-600">
                  <tr>
                    <th scope="col" className="px-4 py-2 text-left font-semibold">Vacuna / laboratorio</th>
                    <th scope="col" className="px-4 py-2 text-center font-semibold">Consumo (período)</th>
                    <th scope="col" className="px-4 py-2 text-center font-semibold">Stock actual</th>
                    <th scope="col" className="px-4 py-2 text-center font-semibold">Umbral crítico</th>
                    <th scope="col" className="px-4 py-2 text-center font-semibold">Estado sistema</th>
                  </tr>
                </thead>
                <tbody>
                  {stockReport.rows.map((row) => (
                    <tr key={row.vaccineId} className="border-t border-zinc-200">
                      <th
                        scope="row"
                        className="px-4 py-3 text-left font-semibold text-zinc-900"
                      >
                        {row.name}
                        <span className="block text-xs font-normal text-zinc-500">
                          {row.laboratory}
                        </span>
                      </th>
                      <td className="px-4 py-3 text-center tabular-nums text-amber-700">
                        {numberFormatter.format(row.consumed)}
                      </td>
                      <td className={`px-4 py-3 text-center tabular-nums ${row.stockStatus === "critico" ? "text-rose-700" : "text-blue-700"}`}>
                        {numberFormatter.format(row.currentStock)}
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums">
                        {row.criticalLevel === null ? "—" : numberFormatter.format(row.criticalLevel)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${
                            row.stockStatus === "critico"
                              ? "border-rose-400 bg-white text-rose-700"
                              : row.stockStatus === "normal"
                                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                : "border-zinc-300 bg-zinc-50 text-zinc-700"
                          }`}
                        >
                          {row.stockStatus === "critico" ? "⚠ Crítico" : row.stockStatus === "normal" ? "Óptimo" : "Sin umbral"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {stockReport.rows.length > 0 ? (
                  <tfoot className="bg-zinc-100 font-semibold text-zinc-900 [print-color-adjust:exact]">
                    <tr className="border-t border-zinc-200">
                      <th scope="row" className="px-4 py-3 text-left uppercase">Totales consolidados</th>
                      <td className="px-4 py-3 text-center tabular-nums text-amber-700">
                        {numberFormatter.format(stockReport.totals.consumed)} dosis
                      </td>
                      <td className="px-4 py-3 text-center tabular-nums text-blue-700">
                        {numberFormatter.format(stockReport.totals.currentStock)} dosis
                      </td>
                      <td className="px-4 py-3 text-center">—</td>
                      <td className="px-4 py-3" />
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 print:hidden">
            <PrintButton />
            <a href={exportHref} className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50">
              Exportar a Excel
            </a>
          </div>
        </>
      ) : null}

      {financialReport ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-zinc-200 bg-slate-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Ingresos efectivos (pagados)
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">
                {moneyFormatter.format(financialReport.totals.income)}
              </p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-slate-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tasa de ausentismo
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-rose-700">
                {percentFormatter.format(financialReport.totals.absenceRate)}%
              </p>
            </div>
            <div className="rounded-md border border-zinc-200 bg-slate-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Deuda por inasistencia
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-amber-700">
                {moneyFormatter.format(financialReport.totals.pendingAbsenceDebt)}
              </p>
            </div>
          </div>

          <div className="rounded-md border border-zinc-200 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-zinc-900">
                Impacto Financiero y Operativo del Período
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600">
                <span className="flex items-center gap-1">
                  <span className="size-2.5 rounded-sm bg-emerald-600 [print-color-adjust:exact]" />
                  Efectivo / Atendidos
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2.5 rounded-sm bg-rose-600 [print-color-adjust:exact]" />
                  Pérdida / Ausentes
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3 text-xs">
              <div className="grid items-center gap-2 sm:grid-cols-[9rem_1fr] sm:gap-3">
                <span className="text-zinc-700">Asistencia de Pacientes</span>
                {attendanceTotal === 0 ? (
                  <div className="flex h-5 items-center justify-center rounded-sm bg-zinc-100 text-zinc-500">
                    Sin datos
                  </div>
                ) : (
                  <div
                    role="img"
                    aria-label={`${percentFormatter.format(attendancePercent)}% atendidos, ${percentFormatter.format(absencePercent)}% ausentes`}
                    className="flex h-5 overflow-hidden rounded-sm"
                  >
                    {attendancePercent > 0 ? (
                      <div
                        className="flex items-center justify-center overflow-hidden bg-emerald-600 font-semibold text-white [print-color-adjust:exact]"
                        style={{ width: `${attendancePercent}%` }}
                      >
                        {attendancePercent >= 8 ? `${percentFormatter.format(attendancePercent)}%` : null}
                      </div>
                    ) : null}
                    {absencePercent > 0 ? (
                      <div
                        className="flex items-center justify-center overflow-hidden bg-rose-600 font-semibold text-white [print-color-adjust:exact]"
                        style={{ width: `${absencePercent}%` }}
                      >
                        {absencePercent >= 8 ? `${percentFormatter.format(absencePercent)}%` : null}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
              <div className="grid items-center gap-2 sm:grid-cols-[9rem_1fr] sm:gap-3">
                <span className="text-zinc-700">Recaudación / Facturación</span>
                {financialTotal === 0 ? (
                  <div className="flex h-5 items-center justify-center rounded-sm bg-zinc-100 text-zinc-500">
                    Sin datos
                  </div>
                ) : (
                  <div
                    role="img"
                    aria-label={`${percentFormatter.format(incomeShare)}% efectivo, ${percentFormatter.format(debtShare)}% deuda pendiente`}
                    className="flex h-5 overflow-hidden rounded-sm"
                  >
                    {incomeShare > 0 ? (
                      <div
                        className="flex items-center justify-center overflow-hidden bg-emerald-600 font-semibold text-white [print-color-adjust:exact]"
                        style={{ width: `${incomeShare}%` }}
                      >
                        {incomeShare >= 8 ? `${percentFormatter.format(incomeShare)}%` : null}
                      </div>
                    ) : null}
                    {debtShare > 0 ? (
                      <div
                        className="flex items-center justify-center overflow-hidden bg-rose-600 font-semibold text-white [print-color-adjust:exact]"
                        style={{ width: `${debtShare}%` }}
                      >
                        {debtShare >= 8 ? `${percentFormatter.format(debtShare)}%` : null}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-zinc-900">
              Desglose por Especialidad: {rango}
            </h2>
            <div className="overflow-x-auto rounded-md border border-zinc-200">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-600">
                  <tr>
                    <th scope="col" className="px-4 py-2 text-left font-semibold">Especialidad</th>
                    <th scope="col" className="px-4 py-2 text-right font-semibold">Turnos totales</th>
                    <th scope="col" className="px-4 py-2 text-right font-semibold">Ausentismo</th>
                    <th scope="col" className="px-4 py-2 text-right font-semibold">Ingresos efectivos</th>
                    <th scope="col" className="px-4 py-2 text-right font-semibold">Deuda pendiente</th>
                  </tr>
                </thead>
                <tbody>
                  {financialReport.rows.map((row) => (
                    <tr key={row.speciality} className="border-t border-zinc-200">
                      <th scope="row" className="px-4 py-3 text-left font-semibold text-zinc-900">
                        {row.label}
                      </th>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {numberFormatter.format(row.attendanceCount)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {percentFormatter.format(row.absenceRate)}%
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {moneyFormatter.format(row.income)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {moneyFormatter.format(row.pendingAbsenceDebt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-zinc-100 font-semibold text-zinc-900 [print-color-adjust:exact]">
                  <tr className="border-t border-zinc-200">
                    <th scope="row" className="px-4 py-3 text-left uppercase">Totales</th>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {numberFormatter.format(financialReport.totals.attendanceCount)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {percentFormatter.format(financialReport.totals.absenceRate)}%
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {moneyFormatter.format(financialReport.totals.income)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {moneyFormatter.format(financialReport.totals.pendingAbsenceDebt)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 print:hidden">
            <PrintButton />
            <a
              href={exportHref}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Exportar a Excel
            </a>
          </div>
        </>
      ) : null}

      {report ? (
        <>
          <div className="rounded-md border border-zinc-200 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-zinc-900">
                Proporción de Estados por Especialidad
              </h2>
              <div className="flex items-center gap-3 text-xs text-zinc-600">
                <span className="flex items-center gap-1">
                  <span className="size-2.5 rounded-sm bg-emerald-600 [print-color-adjust:exact]" />
                  Atendidos
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2.5 rounded-sm bg-rose-600 [print-color-adjust:exact]" />
                  Cancelados
                </span>
              </div>
            </div>

            {report.totals.total === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-600">
                No hay turnos atendidos ni cancelados en el período seleccionado.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {report.rows.map((row) => {
                  const pctAtendidos = porcentaje(row.atendidos, row.total);
                  const pctCancelados = porcentaje(row.cancelados, row.total);

                  return (
                    <li
                      key={row.speciality}
                      className="grid grid-cols-[7.5rem_1fr] items-center gap-3 text-xs"
                    >
                      <span className="text-zinc-700">{row.label}</span>
                      {row.total === 0 ? (
                        <div className="flex h-5 items-center justify-center rounded-sm bg-zinc-100 text-[11px] text-zinc-500 [print-color-adjust:exact]">
                          Sin turnos en el período
                        </div>
                      ) : (
                        <div
                          role="img"
                          aria-label={`${row.label}: ${percentFormatter.format(pctAtendidos)}% atendidos, ${percentFormatter.format(pctCancelados)}% cancelados`}
                          className="flex h-5 gap-px overflow-hidden rounded-sm"
                        >
                          {row.atendidos > 0 ? (
                            <div
                              style={{ width: `${pctAtendidos}%` }}
                              title={`Atendidos: ${row.atendidos} (${percentFormatter.format(pctAtendidos)}%)`}
                              className="flex items-center justify-center overflow-hidden bg-emerald-600 text-[11px] font-semibold text-white [print-color-adjust:exact]"
                            >
                              {pctAtendidos >= 12 ? `${percentFormatter.format(pctAtendidos)}%` : null}
                            </div>
                          ) : null}
                          {row.cancelados > 0 ? (
                            <div
                              style={{ width: `${pctCancelados}%` }}
                              title={`Cancelados: ${row.cancelados} (${percentFormatter.format(pctCancelados)}%)`}
                              className="flex items-center justify-center overflow-hidden bg-rose-600 text-[11px] font-semibold text-white [print-color-adjust:exact]"
                            >
                              {row.atendidos === 0 ? `${percentFormatter.format(pctCancelados)}%` : null}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-zinc-900">
              Detalle de resultados: {rango}
            </h2>
            <div className="overflow-x-auto rounded-md border border-zinc-200">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-600">
                  <tr>
                    <th scope="col" className="px-4 py-2 text-left font-semibold">
                      Especialidad
                    </th>
                    <th scope="col" className="px-4 py-2 text-right font-semibold">
                      Turnos atendidos
                    </th>
                    <th scope="col" className="px-4 py-2 text-right font-semibold">
                      Turnos cancelados
                    </th>
                    <th scope="col" className="px-4 py-2 text-right font-semibold">
                      Total de turnos
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((row) => (
                    <tr key={row.speciality} className="border-t border-zinc-200">
                      <th scope="row" className="px-4 py-3 text-left font-semibold text-zinc-900">
                        {row.label}
                      </th>
                      <td className="px-4 py-3 text-right tabular-nums text-emerald-700">
                        {numberFormatter.format(row.atendidos)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-rose-700">
                        {numberFormatter.format(row.cancelados)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-zinc-900">
                        {numberFormatter.format(row.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-zinc-100 font-semibold text-zinc-900 [print-color-adjust:exact]">
                  <tr className="border-t border-zinc-200">
                    <th scope="row" className="px-4 py-3 text-left uppercase">
                      Totales
                    </th>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {numberFormatter.format(report.totals.atendidos)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {numberFormatter.format(report.totals.cancelados)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {numberFormatter.format(report.totals.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 print:hidden">
            <PrintButton />
            <a
              href={exportHref}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
            >
              Exportar a Excel
            </a>
          </div>
        </>
      ) : null}
    </section>
  );
}
