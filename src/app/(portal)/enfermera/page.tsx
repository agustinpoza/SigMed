// app/(portal)/enfermera/page.tsx
import { getCurrentActor } from "@/lib/actor";
import { listLowStockVaccines } from "@/lib/stock-alerts";
import Link from "next/link";
import { StockAlertBanner } from "./stock-alert-banner";

export default async function EnfermeraPage() {
  const [enfermera, alerts] = await Promise.all([
    getCurrentActor(),
    listLowStockVaccines(),
  ]);

  return (
    <main>
      <div className="flex flex-col justify-start bg-linear-to-l from-slate-300 to-slate-200 rounded-xl px-3 py-2 mb-2">
        <h1 className="text-2xl text-black font-bold">
          Bienvenido, Enfermero/a {enfermera?.firstName} {enfermera?.lastName}
        </h1>
        <p className="text-sm text-gray-500">
          Estas son las funciones disponibles para tu rol de enfermera
        </p>
      </div>
      <StockAlertBanner alerts={alerts} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <section className="flex-col bg-white rounded-lg p-4">
          <h2 className="text-lg text-black font-semibold">
            Catálogo de vacunas
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Consulta la gestión del catálogo de vacunas disponibles.
          </p>
          <Link href="/enfermera/vacunas"
                className="text-black/75 hover:text-gray-200 bg-white hover:bg-slate-600 rounded-md border border-black/25 p-2"
          >
            Ir a Catálogo de vacunas
          </Link>
        </section>
        <section className="flex-col bg-white rounded-lg p-4">
          <h2 className="text-lg text-black font-semibold">
            Turnos de vacunación
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Consulta el control de los turnos de vacunación registrados.
          </p>
          <Link href="/enfermera/turnos-vacunacion"
                className="text-black/75 hover:text-gray-200 bg-white hover:bg-slate-600 rounded-md border border-black/25 p-2"
          >
            Ir a Turnos de vacunación
          </Link>
        </section>
        <section className="col-span-1 md:col-span-2 flex-col bg-white rounded-lg p-4">
          <h2 className="text-lg text-black font-semibold">
            Stock
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Consulta el control de stock, registro e historial disponible.
          </p>
          <Link href="/enfermera/inventario"
                className="text-black/75 hover:text-gray-200 bg-white hover:bg-slate-600 rounded-md border border-black/25 p-2"
          >
            Ir a Stock
          </Link>
        </section>
      </div>
    </main>
  );
}