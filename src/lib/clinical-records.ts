import { prisma } from "@/lib/db";
import { AppointmentState } from "@/generated/prisma/enums";
import type { ClinicalHistoryEntry } from "@/app/(portal)/paciente/historial/clinical-history-table";

const specialtyNames: Record<string, string> = {
  CLINICO: "Clínica médica",
  PEDIATRA: "Pediatría",
  TRAUMATOLOGO: "Traumatología",
};

/**
 * Turno del médico sobre el que se asienta la evolución. Filtra por médico para
 * que nadie pueda cargar evoluciones en turnos de otro profesional.
 */
export function obtenerTurnoParaEvolucion(turnoId: string, doctorId: string) {
  return prisma.appointment.findFirst({
    where: { id: turnoId, doctorId },
    select: {
      id: true,
      patientId: true,
      startsAt: true,
      status: true,
      clinicalRecord: { select: { id: true } },
      patient: { select: { profile: { select: { firstName: true, lastName: true } } } },
      doctor: { select: { profile: { select: { firstName: true, lastName: true } } } },
    },
  });
}

/** Un médico solo accede al historial de pacientes que atendió. */
export async function medicoAtendioAPaciente(doctorId: string, patientId: string) {
  const turno = await prisma.appointment.findFirst({
    where: { doctorId, patientId, status: AppointmentState.ATENDIDO },
    select: { id: true },
  });

  return turno !== null;
}

export async function obtenerHistorialPaciente(
  patientId: string,
): Promise<ClinicalHistoryEntry[]> {
  const records = await prisma.clinicalRecord.findMany({
    where: { appointment: { patientId } },
    orderBy: { appointment: { startsAt: "desc" } },
    select: {
      id: true,
      diagnosis: true,
      treatment: true,
      indications: true,
      appointment: {
        select: {
          startsAt: true,
          attendanceAt: true,
          doctor: {
            select: {
              specialty: true,
              profile: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
    },
  });

  return records.map((record) => ({
    id: record.id,
    date: (record.appointment.attendanceAt ?? record.appointment.startsAt).toISOString(),
    doctor: `${record.appointment.doctor.profile.lastName}, ${record.appointment.doctor.profile.firstName}`,
    specialty: specialtyNames[record.appointment.doctor.specialty],
    diagnosis: record.diagnosis,
    treatment: record.treatment,
    indications: record.indications,
  }));
}
