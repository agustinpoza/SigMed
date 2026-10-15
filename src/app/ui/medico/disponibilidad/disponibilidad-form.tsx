// app/ui/medico/cronograma/disponiblidad-form.tsx
'use client';
import { useState } from "react";
import TablaResumen from "@/app/ui/medico/disponibilidad/tabla-resumen";
import FranjaHoraria from "@/app/ui/medico/disponibilidad/franja-horaria";

export default function DisponibilidadForm() {
    const [dias, setDias] = useState<Date[]>([]);
    const [horaInicio, setHoraInicio] = useState<string>("00:00");
    const [horaFin, setHoraFin] = useState<string>("23:59");
    const [duracion, setDuracion] = useState<number>(60);
    const error = (horaInicio >= horaFin) ? "La hora de inicio debe ser anterior a la hora de fin." : "";
    const resumen = dias.map((dia) => ({ dia, horaInicio, horaFin, duracion })) ?? [];

    return (
        <>
        <div className="flex flex-row border-y border-gray-400 my-2">
            <p>Calendario</p>
            <FranjaHoraria horaInicio={horaInicio} onChangeInicio={setHoraInicio} horaFin={horaFin} onChangeFin={setHoraFin} deshabilitado={!!error || dias.length === 0} error={error} onGuardar={() => console.log("Guardar horario")} />
        </div>
        <TablaResumen filas={resumen} />
        </>
    );
}