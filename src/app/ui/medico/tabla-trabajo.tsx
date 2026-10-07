// app/ui/medico/tabla-trabajo.tsx
'use client';
import { useState } from "react";

type SearchParams = {
    fecha?: string;
    filtro?: string;
    busqueda?: string;
};
interface TablaTrabajoProps {
    params?: SearchParams
}

export default function TablaTrabajo({ params }: TablaTrabajoProps) {
    const resolvedParams = params;
    const fecha = resolvedParams?.fecha;
    const filtro = resolvedParams?.filtro;
    const busqueda = resolvedParams?.busqueda || "";
    const [turnos, setTurnos] = useState<[]>([]);

    //Consultar turnos segun filtros y busqueda

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
                                <tr key={0/*t.id*/} className="">
                                    <td>
                                        XX:XX{/*t.startsAt*/}
                                    </td>
                                    <td>
                                        Apellido, Nombre{/*t.patient.profile.lastName, t.patient.profile.firstName*/}
                                    </td>
                                    <td>
                                        XX.XXX.XXX{/*t.patient.profile.dni*/}
                                    </td>
                                    <td className="text-black bg-gray-300 rounded-lg">
                                        Estado{/*t.status*/}
                                    </td>
                                    <td className="text-white bg-slate-600 rounded-sm">
                                        Accion
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td className="text-center text-lg text-black italic">
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