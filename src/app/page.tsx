import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { SignOutButton } from "@clerk/nextjs";
import { getCurrentActor } from "@/lib/actor";
import { homeForRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function Home() {
  const actor = await getCurrentActor();

  if (actor) {
    redirect(homeForRole(actor.role));
  }

  // Sesión de Clerk abierta con una cuenta que no está en la base: /sign-in
  // vuelve a "/" por tener sesión, así que hay que ofrecer cerrarla.
  const { userId } = await auth();

  if (userId) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">SigMed</h1>
          <p className="text-zinc-600">
            La cuenta con la que iniciaste sesión no está habilitada en SigMed. Cerrá
            sesión e ingresá con otra cuenta.
          </p>
        </header>
        <div>
          <SignOutButton redirectUrl="/sign-in">
            <button className="rounded-md bg-slate-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700">
              Cerrar sesión
            </button>
          </SignOutButton>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">SigMed</h1>
        <p className="text-zinc-600">
          Sistema de agenda, vacunas e historial clinico para la sala medica.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/sign-in"
          className="rounded-md bg-slate-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/sign-up"
          className="rounded-md border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          Crear cuenta
        </Link>
      </div>

      <footer className="text-sm text-zinc-500">
        Health check en <Link className="underline" href="/api/health">/api/health</Link>
      </footer>
    </main>
  );
}
