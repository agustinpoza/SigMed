// app/(portal)/enfermera/page.tsx
import { getCurrentActor } from "@/lib/dev-actor";
import Link from "next/link";

export default async function PacientePage() {
  const paciente = await getCurrentActor();

  return (
    <main>
      <div className="flex flex-col justify-start mb-2">
        <h1 className="text-2xl text-black font-bold">
          Bienvenido, {paciente?.firstName} {paciente?.lastName}
        </h1>
        <p className="text-sm text-gray-500">
          Estas son las funciones disponibles para tu rol de paciente
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <section className="flex-col bg-gray-100 rounded-md p-2">
          <h2 className="text-lg text-black font-semibold">
            Buscar turnos
          </h2>
          <p className="text-sm text-gray-400 mb-2">
            Consulta los horarios disponibles por especialidad, profesional o fecha.
          </p>
          <Link href="/paciente/turnos"
                className="text-gray-500 bg-gray-100 rounded-md border border-gray-400 p-1"
          >
            Ir a Buscar turnos
          </Link>
        </section>
        <section className="flex-col bg-gray-100 rounded-md p-2">
          <h2 className="text-lg text-black font-semibold">
            Mi historial clínico
          </h2>
          <p className="text-sm text-gray-400 mb-2">
            Consulta tus diagnósticos, tratemientos e indicaciones.
          </p>
          <Link href="/paciente/historial"
                className="text-gray-500 bg-gray-100 rounded-md border border-gray-400 p-1"
          >
            Ir a Mi historial
          </Link>
        </section>
      </div>
    </main>
  );
}
