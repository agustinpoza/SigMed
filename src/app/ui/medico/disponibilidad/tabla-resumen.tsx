// app/ui/medico/disponibilidad/tabla-resumen.tsx
import { format } from "date-fns";
import { es } from "date-fns/locale";

type FilaDisponibilidad = {
    dia: Date;
    horaInicio: string;
    horaFin: string;
    duracion: number;
};

interface TablaResumenProps {
    filas: FilaDisponibilidad[];
}

export default function TablaResumen({ filas }: TablaResumenProps) {
    const filasOrdenadas = [...filas].sort((a, b) => a.dia.getTime() - b.dia.getTime());

    return (
        <section className="flex flex-col gap-2 m-2">
            <h2 className="text-lg text-black font-semibold">
                Resumen de disponibilidad cargada
            </h2>
            <div className="rounded-xl overflow-hidden border-2 border-slate-400 m-1">
                <table className="w-full table-fixed">
                    <thead className="sticky top-0">
                        <tr className="text-center text-lg text-slate-500 bg-gray-200">
                            <th className="font-semibold border-r border-gray-400 p-1">Fecha</th>
                            <th className="font-semibold border-r border-gray-400 p-1">Franja horaria</th>
                            <th className="font-semibold p-1">Duración</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filasOrdenadas.length > 0 ? (
                            filasOrdenadas.map((fila) => (
                                <tr key={fila.dia.toISOString()} className="text-center text-black">
                                    <td className="border-r border-gray-400 p-1 capitalize">
                                        {format(fila.dia, "EEEE dd/MM/yyyy", { locale: es })}
                                    </td>
                                    <td className="border-r border-gray-400 p-1">
                                        {fila.horaInicio} - {fila.horaFin}
                                    </td>
                                    <td className="p-1">
                                        {fila.duracion} min
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td className="text-center text-lg text-black italic p-1" colSpan={3}>
                                    No hay información para mostrar
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}