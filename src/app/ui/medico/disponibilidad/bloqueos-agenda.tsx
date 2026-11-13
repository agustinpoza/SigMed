// app/ui/medico/disponibilidad/bloqueos-agenda.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { es } from "date-fns/locale";
import { BlockReason } from "@/generated/prisma/enums";
import { guardarBloqueosAgenda, obtenerDiasBloqueados } from "@/app/(portal)/medico/disponibilidad/bloqueos-actions";
import { HiOutlineX } from "react-icons/hi";
import Swal from "sweetalert2";

const MOTIVOS: { value: BlockReason; label: string }[] = [
  { value: BlockReason.FERIADO, label: "Feriado" },
  { value: BlockReason.LICENCIA, label: "Licencia" },
  { value: BlockReason.IMPREVISTO, label: "Motivos personales" },
];

function isBlockReason(value: string): value is BlockReason {
  return MOTIVOS.some((opcion) => opcion.value === value);
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function clinicToday(): Date {
  const date = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return fromDateKey(date);
}

export default function BloqueosAgenda({ onConfirmed }: { onConfirmed: () => void }) {
  const [abierto, setAbierto] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [diasSeleccionados, setDiasSeleccionados] = useState<Date[]>([]);
  const [diasBloqueados, setDiasBloqueados] = useState<string[]>([]);
  const [motivo, setMotivo] = useState<BlockReason>(BlockReason.FERIADO);
  const [descripcion, setDescripcion] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [mensajeResultado, setMensajeResultado] = useState("");
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!abierto) return;

    let vigente = true;
    void obtenerDiasBloqueados()
      .then((resultado) => {
        if (!vigente) return;
        setDiasBloqueados(resultado.dias);
        setMensaje(resultado.message ?? "");
      })
      .catch((error: unknown) => {
        console.error("Error al cargar los días bloqueados:", error);
        if (vigente) setMensaje("No se pudieron consultar los días bloqueados.");
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [abierto]);

  const hoy = clinicToday();
  const fechasBloqueadas = diasBloqueados.map(fromDateKey);
  const disabledDays = [{ before: hoy }, ...fechasBloqueadas];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (abierto && !dialog.open) dialog.showModal();
    if (!abierto && dialog.open) dialog.close();
  }, [abierto]);

  async function guardar() {
    setGuardando(true);
    setMensaje("");

    try {
      const resultado = await guardarBloqueosAgenda({
        dias: diasSeleccionados.map(toDateKey),
        motivo,
        descripcion,
      });

      if (resultado.status === "success") {
        setMensajeResultado(resultado.message);
        setDiasSeleccionados([]);
        setAbierto(false);
        onConfirmed();
      } else {
        setMensaje(resultado.message);
        void Swal.fire({
          icon: "error",
          title: "No se pudieron guardar los bloqueos",
          text: resultado.message,
          confirmButtonText: "Aceptar",
          buttonsStyling: false,
          customClass: {
            confirmButton: "bg-slate-600 text-white rounded-sm p-2 px-3 m-2",
          },
        });
      }
    } catch (error: unknown) {
      console.error("Error al guardar los días bloqueados:", error);
      setMensaje("No se pudieron guardar los bloqueos de agenda.");
      void Swal.fire({
        icon: "error",
        title: "No se pudieron guardar los bloqueos",
        text: "Ocurrió un error inesperado.",
        confirmButtonText: "Aceptar",
        buttonsStyling: false,
        customClass: {
          confirmButton: "bg-slate-600 text-white rounded-sm p-2 px-3 m-2",
        },
      });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="m-4">
      <button
        type="button"
        onClick={() => {
          if (!abierto) setCargando(true);
          setAbierto((actual) => !actual);
          setMensaje("");
          setMensajeResultado("");
        }}
        aria-expanded={abierto}
        aria-haspopup="dialog"
        className="rounded-lg text-gray-200 hover:text-white bg-slate-600 hover:bg-slate-800 p-2"
      >
        Modificar agenda
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="bloqueos-agenda-titulo"
        aria-describedby="bloqueos-agenda-descripcion"
        onCancel={(event) => {
          event.preventDefault();
          setAbierto(false);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setAbierto(false);
        }}
        className="m-auto max-h-[90vh] w-[min(100%-2rem,56rem)] max-w-none overflow-y-auto rounded-xl border border-slate-300 bg-slate-50 p-0 text-left shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        <section className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id="bloqueos-agenda-titulo" className="text-xl font-semibold text-slate-900">
                Bloquear días
              </h2>
              <p id="bloqueos-agenda-descripcion" className="mt-1 text-sm text-slate-600">
                Seleccioná una o más fechas y el motivo. Se bloqueará cada día completo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAbierto(false)}
              className="shrink-0 rounded-xl bg-slate-600 hover:bg-slate-200 border p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
            >
              <HiOutlineX className="size-5 text-white hover:text-slate-600" />
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-start">
            <div className="md:shrink-0">
              <DayPicker
                mode="multiple"
                selected={diasSeleccionados}
                onSelect={(seleccionadas) => setDiasSeleccionados(seleccionadas ?? [])}
                disabled={disabledDays}
                modifiers={{ bloqueado: fechasBloqueadas }}
                modifiersClassNames={{
                  bloqueado: "[&>button]:!bg-slate-600 [&>button]:!text-gray-100 [&>button]:font-semibold",
                }}
                locale={es}
                weekStartsOn={0}
                className="rounded-lg border border-gray-300 bg-white p-4 text-black"
                classNames={{
                  months: "relative",
                  month: "w-full",
                  month_caption: "flex h-9 items-center",
                  caption_label: "font-semibold capitalize",
                  nav: "absolute right-0 top-0 gap-1",
                  button_previous: "inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 hover:bg-slate-100",
                  button_next: "inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 hover:bg-slate-100",
                  month_grid: "mt-2 w-full border-collapse",
                  weekdays: "bg-slate-200",
                  weekday: "py-2 text-sm font-medium capitalize text-slate-500",
                  day: "p-0.5 text-center",
                  day_button: "h-10 w-10 rounded-md text-sm hover:bg-slate-100",
                  selected: "[&>button]:bg-amber-200 [&>button]:font-bold [&>button]:text-amber-900",
                  today: "[&>button]:font-bold",
                  outside: "[&>button]:text-slate-300",
                  disabled: "[&>button]:cursor-not-allowed [&>button]:text-slate-300",
                }}
              />
              <p className="mt-2 text-sm text-slate-600" aria-label="Leyenda del calendario">
                <span className="mr-2 inline-block size-3 rounded-sm border border-slate-200 bg-slate-600 align-middle" />
                Día previamente bloqueado
              </p>
            </div>

            <div className="w-full min-w-0 flex-1 md:min-w-64">
              <label htmlFor="motivo-bloqueo" className="mb-1 block text-sm font-medium text-slate-800">
                Motivo
              </label>
              <select
                id="motivo-bloqueo"
                value={motivo}
                onChange={(event) => {
                  const value = event.target.value;
                  if (isBlockReason(value)) setMotivo(value);
                }}
                className="w-full rounded-md border border-gray-300 bg-white p-2 text-slate-900"
              >
                {MOTIVOS.map((opcion) => (
                  <option key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </option>
                ))}
              </select>

              <label htmlFor="detalle-bloqueo" className="mb-1 mt-4 block text-sm font-medium text-slate-800">
                Detalle (opcional)
              </label>
              <textarea
                id="detalle-bloqueo"
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                maxLength={200}
                rows={3}
                className="w-full resize-y rounded-md border border-gray-300 bg-white p-2 text-slate-900"
              />
              <p className="mt-3 text-sm text-slate-600">
                {diasSeleccionados.length} {diasSeleccionados.length === 1 ? "día seleccionado" : "días seleccionados"}
                {diasBloqueados.length > 0 && ` · ${diasBloqueados.length} ya bloqueados`}
              </p>
              <button
                type="button"
                onClick={guardar}
                disabled={cargando || guardando || diasSeleccionados.length === 0}
                className="mt-3 w-full rounded-lg text-gray-200 hover:text-white bg-slate-600 hover:bg-slate-800 p-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Confirmar bloqueo"}
              </button>
            </div>
          </div>

          <p className="mt-4 text-sm text-amber-800">
            Los turnos que ya están reservados no se cancelan automáticamente. Coordiná su reprogramación.
          </p>
          {mensaje && <p role="status" className="mt-2 text-sm text-slate-700">{mensaje}</p>}
        </section>
      </dialog>
      {mensajeResultado && (
        <p role="status" className="mt-2 text-sm text-slate-700">
          {mensajeResultado}
        </p>
      )}
    </div>
  );
}