// app/(portal)/admin/page.tsx
import Link from "next/link";
import { UserRole } from "@/generated/prisma/enums";
import { getActorContext } from "@/lib/actor";
import { ROLE_LABELS } from "@/lib/permissions";
import { iniciarEjercicio } from "./ejercer/actions";
import { FaUser, FaUserDoctor, FaUserNurse } from "react-icons/fa6";

export default async function AdminPage() {
  const context = await getActorContext();
  const admin = context?.real ?? null;
  const acting = context?.acting ?? null;

  return (
    <main>
      <div className="flex flex-col justify-start mb-2">
        <h1 className="text-2xl text-black font-bold">
          Bienvenido, {admin?.firstName} {admin?.lastName}
        </h1>
        <p className="text-sm text-gray-500">
          Estas son las funciones disponibles para tu rol de administrador
        </p>
      </div>

      {acting ? (
        <p className="mb-3 rounded-md border border-amber-300 bg-amber-100 px-3 py-2 text-sm text-amber-950">
          Estás en modo ejercicio como {ROLE_LABELS[acting.role]}. Al entrar a otra
          función se cambia el contexto y queda registrado.
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <section className="flex-col bg-gray-100 rounded-md p-2">
          <h2 className="text-lg text-black font-semibold">
            Registrar personal
          </h2>
          <p className="text-sm text-gray-400 mb-2">
            Consulta el personal disponible y registra un nuevo miembro.
          </p>
          <Link href="/admin/personal"
                className="text-gray-500 bg-gray-100 rounded-md border border-gray-400 p-1"
          >
            Ir a Registrar personal
          </Link>
        </section>
        <section className="flex-col bg-gray-100 rounded-md p-2">
          <h2 className="text-lg text-black font-semibold">
            Gestionar horarios
          </h2>
          <p className="text-sm text-gray-400 mb-2">
            Consulta y gestiona los horarios disponbiles para los médicos.
          </p>
          <Link href="/admin/horarios"
                className="text-gray-500 bg-gray-100 rounded-md border border-gray-400 p-1"
          >
            Ir a Horarios
          </Link>
        </section>
        <section className="col-span-2 flex-col bg-gray-100 rounded-md p-2">
          <h2 className="text-lg text-black font-semibold">
            Ejecutar funciones
          </h2>
          <p className="text-sm text-gray-400 mb-2">
            Consulta y ejecuta las funciones disponibles para usuarios de distintos roles.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <Link href="/admin/ejercer/medico"
                  className="flex flex-col items-center justify-center rounded-md border border-gray-400 bg-white p-2 text-md font-medium text-gray-700 hover:bg-gray-50"
            >
              <FaUserDoctor className="size-10" />
              Ejercer como médico
            </Link>
            <form action={iniciarEjercicio}>
              <input type="hidden" name="role" value={UserRole.ENFERMERA} />
              <button
                type="submit"
                className="flex flex-col items-center justify-center w-full rounded-md border border-gray-400 bg-white p-2 text-md font-medium text-gray-700 hover:bg-gray-50"
              >
                <FaUserNurse className="size-10" />
                Ejercer como enfermería
              </button>
            </form>
            <Link href="/admin/ejercer/paciente"
                  className="flex flex-col items-center justify-center rounded-md border border-gray-400 bg-white p-2 text-md font-medium text-gray-700 hover:bg-gray-50"
            >
              <FaUser className="size-10" />
              Ejercer como paciente
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
