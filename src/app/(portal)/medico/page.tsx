// app/(portal)/medico/page.tsx
import { UserRole } from "@/generated/prisma/browser";
import { getCurrentActor } from "@/lib/actor";
import Link from "next/link";

export default async function MedicoPage() {
  const medico = await getCurrentActor();

  if (!medico || medico.role !== UserRole.MEDICO) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
                No tenés permiso para acceder a esta sección. Solo está disponible
                para médicos.
            </div>
        );
    }

  return (
    <main>
      <div className="flex flex-col justify-start bg-linear-to-l from-slate-300 to-slate-200 rounded-xl px-3 py-2 mb-2">
        <h1 className="text-2xl text-black font-bold">
          Bienvenido, Doctor/a {medico?.firstName} {medico?.lastName}
        </h1>
        <p className="text-sm text-gray-500">
          Estas son las funciones disponibles para tu rol de médico
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <section className="flex-col bg-white rounded-lg p-4">
          <h2 className="text-lg text-black font-semibold">
            Hoja de trabajo
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Consulta su hoja de trabajo diaria disponibles por fecha.
          </p>
          <Link href="/medico/agenda"
                className="text-black/75 hover:text-gray-200 bg-white hover:bg-slate-600 rounded-md border border-black/25 p-2"
          >
            Ir a Hoja de trabajo
          </Link>
        </section>
        <section className="flex-col bg-white rounded-lg p-4">
          <h2 className="text-lg text-black font-semibold">
            Disponibilidad mensual
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Consulte, establezca y edite su disponibilidad mensual para la reserva de turnos.
          </p>
          <Link href="/medico/disponibilidad"
                className="text-black/75 hover:text-gray-200 bg-white hover:bg-slate-600 rounded-md border border-black/25 p-2"
          >
            Ir a Disponibilidad
          </Link>
        </section>
        <section className="col-span-1 md:col-span-2 flex-col bg-white rounded-lg p-4">
          <h2 className="text-lg text-black font-semibold">
            Mi perfil
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Consulta tus datos personales y modifica el valor de tu consulta particular.
          </p>
          <Link href="/medico/perfil"
                className="block w-full text-black/75 hover:text-gray-200 bg-white hover:bg-slate-600 rounded-md border border-black/25 p-2"
          >
            Ir a Mi Perfil
          </Link>
        </section>
      </div>
    </main>
  );
}