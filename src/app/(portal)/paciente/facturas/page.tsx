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
      <div className="flex flex-col gap-6">
        <header className="flex flex-col justify-start rounded-xl bg-linear-to-l from-slate-300 to-slate-200 px-3 py-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">
            Mis facturas
          </h1>
        </header>
        <p className="mx-auto w-full max-w-5xl rounded-md border border-zinc-200 bg-white px-5 py-8 text-center text-sm text-zinc-600 sm:px-6">
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
    <div className="flex flex-col gap-4">
      <header className="flex flex-col justify-start rounded-xl bg-linear-to-l from-slate-300 to-slate-200 px-3 py-2">
        <h1 className="text-2xl font-bold tracking-tight text-black">
          Mis facturas
        </h1>
        <p className="text-sm text-gray-700">
          Consultá y descargá tus facturas o comprobantes digitales.
        </p>
      </header>
      <section className="w-full rounded-md border border-zinc-200 bg-white">
        <InvoiceList invoices={rows} />
      </section>
    </div>
  );
}
