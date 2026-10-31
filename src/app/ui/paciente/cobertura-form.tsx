'use client';
import { useActionState, useEffect, useState } from "react";
import { savePatientCoverage, type CoverageFormState } from "@/app/(portal)/paciente/cobertura-medica/actions";

interface CoberturaProps{
    idCobertura: string | null;
    nAfiliado: string | null;
    planCobertura: string | null;
    prestadores: { id: string; name: string }[];
}

export default function CoberturaForm({ idCobertura, nAfiliado, planCobertura, prestadores} : CoberturaProps) {
    const [cobertura, setCobertura] = useState<string>(idCobertura || "");
    const [plan, setPlan] = useState<string>(planCobertura || "");
    const [numeroAfiliado, setNumeroAfiliado] = useState<string>(nAfiliado || "");
    const [state, formAction, pending] = useActionState<CoverageFormState, FormData>( savePatientCoverage, {}, );
    function handleDescartar() {
        setCobertura(idCobertura || "");
        setPlan(planCobertura ||"");
        setNumeroAfiliado(nAfiliado || "");
    }

    return(
        <section>
            <p className="text-black font-semibold border-b border-gray-200 my-2 uppercase">
                Datos de afiliación
            </p>
            <form action={formAction} className="grid grid-rows-2 gap-4">
                <div className="grid grid-cols-2 gap-4">
                    {/* Obra social / Prepaga */}
                    <div className="flex flex-col">
                        <label htmlFor="insuranceId" className="text-gray-600">
                            Obra Social / Prepaga
                        </label>
                        <select
                            id="insuranceId"
                            name="insuranceId"
                            value={cobertura}
                            onChange={(e) => setCobertura(e.target.value)}
                            required
                            aria-invalid={Boolean(state.errors?.insuranceId)}
                            aria-describedby={state.errors?.insuranceId ? "insuranceId-error" : undefined}
                        >
                            <option value={""}>Selecciona una cobertura</option>
                            {prestadores.map((prestador) => (
                                <option key={prestador.id} value={prestador.id}>
                                    {prestador.name}
                                </option>
                            ))}
                        </select>
                        {state.errors?.insuranceId ? (
                            <p id="insuranceId-error" role="alert" className="text-sm text-red-600">
                                {state.errors.insuranceId}
                            </p>
                        ) : null}
                    </div>
                    {/* Plan */}
                    <div className="flex flex-col">
                        <label htmlFor="plan" className="text-gray-600">
                            Plan (Opcional)
                        </label>
                        <input
                            id="plan"
                            name="plan"
                            type="text"
                            value={plan}
                            onChange={(e) => setPlan(e.target.value)}
                            className="border border-gray-400 rounded"
                        />
                    </div>
                </div>
                {/* Numero de afiliado / Credencial */}
                <div className="flex flex-col">
                    <label htmlFor="memberNumber" className="text-gray-600">
                        Número de afiliado / Credencial
                    </label>
                    <input
                        id="memberNumber"
                        name="memberNumber"
                        type="text"
                        value={numeroAfiliado}
                        onChange={(e) => setNumeroAfiliado(e.target.value)}
                        className="border border-gray-400 rounded"
                        required
                        aria-invalid={Boolean(state.errors?.memberNumber)}
                        aria-describedby={state.errors?.memberNumber ? "memberNumber-error" : undefined}
                    />
                    {state.errors?.memberNumber ? (
                        <p id="memberNumber-error" role="alert" className="text-sm text-red-600">
                            {state.errors.memberNumber}
                        </p>
                    ) : null}
                </div>
                <p className="text-sm text-gray-500">
                    Esta información será utilizada por la administración para validar tu cobertura antes del turno
                </p>
                {state.message && !state.success ? (
                    <p
                        role="alert"
                        className="text-sm text-red-600"
                    >
                        {state.message}
                    </p>
                ) : null}
                <div className="flex justify-end border-t border-gray-200 space-x-2 my-2 py-2">
                    <button onClick={handleDescartar} type="button"
                        className="font-semibold text-slate-600 border border-slate-400 rounded-sm p-2 px-3 m-2"
                    >
                        Descartar Cambios
                    </button>
                    <button type="submit" disabled={pending} className="font-semibold text-white bg-slate-600 rounded-sm p-2 px-3 m-2 disabled:cursor-not-allowed disabled:opacity-50">
                        {pending ? "Guardando..." : "Guardar Cobertura"}
                    </button>
                </div>
            </form>
        </section>
    );
}