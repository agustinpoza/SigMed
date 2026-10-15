import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentActor } from "@/lib/actor";
import { homeForRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function Home() {
  const actor = await getCurrentActor();

  if (actor) {
    redirect(homeForRole(actor.role));
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
