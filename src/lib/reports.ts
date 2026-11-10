// Reportes administrativos (US-6.1 / RF-19).
import { prisma } from "@/lib/db";
import { AppointmentState, Speciality } from "@/generated/prisma/enums";
import { AGENDA_SPECIALITY_LABELS } from "@/lib/agenda";
import { reportPeriodBounds, type ReportPeriod } from "@/lib/report-period";

export type SpecialityReportRow = {
  speciality: Speciality;
  label: string;
  atendidos: number;
  cancelados: number;
  total: number;
};

export type SpecialityReport = {
  rows: SpecialityReportRow[];
  totals: { atendidos: number; cancelados: number; total: number };
};

/**
 * Turnos atendidos y cancelados por especialidad dentro del período.
 *
 * El período se evalúa sobre la fecha del turno (`fecha_hora_inicio`). Siempre
 * devuelve una fila por especialidad: las que no tienen registros quedan en
 * cero (CA2), nunca con datos inventados.
 */
export async function reporteTurnosPorEspecialidad(
  period: ReportPeriod,
): Promise<SpecialityReport> {
  const { start, end } = reportPeriodBounds(period);

  const [grupos, medicos] = await Promise.all([
    prisma.appointment.groupBy({
      by: ["doctorId", "status"],
      where: {
        startsAt: { gte: start, lt: end },
        status: { in: [AppointmentState.ATENDIDO, AppointmentState.CANCELADO] },
      },
      _count: { _all: true },
    }),
    prisma.doctor.findMany({ select: { id: true, speciality: true } }),
  ]);

  const especialidadPorMedico = new Map(medicos.map((m) => [m.id, m.speciality]));

  const rows: SpecialityReportRow[] = Object.values(Speciality).map((speciality) => ({
    speciality,
    label: AGENDA_SPECIALITY_LABELS[speciality] ?? speciality,
    atendidos: 0,
    cancelados: 0,
    total: 0,
  }));
  const rowBySpeciality = new Map(rows.map((row) => [row.speciality, row]));

  for (const grupo of grupos) {
    const speciality = especialidadPorMedico.get(grupo.doctorId);
    const row = speciality ? rowBySpeciality.get(speciality) : undefined;
    if (!row) continue;

    if (grupo.status === AppointmentState.ATENDIDO) row.atendidos += grupo._count._all;
    else row.cancelados += grupo._count._all;
    row.total = row.atendidos + row.cancelados;
  }

  const totals = rows.reduce(
    (acc, row) => ({
      atendidos: acc.atendidos + row.atendidos,
      cancelados: acc.cancelados + row.cancelados,
      total: acc.total + row.total,
    }),
    { atendidos: 0, cancelados: 0, total: 0 },
  );

  return { rows, totals };
}

/** CSV del reporte, con `;` como separador para que Excel en español lo abra en columnas. */
export function reporteTurnosPorEspecialidadCsv(report: SpecialityReport): string {
  const lines = [
    ["Especialidad", "Turnos atendidos", "Turnos cancelados", "Total de turnos"],
    ...report.rows.map((row) => [row.label, row.atendidos, row.cancelados, row.total]),
    ["Totales", report.totals.atendidos, report.totals.cancelados, report.totals.total],
  ];

  return lines.map((line) => line.join(";")).join("\r\n") + "\r\n";
}
