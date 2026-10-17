// app/ui/medico/cronograma/disponiblidad-form.tsx
'use client';
import { useEffect, useState } from "react";
import { DayPicker } from "react-day-picker";
import { es } from "date-fns/locale";
import { Weekday } from "@/generated/prisma/enums";
import TablaResumen from "@/app/ui/medico/disponibilidad/tabla-resumen";
import FranjaHoraria from "@/app/ui/medico/disponibilidad/franja-horaria";
import { guardarDisponibilidad, obtenerDisponibilidad } from "@/app/(portal)/medico/disponibilidad/actions";

const WEEKDAY_BY_JS_DAY: Weekday[] = [
    Weekday.DOMINGO,
    Weekday.LUNES,
    Weekday.MARTES,
    Weekday.MIERCOLES,
    Weekday.JUEVES,
    Weekday.VIERNES,
    Weekday.SABADO,
];

export default function DisponibilidadForm() {
    const [fechas, setFechas] = useState<Date[]>([]);
    const [horaInicio, setHoraInicio] = useState<string>("00:00");
    const [horaFin, setHoraFin] = useState<string>("23:59");
    const [duracion, setDuracion] = useState(60);
    const [mensaje, setMensaje] = useState("");
    const [guardando, setGuardando] = useState(false);
    const [cargando, setCargando] = useState(true);
    const diasLaborales = [...new Set(fechas.map((fecha) => WEEKDAY_BY_JS_DAY[fecha.getDay()]))];
    const error = (horaInicio >= horaFin) ? "La hora de inicio debe ser anterior a la hora de fin." :
                    (diasLaborales.length > 2) ? "Selecciona fechas que correspondan como máximo a dos días distintos de la semana." : "";
    const filas = fechas.map((dia) => ({ dia, horaInicio, horaFin, duracion }));

    useEffect(() => {
        let vigente = true;

        void obtenerDisponibilidad().then((resultado) => {
            if (!vigente) return;
            if (resultado.filas.length > 0) {
                setHoraInicio(resultado.filas[0].horaInicio);
                setHoraFin(resultado.filas[0].horaFin);
                setDuracion(resultado.filas[0].duracion);
            }
            setMensaje(resultado.message ?? "");
            setCargando(false);
        }).catch((error: unknown) => {
            console.error("Error al cargar la disponibilidad médica:", error);
            if (!vigente) return;
            setMensaje("No se pudo cargar la disponibilidad guardada.");
            setCargando(false);
        });

        return () => {
            vigente = false;
        };
    }, []);

    async function guardar() {
        setGuardando(true);
        setMensaje("");

        try {
            const resultado = await guardarDisponibilidad({
                dias: diasLaborales,
                horaInicio,
                horaFin,
            });
            setMensaje(resultado.message ?? "");

            if (resultado.status === "success") {
                const disponibilidad = await obtenerDisponibilidad();
                if (disponibilidad.filas.length > 0) {
                    setDuracion(disponibilidad.filas[0].duracion);
                }
                if (disponibilidad.message) {
                    setMensaje(disponibilidad.message);
                }
            }
        } catch (error: unknown) {
            console.error("Error al guardar la disponibilidad médica:", error);
            setMensaje("No se pudo guardar la disponibilidad por un error inesperado.");
        } finally {
            setGuardando(false);
        }
    }

    return (
        <>
        <div className="flex flex-row border-y justify-around border-gray-400 m-2 py-2">
            <div className="flex-col gap-1 m-2">
                <h2 className="text-xl text-black font-semibold m-1">
                    Calendario del mes
                </h2>
                <DayPicker
                    mode="multiple"
                    selected={fechas}
                    onSelect={(seleccionadas) => setFechas(seleccionadas ?? [])}
                    locale={es}
                    weekStartsOn={0}
                    className="border border-gray-400 bg-white rounded-lg text-black p-4"
                />
            </div>
            <FranjaHoraria
                horaInicio={horaInicio} onChangeInicio={setHoraInicio}
                horaFin={horaFin} onChangeFin={setHoraFin}
                deshabilitado={!!error || fechas.length === 0 || guardando || cargando}
                error={error}
                onGuardar={guardar} guardando={guardando}
            />
        </div>
        {mensaje && <p role="status" className="m-2 text-sm text-slate-700">{mensaje}</p>}
        <TablaResumen filas={filas} />
        </>
    );
}