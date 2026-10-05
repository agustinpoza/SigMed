import { prisma } from "@/lib/db";
import { MovementForm } from "./movement-form";
import { AlertStatus } from "@/generated/prisma/enums";

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
  const [vaccines, lots, movements, alerts] = await Promise.all([
    prisma.vaccine.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, criticalLevel: true },
    }),
    prisma.vaccineLot.findMany({
      orderBy: [{ expiresAt: "asc" }],
      include: { vaccine: { select: { name: true } } },
    }),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        lot: {
          select: { lotNumber: true, vaccine: { select: { name: true } } },
        },
        actor: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.stockAlert.findMany({
      where: { status: AlertStatus.ACTIVA },
      orderBy: { generatedAt: "asc" },
      include: { vaccine: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Actualizacion de stock
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Registra ingresos de dosis. Cada movimiento queda trazado con su
          responsable. Las salidas se generan al aprobar un turno de vacunacion.
        </p>
      </header>

      {alerts.length > 0 && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <h2 className="mb-3 text-base font-semibold text-amber-900">
            Alertas de stock critico
          </h2>
          <ul className="space-y-1 text-sm text-amber-900">
            {alerts.map((alert) => (
              <li key={alert.id}>
                <span className="font-medium">{alert.vaccine.name}</span>: stock{" "}
                {alert.stockWhenGenerated} por debajo del nivel critico de{" "}
                {alert.criticalLevelWhenGenerated}.
              </li>
            ))}
          </ul>
        </section>
      )}

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
                  const isIncome = movement.quantity > 0;

                  return (
                    <tr key={movement.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-zinc-600">
                        {dateFormatter.format(movement.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {movement.lot.vaccine.name}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {movement.lot.lotNumber}
                      </td>
                      <td
                        className={
                          isIncome
                            ? "px-4 py-3 font-medium text-emerald-700"
                            : "px-4 py-3 font-medium text-red-700"
                        }
                      >
                        {isIncome ? "+" : "-"}
                        {Math.abs(movement.quantity)}
                        <span className="ml-1 text-xs font-normal text-zinc-500">
                          ({movement.type.toLowerCase()})
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