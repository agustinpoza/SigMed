import Link from "next/link";
import { getCurrentActor, isDevActorEnabled, listDevActorCandidates } from "@/lib/dev-actor";
import DevActorPicker from "./dev-actor-picker";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: LayoutProps<"/">) {
  const devEnabled = isDevActorEnabled();
  const [actor, candidates] = devEnabled
    ? await Promise.all([getCurrentActor(), listDevActorCandidates()])
    : [null, []];

  return (
    <div className="flex min-h-full flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="text-base font-semibold tracking-tight">
            SigMed
          </Link>

          <div className="flex items-center gap-3">
            {!devEnabled ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                Sesion sin autenticar
              </span>
            ) : (
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
                Sin autenticacion · Clerk pendiente
              </span>
            )}

            <button
              type="button"
              disabled
              className="rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-400"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {devEnabled && (
        <div className="border-b border-amber-200 bg-amber-50/60">
          <div className="mx-auto w-full max-w-6xl px-6 py-3">
            <DevActorPicker
              candidates={candidates}
              current={
                actor
                  ? {
                      id: actor.id,
                      firstName: actor.firstName,
                      lastName: actor.lastName,
                      email: actor.email,
                    }
                  : null
              }
            />
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
