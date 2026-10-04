import Link from "next/link";

export default function PortalLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="text-base font-semibold tracking-tight">
            SigMed
          </Link>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
              Sesion sin autenticar
            </span>
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

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
