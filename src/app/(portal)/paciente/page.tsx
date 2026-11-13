// app/(portal)/enfermera/page.tsx
import { getCurrentActor } from "@/lib/actor";
import Link from "next/link";

export default async function PacientePage() {
  const paciente = await getCurrentActor();

  return (
    <main>
      <div className="flex flex-col justify-start bg-linear-to-l from-slate-300 to-slate-200 rounded-xl px-3 py-2 mb-2">
        <h1 className="text-2xl text-black font-bold">
          Bienvenido, {paciente?.firstName} {paciente?.lastName}
        </h1>
        <p className="text-sm text-gray-500">
          Estas son las funciones disponibles para tu rol de paciente
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <section className="flex-col bg-white rounded-lg p-4">
          <h2 className="text-lg text-black font-semibold">
            Buscar turnos
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Consulta los horarios disponibles por especialidad, profesional o fecha.
          </p>
          <Link href="/paciente/turnos"
                className="text-black/75 hover:text-gray-200 bg-white hover:bg-slate-600 rounded-md border border-black/25 p-2"
          >
            Ir a Buscar turnos
          </Link>
        </section>
        <section className="flex-col bg-white rounded-lg p-4">
          <h2 className="text-lg text-black font-semibold">
            Mi historial clínico
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Consulta tus diagnósticos, tratamientos e indicaciones.
          </p>
          <Link href="/paciente/historial"
                className="text-black/75 hover:text-gray-200 bg-white hover:bg-slate-600 rounded-md border border-black/25 p-2"
          >
            Ir a Mi historial
          </Link>
        </section>
        <section className="flex-col bg-white rounded-lg p-4">
          <h2 className="text-lg text-black font-semibold">
            Mis turnos
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Consulta tus turnos reservados y confirmalos.
          </p>
          <Link href="/paciente/mis-turnos"
                className="text-black/75 hover:text-gray-200 bg-white hover:bg-slate-600 rounded-md border border-black/25 p-2"
          >
            Ir a Mis turnos
          </Link>
        </section>
        <section className="flex-col bg-white rounded-lg p-4">
          <h2 className="text-lg text-black font-semibold">
            Mi cobertura médica
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Consulta y actualiza la información de tu cobertura médica.
          </p>
          <Link href="/paciente/cobertura-medica"
                className="text-black/75 hover:text-gray-200 bg-white hover:bg-slate-600 rounded-md border border-black/25 p-2"
          >
            Ir a Cobertura médica
          </Link>
        </section>
        <section className="col-span-1 md:col-span-2 flex-col bg-white rounded-lg p-4">
          <h2 className="text-lg text-black font-semibold">
            Pagos y coberturas
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Abona consultas particulares y consulta tus deudas por inasistencia.
          </p>
          <Link href="/paciente/pagos"
                className="text-black/75 hover:text-gray-200 bg-white hover:bg-slate-600 rounded-md border border-black/25 p-2"
          >
            Ir a Pagos y deudas
          </Link>
        </section>
      </div>
    </main>
  );
}
