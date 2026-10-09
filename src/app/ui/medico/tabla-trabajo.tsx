// app/ui/medico/tabla-trabajo.tsx
import { UserRole } from "@/generated/prisma/enums";
import { getCurrentActor } from "@/lib/dev-actor";
import { obtenerTurnos } from "@/lib/turnos";
import { ETIQUETAS_ESTADO } from "@/lib/turnos-estados";

type SearchParams = {
    fecha: string;
    estado?: string;
    busqueda?: string;
};
interface TablaTrabajoProps {
    props: SearchParams
}

export default async function TablaTrabajo({ props }: TablaTrabajoProps) {
    const resolvedParams = props;
    const fecha = resolvedParams?.fecha;
    const estado = resolvedParams?.estado;
    const busqueda = resolvedParams?.busqueda || "";
    
    //Obtener usuario logueado
    const actor = await getCurrentActor();
    if (!actor || actor.role !== UserRole.MEDICO) {
        return null;
    }

    //Consultar turnos segun filtros y busqueda
    const turnos = await obtenerTurnos({
                    doctorId: actor?.id,
                    fecha,
                    estado: estado,
                    busqueda: busqueda.trim(),
    });

    return (
        <div className="overflow-hidden rounded-xl border border-gray-400 m-2">
            <table className="w-full p-2">
                <thead>
                    <tr className="text-center text-lg text-uppercase text-slate-500 bg-gray-200">
                        <th>Hora</th>
                        <th>Paciente</th>
                        <th>DNI</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {(turnos.length > 0) ? (
                        turnos.map((t) => {
                            return (
                                <tr key={t.id} className="text-slate-400 ">
                                    <td className="border-r-2 p-1">
                                        {/* XX:XX */}
                                        { t.startsAt ? t.startsAt.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Argentina/Buenos_Aires" }) : "Hora no disponible" }
                                    </td>
                                    <td className="border-r-2 p-1">
                                        {/* Apellido, Nombre */}
                                        { (t.patient) ? `${t.patient.profile.lastName}, ${t.patient.profile.firstName}` : "Paciente no disponible" }
                                    </td>
                                    <td className="border-r-2 p-1">
                                        {/* XX.XXX.XXX */}
                                        { (t.patient) ? t.patient.profile.dni : "DNI no disponible" }
                                    </td>
                                    <td className="border-r-2 p-1">
                                        {/* Estado */}
                                        {(t.status) ? ETIQUETAS_ESTADO[t.status] : "Estado no disponible"}
                                    </td>
                                    <td>
                                        <div className="text-white bg-slate-600 rounded-sm m-1 p-1">
                                            Acciones
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td className="text-center text-lg text-black italic" colSpan={5}>
                                No hay turnos para mostrar
                            </td>
                        </tr>
                    )
                }
                </tbody>
            </table>
        </div>
    );
}