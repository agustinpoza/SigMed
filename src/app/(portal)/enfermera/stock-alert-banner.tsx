import Link from "next/link";
import type { LowStockVaccine } from "@/lib/stock-alerts";

type StockAlertBannerProps = {
  alerts: LowStockVaccine[];
};

/**
 * Resumen de stock critico para el inicio de enfermeria. Solo aparece cuando
 * hay al menos una vacuna comprometida; el detalle vive en /enfermera/inventario.
 */
export function StockAlertBanner({ alerts }: StockAlertBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <aside
      aria-labelledby="stock-alert-banner-title"
      className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4"
    >
      <h2
        id="stock-alert-banner-title"
        className="text-lg font-semibold text-red-800"
      >
        Alerta de stock crítico
      </h2>
      <p className="mt-1 text-sm text-red-700">
        {alerts.length === 1
          ? "1 vacuna está por debajo de su umbral crítico."
          : `${alerts.length} vacunas están por debajo de su umbral crítico.`}
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
        {alerts.map((alert) => (
          <li key={alert.vaccineId}>
            {alert.vaccineName}: {alert.stock} en stock, umbral{" "}
            {alert.criticalLevel}.
          </li>
        ))}
      </ul>
      <Link
        href="/enfermera/inventario#alertas"
        className="mt-3 inline-block rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-800 transition hover:bg-red-100"
      >
        Ver detalle de stock
      </Link>
    </aside>
  );
}
