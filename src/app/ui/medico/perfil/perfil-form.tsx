'use client';
import { actualizarValorConsulta } from "@/app/(portal)/medico/perfil/actions";
import { useState } from "react";

interface PerfilProps {
    medico: {
        nombre: string;
        dni: string;
        especialidad: string;
        matricula: string;
        valorConsulta: number;
    };
}

export default function PerfilForm({ medico }: PerfilProps) {
    const [valor, setValor] = useState(medico.valorConsulta);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState('');

    const handleGuardar = async () => {
        setGuardando(true);
        setMensaje('');
        try {
            await actualizarValorConsulta(valor);
            setMensaje('Valor actualizado correctamente.');
        }
        catch (error) {
            setMensaje('Error al actualizar el valor.');
        }
        finally {
            setGuardando(false);
        }
    }
    const handleCancelar = () => {
        setValor(medico.valorConsulta);
    }

    return (
        <section className="flex flex-col gap-1 m-2.5">
            <div className="flex flex-col m-2">
                <h2 className="text-xl font-bold">
                    Datos profesionales
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 border-b border-gray-200 m-1 pb-4">
                    <div className="flex flex-col gap-1">
                        <p className="text-sm text-gray-600">Médico</p>
                        <p className="text-gray-800">{medico.nombre}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                        <p className="text-sm text-gray-600">DNI</p>
                        <p className="text-gray-800">{medico.dni}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Especialidad</p>
                        <p className="text-gray-800 ">{medico.especialidad}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Matrícula</p>
                        <p className="text-gray-800">{medico.matricula}</p>
                    </div>
                </div>
            </div>
            <div className="flex flex-col m-1">
                <h2 className="text-xl font-bold">
                    Valor de la consulta particular
                </h2>
                <div className="flex flex-col rounded-md bg-slate-200 p-2 m-1 w-fit">
                    <p className="text-sm text-gray-600">Valor actual</p>
                    <p className="text-gray-800 font-semibold">$ {medico.valorConsulta}</p>
                </div>
                <div className="flex flex-col m-1">
                    <p className="text-gray-800 font-semibold">
                        Nuevo valor
                    </p>
                    <div className="flex items-center gap-1">
                        <span className="text-gray-400">$</span>
                        <input
                            type="number"
                            value={valor}
                            onChange={(e) => setValor(Number(e.target.value))}
                            className="border border-gray-400 rounded-md p-1"
                        />
                    </div>
                    <p className="text-sm text-gray-600">
                        Monto que abonan los pacientes particulares, es decir, quienes se atienden sin cobertura médica.
                    </p>
                </div>
                <div className="flex flex-row gap-2 my-2">
                    <button type="button" disabled={guardando} onClick={handleGuardar}
                            className="text-white bg-slate-800 rounded px-2 py-1">
                        {guardando ? 'Guardando...' : 'Guardar valor'}
                    </button>
                    <button type="button" className="text-slate-800 border border-gray-400 rounded px-2 py-1"
                            onClick={handleCancelar}>
                        Cancelar
                    </button>
                </div>
            </div>
        </section>
    );
}