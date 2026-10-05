// app/(portal)/medico/agenda/page.tsx
'use client';
import TablaTrabajo from "@/app/ui/medico/tabla-trabajo";
import { useState } from "react";
import { AiOutlineSearch } from 'react-icons/ai';

const FILTROS = ["opcionA", "opcionB", "opcionC"];

export default function AgendaPage() {
  const [filtro, setFiltro] = useState<string>(FILTROS[0]);
  const [busqueda, setBusqueda] = useState("");

  return (
  <section className="flex flex-col gap-2 p-4 bg-white border border-gray-500 rounded-md shadow-md">
    <span className="text-lg font-bold text-black border-b border-gray-500 m-2 p-2">
      Tabla de Trabajo Diario
    </span>
    <div className="flex flex-row justify-center text-black m-2">
      Selector de fecha
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
              onChange={() => setFiltro(opcion)}
              required
            />
            {opcion}
          </label>
        ))}
      </div>
      <div>
        <div className="flex flex-row items-center border-2 border-gray-300 rounded-xl bg-white px-2">
          <AiOutlineSearch className="text-gray-400 text-lg mr-4" />
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
    <TablaTrabajo filtro={filtro} busqueda={busqueda} />
  </section>
  );
}
