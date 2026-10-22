// app/(portal)/medico/page.tsx
import { getCurrentActor } from "@/lib/actor";
import Link from "next/link";

export default async function MedicoPage() {
  const medico = await getCurrentActor();

  return (
    <main>
      <div className="flex flex-col justify-start mb-2">
        <h1 className="text-2xl text-black font-bold">
          Bienvenido/a, Doctor/a {medico?.firstName} {medico?.lastName}
        </h1>
        <p className="text-sm text-gray-500">
          Estas son las funciones disponibles para tu rol de médico
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <section className="flex-col bg-gray-100 rounded-md p-2">
          <h2 className="text-lg text-black font-semibold">
            Hoja de trabajo
          </h2>
          <p className="text-sm text-gray-400 mb-2">
            Consulta su hoja de trabajo diaria disponibles por fecha.
          </p>
          <Link href="/medico/agenda"
                className="text-gray-500 bg-gray-100 rounded-md border border-gray-400 p-1"
          >
            Ir a Hoja de trabajo
          </Link>
        </section>
        <section className="flex-col bg-gray-100 rounded-md p-2">
          <h2 className="text-lg text-black font-semibold">
            Disponibilidad mensual
          </h2>
          <p className="text-sm text-gray-400 mb-2">
            Consulte, establezca y edite su disponibilidad mensual para la reserva de turnos.
          </p>
          <Link href="/medico/disponibilidad"
                className="text-gray-500 bg-gray-100 rounded-md border border-gray-400 p-1"
          >
            Ir a Disponibilidad
          </Link>
        </section>
      </div>
    </main>
  );
}