import Link from "next/link";
import { UserRole } from "@/generated/prisma/enums";
import { listarMedicos } from "@/lib/ejercicio-targets";
import { iniciarEjercicio } from "../actions";

export const metadata = {
  title: "Ejercer como médico",
};

/**
 * US-7.5: el administrador elige sobre que profesional opera. El area medica
 * lee por id de ficha, asi que sin elegir un profesional no hay agenda que
 * mostrar ni turnos sobre los que trabajar.
 */
export default async function EjercerComoMedicoPage() {
  const medicos = await listarMedicos();

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Ejercer como médico
        </h1>
        <p className="text-sm text-zinc-600">
          Elegí el profesional cuya agenda y disponibilidad vas a operar. Conservás
          tu identidad de administrador: la operación queda registrada en la auditoría.
        </p>
      </header>

      <div className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
        {medicos.length === 0 ? (
          <p role="status" className="text-sm text-zinc-600">
            Todavía no hay profesionales cargados.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200">
            {medicos.map((medico) => (
              <li
                key={medico.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-medium text-zinc-900">
                    {medico.apellido}, {medico.nombre}
                  </p>
                  <p className="text-sm text-zinc-600">
                    DNI {medico.dni} · {medico.detalle}
                  </p>
                </div>
                <form action={iniciarEjercicio}>
                  <input type="hidden" name="role" value={UserRole.MEDICO} />
                  <input type="hidden" name="targetId" value={medico.id} />
                  <button
                    type="submit"
                    className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
                  >
                    Ejercer como este profesional
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link href="/admin" className="text-sm font-medium text-zinc-900 underline">
        Volver a administración
      </Link>
    </section>
  );
}
