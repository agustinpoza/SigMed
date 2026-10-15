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
        <section className="flex flex-col gap-1">
            <h2 className="text-lg text-black font-semibold m-1">
                Resumen de disponibilidad cargada
            </h2>
            <div className="rounded-lg border">
                <table className="w-full p-2">
                    <thead className="sticky top-0">
                        <tr className="text-center text-lg text-slate-500 bg-gray-200">
                            <th>Fecha</th>
                            <th>Franja horaria</th>
                            <th>Duración</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filasOrdenadas.length > 0 ? (
                            filasOrdenadas.map((fila) => (
                                <tr key={fila.dia.toISOString()} className="text-slate-400">
                                    <td className="border-r-2 p-1 capitalize">
                                        {format(fila.dia, "EEEE dd/MM/yyyy", { locale: es })}
                                    </td>
                                    <td className="border-r-2 p-1">
                                        {fila.horaInicio} - {fila.horaFin}
                                    </td>
                                    <td className="border-r-2 p-1">
                                        {fila.duracion} min
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td className="text-center text-lg text-black italic" colSpan={5}>
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