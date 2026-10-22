import { finalizarEjercicio } from "@/app/(portal)/admin/ejercer/actions";

/**
 * US-7.5: aviso permanente del modo ejercicio. El administrador conserva su
 * identidad, asi que el banner deja claro con que rol esta operando y sobre
 * que datos, y ofrece la salida del modo.
 */
export default function EjercicioBanner({
  rol,
  contexto,
}: {
  rol: string;
  contexto: string | null;
}) {
  return (
    <div
      role="status"
      className="border-b border-amber-300 bg-amber-100 text-amber-950"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-3 py-2 text-sm sm:px-6">
        <p>
          <span className="font-semibold">Modo ejercicio.</span> Estás operando como{" "}
          <span className="font-semibold">{rol}</span>
          {contexto ? (
            <>
              {" "}
              sobre <span className="font-semibold">{contexto}</span>
            </>
          ) : null}
          . Las operaciones quedan registradas a tu nombre.
        </p>
        <form action={finalizarEjercicio}>
          <button
            type="submit"
            className="rounded-md bg-amber-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-amber-800"
          >
            Volver a administración
          </button>
        </form>
      </div>
    </div>
  );
}
