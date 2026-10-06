// app/(portal)/medico/agenda/page.tsx
'use client';
import TablaTrabajo from "@/app/ui/medico/tabla-trabajo";
import { useState } from "react";
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineSearch } from "react-icons/hi";

const FILTROS = ["Atendido", "Reservado", "Cancelado", "Ausente"];

export default function AgendaPage() {
  const [filtro, setFiltro] = useState<string>(FILTROS[0]);
  const [busqueda, setBusqueda] = useState("");
  const [fecha, setFecha] = useState<string>("");

  return (
  <section className="flex flex-col gap-2 p-2 bg-white border border-gray-500 rounded-md shadow-md">
    <span className="text-lg font-bold text-black m-2 p-2">
      Tabla de Trabajo Diario
    </span>
    <div className="flex flex-row justify-center border-y border-gray-300 p-4 gap-3">
      <button className="flex flex-row items-center border bg-gray-200 rounded-md text-sm text-slate-500 p-1 gap-2">
        <HiOutlineChevronLeft /> Anterior
      </button>
      <input
      id="fecha"
      name="fecha"
      type="date"
      value={fecha}
      onChange={(e) => setFecha(e.target.value)}
      className="border border-gray-300 rounded-md text-black p-0.5"
      />
      <button className="flex flex-row items-center border bg-gray-200 rounded-md text-sm text-slate-500 p-1 gap-2">
        Siguiente <HiOutlineChevronRight />
      </button>
    </div>
    <div className="flex justify-around rounded-sm bg-gray-200 m-2 p-2">
      <div className="flex flex-row text-black gap-2">
          Filtros:
        {/* Ajustar según la cantidad de filtros y como se obtienen */}
        {FILTROS.map((opcion) => (
          <label key={opcion}>
            <input
              type="radio"
              name="filtro"
              value={opcion}
              checked={filtro === opcion}
              onChange={() => setFiltro(opcion.toUpperCase)}
              required
            />
            {opcion}
          </label>
        ))}
      </div>
      <div>
        <div className="flex flex-row items-center border-2 border-gray-300 rounded-xl bg-white px-2">
          <HiOutlineSearch className="text-gray-400 text-lg mr-4" />
          <input
            className="text-base text-gray-400 placeholder-gray-400 focus:outline-none rounded-xl"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar..."
          />
        </div>
      </div>
    </div>
    <TablaTrabajo params={{fecha, filtro, busqueda}} />
  </section>
  );
}
