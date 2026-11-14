"use client";

import type { InvoiceRow } from "./page";

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Argentina/Buenos_Aires",
});

const amountFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});

const STATUS_LABELS: Record<string, string> = {
  PAGADA: "Pagada",
  PENDIENTE: "Pendiente",
  ANULADA: "Anulada",
};

export default function InvoiceList({ invoices }: { invoices: InvoiceRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-zinc-200 bg-white text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Fecha</th>
            <th scope="col" className="px-4 py-3 font-medium">Tipo</th>
            <th scope="col" className="px-4 py-3 font-medium">Número</th>
            <th scope="col" className="px-4 py-3 font-medium">Monto</th>
            <th scope="col" className="px-4 py-3 font-medium">Estado</th>
            <th scope="col" className="px-4 py-3 text-center font-medium">Descarga</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {invoices.map((inv) => (
            <tr key={inv.id} className="hover:bg-zinc-50/70">
              <td className="whitespace-nowrap px-4 py-3 text-zinc-700">
                <time dateTime={inv.date}>{dateFormatter.format(new Date(inv.date))}</time>
              </td>
              <td className="px-4 py-3 text-zinc-700">{inv.type}</td>
              <td className="px-4 py-3 font-medium text-zinc-900">{inv.number}</td>
              <td className="px-4 py-3 text-zinc-700">{amountFormatter.format(inv.amount)}</td>
              <td className="px-4 py-3 text-zinc-700">{STATUS_LABELS[inv.status] ?? inv.status}</td>
              <td className="px-4 py-3 text-center">
                <a
                  href={`/api/patient/invoices/${inv.id}/download`}
                  className="inline-flex rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
                >
                  Descargar
                </a>
              </td>
            </tr>
          ))}
          {invoices.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-500">
                Todavía no hay facturas o comprobantes disponibles.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
