import { getCurrentActor } from "@/lib/actor";
import { prisma } from "@/lib/db";
import InvoiceList from "./invoice-list";

export const metadata = {
  title: "Mis facturas | SigMed",
};

export type InvoiceRow = {
  id: string;
  date: string;
  type: string;
  number: string;
  amount: number;
  status: string;
};

export default async function FacturasPage() {
  const actor = await getCurrentActor();

  if (!actor || actor.role !== "PACIENTE") {
    return (
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-md border border-zinc-200 bg-white">
        <header className="border-b border-zinc-200 px-5 py-4 sm:px-6">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Mis facturas</h1>
        </header>
        <p className="px-5 py-8 text-center text-sm text-zinc-600 sm:px-6">
          {!actor ? "No hay una sesión de paciente activa." : "No tenés acceso a esta sección."}
        </p>
      </div>
    );
  }

  const invoices = await prisma.invoice.findMany({
    where: { patientId: actor.id },
    orderBy: { date: "desc" },
  });

  const rows: InvoiceRow[] = invoices.map((inv) => ({
    id: inv.id,
    date: inv.date.toISOString(),
    type: inv.type,
    number: inv.number,
    amount: Number(inv.amount),
    status: inv.status,
  }));

  return (
    <section className="mx-auto w-full max-w-5xl overflow-hidden rounded-md border border-zinc-200 bg-white">
      <header className="border-b border-zinc-200 px-5 py-4 sm:px-6">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Mis facturas</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Consultá y descargá tus facturas o comprobantes digitales.
        </p>
      </header>
      <InvoiceList invoices={rows} />
    </section>
  );
}
