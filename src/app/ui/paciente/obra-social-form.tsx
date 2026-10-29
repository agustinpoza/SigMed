// app/ui/paciente/obrasocial-forma.tsx
'use client'
import { useState } from "react";


export default function ObraSocialForm() {
    const [obraSocial, setObraSocial] = useState<string>("");
    const [plan, setPlan] = useState<string>("");
    const [numeroAfiliado, setNumeroAfiliado] = useState<string>("");

    function handleDescartar() {
        setObraSocial("");
        setPlan("");
        setNumeroAfiliado("");
    }

    return(
        <main>
            <p className="text-black font-semibold border-b border-gray-200 my-2 uppercase">Datos de afiliación</p>
            <div className="grid grid-rows-2 gap-4">
                <div className="grid grid-cols-2 gap-4">
                    {/* Obra social */}
                    <div className="flex flex-col">
                        <label className="text-gray-600">
                            Obra Social / Prepaga
                        </label>
                        <input
                            type="text"
                            value={obraSocial}
                            onChange={(e) => setObraSocial(e.target.value)}
                            className="border border-gray-400 rounded"
                        />
                    </div>
                    {/* Plan */}
                    <div className="flex flex-col">
                        <label className="text-gray-600">
                            Plan (Opcional)
                        </label>
                        <input
                            type="text"
                            value={plan}
                            onChange={(e) => setPlan(e.target.value)}
                            className="border border-gray-400 rounded"
                        />
                    </div>
                </div>
                {/* Afiliado / Credencial */}
                <div className="flex flex-col">
                    <label className="text-gray-600">
                        Número de afiliado / Credencial
                    </label>
                    <input
                        type="text"
                        value={numeroAfiliado}
                        onChange={(e) => setNumeroAfiliado(e.target.value)}
                        className="border border-gray-400 rounded"
                    />
                </div>
            </div>
            <p className="text-sm text-gray-500">
                Esta información será utilizada por la administración para validar tu cobertura antes del turno
            </p>
            <div className="flex justify-end border-t border-gray-200 space-x-2 my-2 py-2">
                <button className="font-semibold text-slate-600 border border-slate-400 rounded-sm p-2 px-3 m-2"
                        onClick={handleDescartar}
                >
                    Descartar Cambios
                </button>
                <button className="font-semibold text-white bg-slate-600 rounded-sm p-2 px-3 m-2">
                    Guardar Cobertura
                </button>
            </div>
        </main>
    );
}