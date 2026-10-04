import { prisma } from "@/lib/db";
import { MovementForm } from "./movement-form";

export const metadata = {
  title: "Actualizacion de stock | SigMed",
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

const dateFormatterWithExpiry = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
});

export default async function InventarioPage() {
  const [vaccines, lots, movements] = await Promise.all([
    prisma.vaccine.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, laboratory: true },
    }),
    prisma.vaccineLot.findMany({
      orderBy: [{ expiresAt: "asc" }],
      include: { vaccine: { select: { name: true } } },
    }),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        vaccine: { select: { name: true } },
        vaccineLot: { select: { lotNumber: true } },
        actor: { select: { firstName: true, lastName: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Actualizacion de stock
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Registra ingresos y egresos de dosis. Cada movimiento queda trazado con
          su responsable.
        </p>
      </header>

      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-zinc-900">
          Registro de movimiento
        </h2>
        <MovementForm vaccines={vaccines} />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900">Stock por lote</h2>

        {lots.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600">Todavia no hay lotes cargados.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Vacuna</th>
                  <th scope="col" className="px-4 py-3 font-medium">Lote</th>
                  <th scope="col" className="px-4 py-3 font-medium">Vence</th>
                  <th scope="col" className="px-4 py-3 font-medium">Disponible</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {lots.map((lot) => (
                  <tr key={lot.id}>
                    <td className="px-4 py-3 font-medium text-zinc-900">
                      {lot.vaccine.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{lot.lotNumber}</td>
                    <td className="px-4 py-3 text-zinc-600">
                      {dateFormatterWithExpiry.format(lot.expiresAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          lot.quantityAvailable === 0
                            ? "font-medium text-red-700"
                            : "font-medium text-zinc-900"
                        }
                      >
                        {lot.quantityAvailable}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900">
          Historial de movimientos recientes
        </h2>

        {movements.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600">Todavia no hay movimientos.</p>
        ) : (
          <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Fecha/hora</th>
                  <th scope="col" className="px-4 py-3 font-medium">Vacuna</th>
                  <th scope="col" className="px-4 py-3 font-medium">Lote</th>
                  <th scope="col" className="px-4 py-3 font-medium">Movimiento</th>
                  <th scope="col" className="px-4 py-3 font-medium">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {movements.map((movement) => {
                  const isIncome = movement.movementType === "INGRESO";

                  return (
                    <tr key={movement.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-zinc-600">
                        {dateFormatter.format(movement.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {movement.vaccine.name}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {movement.vaccineLot.lotNumber}
                      </td>
                      <td
                        className={
                          isIncome
                            ? "px-4 py-3 font-medium text-emerald-700"
                            : "px-4 py-3 font-medium text-red-700"
                        }
                      >
                        {isIncome ? "+" : "-"}
                        {movement.quantity}
                        <span className="ml-1 text-xs font-normal text-zinc-500">
                          ({movement.movementType.toLowerCase()})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {movement.actor.firstName} {movement.actor.lastName}
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
