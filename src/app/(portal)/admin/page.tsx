// app/(portal)/admin/page.tsx
import { getCurrentActor } from "@/lib/dev-actor";
import Link from "next/link";

export default async function AdminPage() {
  const admin = await getCurrentActor();

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
        <section className="flex-col bg-gray-100 rounded-md p-2">
          <h2 className="text-lg text-black font-semibold">
            Ejecutar funciones
          </h2>
          <p className="text-sm text-gray-400 mb-2">
            Consulta y ejecuta las funciones disponibles para usuarios de distintos roles.
          </p>
          <Link href="/admin"
                className="text-gray-500 bg-gray-100 rounded-md border border-gray-400 p-1"
          >
            Ir a Cambiar de rol
          </Link>
        </section>
      </div>
    </main>
  );
}