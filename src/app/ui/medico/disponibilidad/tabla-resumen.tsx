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
        <section className="rounded-xl bg-white p-4 shadow-md">
            <h2 className="pb-6 text-base font-bold text-zinc-900">
                Resumen de disponibilidad cargada
            </h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-zinc-700">
                    <thead className="font-semibold text-xs text-zinc-400 uppercase border-b border-zinc-200 tracking-wider">
                        <tr>
                            <th className="pb-2 font-semibold">Fecha</th>
                            <th className="pb-2 font-semibold">Franja horaria</th>
                            <th className="pb-2 font-semibold">Duración por turno</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                        {filasOrdenadas.length > 0 ? (
                            filasOrdenadas.map((fila) => (
                                <tr key={fila.dia.toISOString()} className="transition hover:bg-zinc-50/50">
                                    <td className="py-4 text-sm font-normal text-zinc-900 capitalize">
                                        {format(fila.dia, "EEEE dd/MM/yyyy", { locale: es })}
                                    </td>
                                    <td className="py-4 text-sm font-normal text-zinc-900">
                                        {fila.horaInicio} - {fila.horaFin}
                                    </td>
                                    <td className="py-4 text-sm font-normal text-zinc-900">
                                        {fila.duracion} min
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td className="py-8 text-center text-sm italic text-zinc-500" colSpan={3}>
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