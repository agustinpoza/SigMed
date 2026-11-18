import type { LowStockVaccine } from "@/lib/stock-alerts";

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

type StockAlertsPanelProps = {
  alerts: LowStockVaccine[];
};

/**
 * Panel completo de stock critico para /enfermera/inventario.
 * Se calcula con el stock actual contra el umbral vigente; la alerta activa
 * solo aporta la fecha de generacion.
 */
export function StockAlertsPanel({ alerts }: StockAlertsPanelProps) {
  return (
    <section
      id="alertas"
      aria-labelledby="alertas-stock-title"
      className="scroll-mt-4 rounded-lg border border-red-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2
            id="alertas-stock-title"
            className="text-lg font-semibold text-zinc-900"
          >
            Vacunas con stock crítico
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Existencias por debajo del umbral configurado para cada vacuna.
          </p>
        </div>
        <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
          {alerts.length === 0
            ? "Sin alertas"
            : `${alerts.length} ${alerts.length === 1 ? "vacuna" : "vacunas"}`}
        </span>
      </div>

      {alerts.length === 0 ? (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          No hay vacunas por debajo de su umbral crítico.
        </p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Vacuna
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Stock actual
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Umbral crítico
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Alerta
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {alerts.map((alert) => (
                <tr key={alert.vaccineId}>
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    {alert.vaccineName}
                  </td>
                  <td className="px-4 py-3 font-semibold text-red-700">
                    {alert.stock}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {alert.criticalLevel}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {alert.alertGeneratedAt ? (
                      <>
                        Activa desde{" "}
                        <time dateTime={alert.alertGeneratedAt.toISOString()}>
                          {dateFormatter.format(alert.alertGeneratedAt)}
                        </time>
                      </>
                    ) : (
                      "Sin alerta activa"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
