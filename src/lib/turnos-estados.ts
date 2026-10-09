// app/lib/turnos-estados.ts
// Constantes puras: sin imports de runtime de Prisma para poder usarse desde componentes de cliente.
import type { AppointmentState } from "@/generated/prisma/client";

export const ESTADOS: AppointmentState[] = ["CONFIRMADO", "RESERVADO", "CANCELADO", "ATENDIDO", "AUSENTE"];

export const ETIQUETAS_ESTADO: Record<AppointmentState, string> = {
    CONFIRMADO: "Confirmado",
    RESERVADO: "Reservado",
    CANCELADO: "Cancelado",
    ATENDIDO: "Atendido",
    AUSENTE: "Ausente"
};