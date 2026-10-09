// app/ui/medico/filtros.tsx
'use client';
import { ETIQUETAS_ESTADO } from "@/lib/turnos-estados";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineSearch } from "react-icons/hi";
import { AppointmentState } from "@/generated/prisma/client";

interface FiltrosProps {
    fecha: string;
}

const ESTADOS_FILTRO: AppointmentState[] = [ "CONFIRMADO", "AUSENTE", "ATENDIDO" ];

const FILTROS = [{ valor: "", texto: "Todos" },
                ...ESTADOS_FILTRO.map((e) => ({ valor: e, texto: ETIQUETAS_ESTADO[e]}))];

function moverDia(fecha: string, dias: number) {
    const d = new Date(`${fecha}T12:00:00`);
    d.setDate(d.getDate() + dias);
    return d.toLocaleDateString("en-CA");
}

export default function Filtros({ fecha }: FiltrosProps) {
    const router = useRouter();
    const pathName = usePathname();
    const params = useSearchParams();
    const [busqueda, setBusqueda] = useState(params.get("busqueda") ?? "");

    function actualizar(clave: string, valor:string) {
        const nuevos = new URLSearchParams(params.toString());
        if (valor)
            nuevos.set(clave, valor);
        else nuevos.delete(clave);
        router.replace(`${pathName}?${nuevos.toString()}`);
    }

    return(
        <div className="flex flex-col">
            {/* Selector de fecha */}
            <div className="flex flex-row justify-center border-y border-gray-300 p-4 gap-3">
                <button className="flex flex-row items-center border bg-gray-200 rounded-md text-sm text-slate-500 p-1 gap-2"
                        onClick={() => actualizar("fecha", moverDia(fecha, -1))}>
                    <HiOutlineChevronLeft /> Anterior
                </button>
                <input
                    id="fecha"
                    name="fecha"
                    type="date"
                    value={fecha}
                    onChange={(e) => actualizar("fecha", e.target.value)}
                    className="border border-gray-300 rounded-md text-black p-0.5"
                />
                <button className="flex flex-row items-center border bg-gray-200 rounded-md text-sm text-slate-500 p-1 gap-2"
                        onClick={() => actualizar("fecha", moverDia(fecha, 1))}>
                    Siguiente <HiOutlineChevronRight />
                </button>
            </div>
            {/* Opciones de filtros y busqueda */}
            <div className="flex justify-between rounded-sm bg-gray-200 my-4 p-2">
                <div className="flex flex-row text-black gap-2">
                    Estados:
                    {/* Ajustar según la cantidad de filtros y como se obtienen */}
                    {FILTROS.map((opcion) => (
                        <label key={opcion.valor}>
                            <input
                                type="radio"
                                name="estado"
                                value={opcion.valor}
                                checked={(params.get('estado') ?? '') === opcion.valor}
                                onChange={() => actualizar("estado", opcion.valor)}
                                className="mr-1"
                            />
                            {opcion.texto}
                        </label>
                    ))}
                </div>
                <div className="flex flex-row items-center gap-1">
                    <div className="flex flex-row items-center border-2 border-gray-300 rounded-xl bg-white px-1">
                        <input
                            className="text-gray-400 placeholder-gray-400 focus:outline-none"
                            type="search"
                            placeholder="Paciente..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="flex flex-row items-center text-slate-500 hover:text-gray-200 bg-gray-200 hover:bg-slate-500 border rounded-lg px-1 gap-1"
                        onClick={() => actualizar("busqueda", busqueda.trim())}>
                            <HiOutlineSearch /> Buscar
                    </button>
                </div>
            </div>
        </div>
    );
}