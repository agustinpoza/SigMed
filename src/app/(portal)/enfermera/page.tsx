// app/(portal)/enfermera/page.tsx
import { getCurrentActor } from "@/lib/actor";
import Link from "next/link";

export default async function EnfermeraPage() {
  const enfermera = await getCurrentActor();

  return (
    <main>
      <div className="flex flex-col justify-start mb-2">
        <h1 className="text-2xl text-black font-bold">
          Bienvenido/a, Enfermero/a {enfermera?.firstName} {enfermera?.lastName}
        </h1>
        <p className="text-sm text-gray-500">
          Estas son las funciones disponibles para tu rol de enfermera
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <section className="flex-col bg-white rounded-lg p-4">
          <h2 className="text-lg text-black font-semibold">
            Catálogo de vacunas
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Consulta la gestión del catálogo de vacunas disponibles.
          </p>
          <Link href="/enfermera/vacunas"
                className="text-black/75 bg-white rounded-md border border-black/25 p-2"
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
                className="text-black/75 bg-white rounded-md border border-black/25 p-2"
          >
            Ir a Turnos de vacunación
          </Link>
        </section>
        <section className="flex-col bg-white rounded-lg p-4">
          <h2 className="text-lg text-black font-semibold">
            Stock
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Consulta el control de stock, registro e historial disponible.
          </p>
          <Link href="/enfermera/inventario"
                className="text-black/75 bg-white rounded-md border border-black/25 p-2"
          >
            Ir a Stock
          </Link>
        </section>
      </div>
    </main>
  );
}