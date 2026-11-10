import { formatReportDate, resolveReportPeriod } from "@/lib/report-period";
import { reporteTurnosPorEspecialidad } from "@/lib/reports";
import PrintButton from "./print-button";

export const metadata = {
  title: "Reportes administrativos | SigMed",
};

type SearchParams = {
  desde?: string;
  hasta?: string;
};

const numberFormatter = new Intl.NumberFormat("es-AR");
const percentFormatter = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });

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
  const report = resolved.ok ? await reporteTurnosPorEspecialidad(period) : null;

  const exportHref = `/admin/reportes/exportar?desde=${period.desde}&hasta=${period.hasta}`;
  const rango = `${formatReportDate(period.desde)} al ${formatReportDate(period.hasta)}`;

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
          <select
            id="modulo"
            defaultValue="turnos-especialidad"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
          >
            <option value="turnos-especialidad">
              Reporte de turnos atendidos y cancelados por especialidad
            </option>
          </select>
        </div>

        <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <label htmlFor="desde" className="mb-1 block text-xs font-medium text-zinc-600">
              Fecha Desde
            </label>
            <input
              id="desde"
              name="desde"
              type="date"
              required
              defaultValue={period.desde}
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
              defaultValue={period.hasta}
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
      </form>

      {!resolved.ok ? (
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {resolved.error}
        </p>
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
