// app/ui/paciente/cobertura-message.tsx
import { CoverageStatus } from "@/generated/prisma/enums";
import { HiOutlineCheckCircle, HiOutlineInformationCircle, HiOutlineXCircle } from "react-icons/hi";

interface CoberturaProps {
    nombreCobertura: string | null,
    plan: string | null,
    estado: CoverageStatus | null,
}

export default function CoberturaMessage({ nombreCobertura, plan, estado } : CoberturaProps) {

    return(
        <section>
            {((nombreCobertura === "" || nombreCobertura === null) && estado === null) ? (
                <div className="flex flex-row justify-center items-center rounded-xl bg-red-100 p-2 border border-red-400">
                    <HiOutlineXCircle className="size-5 text-red-600 font-semibold m-1"/>
                    <p className="text-red-600">
                        <strong>No tenés cobertura médica registrada</strong>. 
                        Podés ingresar los datos de tu cobertura a continuación.
                    </p>
                </div>
            ) : (
                (estado === CoverageStatus.VALIDADA) ? (
                    <div className="flex flex-row justify-center items-center rounded-xl bg-green-100 p-2 border border-green-400">
                        <HiOutlineCheckCircle className="size-5 text-emerald-600 font-semibold m-1"/>
                        <p className="text-emerald-600">
                            <strong>Cobertura Activa:</strong> Tenés registrada la cobertura médica <strong>{nombreCobertura}{plan?.trim() ? ` (${plan.trim()})` : ""}</strong>. 
                            Podés modificar los datos a continuación si cambiaste de plan o prestador.
                        </p>
                    </div>
                ) : (
                    (estado === CoverageStatus.PENDIENTE) ? (
                        <div className="flex flex-row justify-center items-center rounded-xl bg-yellow-100 p-2 border border-yellow-400">
                            <HiOutlineInformationCircle className="size-5 text-amber-600 font-semibold m-1"/>
                            <p className="text-amber-600">
                                <strong>Cobertura Pendiente:</strong> Tenés registrada la cobertura médica <strong>{nombreCobertura}{plan?.trim() ? ` (${plan.trim()})` : ""}</strong>.
                                Podés actualizar los datos a continuación si cambiaste de plan o prestador.
                            </p>
                        </div>
                    ) : (
                        (estado === CoverageStatus.RECHAZADA) ? (
                            <div className="flex flex-row justify-center items-center rounded-xl bg-red-100 p-2 border border-red-400">
                                <HiOutlineXCircle className="size-5 text-red-600 font-semibold m-1"/>
                                <p className="text-red-600">
                                    <strong>Cobertura rechazada:</strong> La cobertura médica <strong>{nombreCobertura}{plan?.trim() ? ` (${plan.trim()})` : ""}</strong> fue rechazada.
                                    Podés revisar o actualizar los datos de tu cobertura a continuación.
                                </p>
                            </div>
                        ) : ("")
                    )
                )
            )}
        </section>
    );
}