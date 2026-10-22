import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import Footer from "@/app/ui/footer";
import EjercicioBanner from "@/app/ui/admin/ejercicio-banner";
import { getActorContext } from "@/lib/actor";
import { ROLE_LABELS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: LayoutProps<"/">) {
  await auth.protect();

  const context = await getActorContext();
  const actor = context?.real ?? null;
  const acting = context?.acting ?? null;

  // El contexto del modo ejercicio: el profesional o el paciente sobre el que
  // opera el administrador.
  const contexto = acting?.actor
    ? `${acting.actor.lastName}, ${acting.actor.firstName}`
    : null;

  return (
    <div className="flex min-h-dvh min-w-0 flex-col bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-slate-600 text-zinc-100">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-3 py-4 sm:px-6">
          <Link href="/" className="text-base font-semibold tracking-tight">
            SigMed
          </Link>

          <div className="flex items-center gap-3">
            {actor ? (
              <span className="flex items-center gap-2 text-sm text-zinc-100">
                {actor.firstName} {actor.lastName}
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-zinc-600">
                  {actor.role}
                </span>
              </span>
            ) : null}
            <UserButton />
          </div>
        </div>
      </header>

      {acting ? (
        <EjercicioBanner rol={ROLE_LABELS[acting.role]} contexto={contexto} />
      ) : null}

      <main className="mx-auto w-full min-w-0 bg-gray-300 max-w-6xl flex-1 px-3 py-8 sm:px-6">{children}</main>

      <Footer />
    </div>
  );
}
