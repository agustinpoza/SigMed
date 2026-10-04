import { prisma } from "@/lib/db";
import { VaccineForm } from "./vaccine-form";

export const metadata = {
  title: "Alta de vacunas | SigMed",
};

export default async function VacunasPage() {
  const [vaccines, laboratoryRows] = await Promise.all([
    prisma.vaccine.findMany({
      orderBy: { name: "asc" },
      include: { lots: { select: { quantityAvailable: true } } },
    }),
    prisma.vaccine.findMany({
      distinct: ["laboratory"],
      orderBy: { laboratory: "asc" },
      select: { laboratory: true },
    }),
  ]);

  const laboratories = laboratoryRows.map((row) => row.laboratory);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Alta de nueva vacuna
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Carga la vacuna en el catalogo junto con su primer lote.
        </p>
      </header>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <VaccineForm laboratories={laboratories} />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900">Catalogo actual</h2>

        {vaccines.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600">
            Todavia no hay vacunas cargadas.
          </p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Vacuna</th>
                  <th scope="col" className="px-4 py-3 font-medium">Laboratorio</th>
                  <th scope="col" className="px-4 py-3 font-medium">Stock</th>
                  <th scope="col" className="px-4 py-3 font-medium">Umbral critico</th>
                  <th scope="col" className="px-4 py-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {vaccines.map((vaccine) => {
                  const stock = vaccine.lots.reduce(
                    (total, lot) => total + lot.quantityAvailable,
                    0,
                  );
                  const low = stock <= vaccine.criticalStockLevel;

                  return (
                    <tr key={vaccine.id}>
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {vaccine.name}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">{vaccine.laboratory}</td>
                      <td className="px-4 py-3 text-zinc-900">{stock}</td>
                      <td className="px-4 py-3 text-zinc-600">
                        {vaccine.criticalStockLevel}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            low
                              ? "inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"
                              : "inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800"
                          }
                        >
                          {low ? "Bajo umbral" : "Disponible"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
