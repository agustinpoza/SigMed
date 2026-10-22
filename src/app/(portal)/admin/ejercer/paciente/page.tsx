import Link from "next/link";
import { UserRole } from "@/generated/prisma/enums";
import { listarPacientes } from "@/lib/ejercicio-targets";
import { iniciarEjercicio } from "../actions";

export const metadata = {
  title: "Ejercer como paciente",
};

type SearchParams = {
  q?: string;
};

/**
 * US-7.5: el administrador elige sobre que paciente opera. El historial clinico
 * se lee por id de ficha, asi que sin elegir un paciente no hay ficha que ver.
 */
export default async function EjercerComoPacientePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { q } = await searchParams;
  const busqueda = (q ?? "").trim();
  const pacientes = await listarPacientes(busqueda);

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Ejercer como paciente
        </h1>
        <p className="text-sm text-zinc-600">
          Elegí el paciente cuya ficha vas a consultar. Conservás tu identidad de
          administrador: la operación queda registrada en la auditoría.
        </p>
      </header>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="q" className="text-sm font-semibold text-zinc-700">
            Buscar por DNI, nombre o apellido
          </label>
          <input
            id="q"
            name="q"
            defaultValue={busqueda}
            className="min-w-[16rem] rounded-md border border-zinc-300 bg-white p-2 text-zinc-900"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-zinc-700 px-4 py-2 font-semibold text-white hover:bg-zinc-800"
        >
          Buscar
        </button>
      </form>

      <div className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
        {pacientes.length === 0 ? (
          <p role="status" className="text-sm text-zinc-600">
            No hay pacientes para mostrar.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200">
            {pacientes.map((paciente) => (
              <li
                key={paciente.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="font-medium text-zinc-900">
                    {paciente.apellido}, {paciente.nombre}
                  </p>
                  <p className="text-sm text-zinc-600">DNI {paciente.dni}</p>
                </div>
                <form action={iniciarEjercicio}>
                  <input type="hidden" name="role" value={UserRole.PACIENTE} />
                  <input type="hidden" name="targetId" value={paciente.id} />
                  <button
                    type="submit"
                    className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
                  >
                    Ejercer como este paciente
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
        {busqueda ? (
          <p className="mt-3 text-sm text-zinc-600">
            Se muestran los primeros 25 resultados. Ampliá la búsqueda si no
            encontrás al paciente.
          </p>
        ) : null}
      </div>

      <Link href="/admin" className="text-sm font-medium text-zinc-900 underline">
        Volver a administración
      </Link>
    </section>
  );
}
