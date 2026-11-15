// Reportes administrativos (US-6.1 / RF-19).
import { prisma } from "@/lib/db";
import {
  AppointmentState,
  MovementType,
  PaymentConcept,
  PaymentStatus,
  Speciality,
} from "@/generated/prisma/enums";
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

export type VaccineReportRow = {
  vaccineId: string;
  name: string;
  laboratory: string;
  consumed: number;
  currentStock: number;
  criticalLevel: number | null;
  stockStatus: "critico" | "normal" | "sin-umbral";
};

export type VaccineStockReport = {
  vaccines: { id: string; name: string }[];
  rows: VaccineReportRow[];
  totals: { consumed: number; currentStock: number };
};

/**
 * Consumo neto reservado y stock utilizable actual por vacuna. El consumo se
 * calcula con los movimientos de asignación y devolución del período; los
 * lotes vencidos se excluyen del stock, igual que en las alertas y asignaciones.
 */
export async function reporteStockVacunas(
  period: ReportPeriod,
  vaccineId?: string,
): Promise<VaccineStockReport> {
  const { start, end } = reportPeriodBounds(period);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const todayDate = new Date(`${today}T00:00:00.000Z`);

  const [vaccines, movements] = await Promise.all([
    prisma.vaccine.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        laboratory: true,
        criticalLevel: true,
        lots: {
          where: { expiresAt: { gte: todayDate } },
          select: { quantityAvailable: true },
        },
      },
    }),
    prisma.stockMovement.findMany({
      where: {
        type: { in: [MovementType.ASIGNACION_TURNO, MovementType.DEVOLUCION_TURNO] },
        createdAt: { gte: start, lt: end },
      },
      select: { quantity: true, lot: { select: { vaccineId: true } } },
    }),
  ]);

  const movementBalanceByVaccine = new Map<string, number>();
  for (const movement of movements) {
    movementBalanceByVaccine.set(
      movement.lot.vaccineId,
      (movementBalanceByVaccine.get(movement.lot.vaccineId) ?? 0) + movement.quantity,
    );
  }

  const options = vaccines.map(({ id, name }) => ({ id, name }));
  const rows = vaccines
    .filter((vaccine) => !vaccineId || vaccine.id === vaccineId)
    .map((vaccine): VaccineReportRow => {
      const currentStock = vaccine.lots.reduce((sum, lot) => sum + lot.quantityAvailable, 0);
      const criticalLevel = vaccine.criticalLevel;
      return {
        vaccineId: vaccine.id,
        name: vaccine.name,
        laboratory: vaccine.laboratory,
        consumed: Math.min(0, movementBalanceByVaccine.get(vaccine.id) ?? 0),
        currentStock,
        criticalLevel,
        stockStatus:
          criticalLevel === null
            ? "sin-umbral"
            : currentStock <= criticalLevel
              ? "critico"
              : "normal",
      };
    });

  const totals = rows.reduce(
    (sum, row) => ({
      consumed: sum.consumed + row.consumed,
      currentStock: sum.currentStock + row.currentStock,
    }),
    { consumed: 0, currentStock: 0 },
  );

  return { vaccines: options, rows, totals };
}

/** CSV compatible con Excel en español (separador punto y coma y BOM al exportar). */
export function reporteStockVacunasCsv(report: VaccineStockReport): string {
  const lines = [
    [
      "Vacuna",
      "Laboratorio",
      "Consumo del período (dosis)",
      "Stock actual disponible",
      "Nivel crítico",
      "Estado",
    ],
    ...report.rows.map((row) => [
      row.name,
      row.laboratory,
      row.consumed,
      row.currentStock,
      row.criticalLevel ?? "Sin configurar",
      row.stockStatus === "critico" ? "Crítico" : row.stockStatus === "normal" ? "Normal" : "Sin umbral",
    ]),
    ["Totales consolidados", "", report.totals.consumed, report.totals.currentStock, "", ""],
  ];

  return lines
    .map((line) =>
      line
        .map((value) => {
          const text = String(value);
          return /[;"\r\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
        })
        .join(";"),
    )
    .join("\r\n") + "\r\n";
}

export type FinancialReportRow = {
  speciality: Speciality;
  label: string;
  attended: number;
  absent: number;
  attendanceCount: number;
  absenceRate: number;
  income: number;
  pendingAbsenceDebt: number;
};

export type FinancialAttendanceReport = {
  rows: FinancialReportRow[];
  totals: {
    attended: number;
    absent: number;
    attendanceCount: number;
    absenceRate: number;
    income: number;
    pendingAbsenceDebt: number;
  };
};

/**
 * Ingresos efectivamente cobrados y ausentismo por especialidad.
 * Los pagos se asignan al período por paidAt; las asistencias y deudas por
 * inasistencia, por la fecha del turno. Para la tasa solo cuentan turnos que
 * ya fueron registrados como atendidos o ausentes; se excluyen cancelados y
 * turnos futuros.
 */
export async function reporteIngresosAusentismo(
  period: ReportPeriod,
): Promise<FinancialAttendanceReport> {
  const { start, end } = reportPeriodBounds(period);

  const [attendanceGroups, doctors, approvedPayments, pendingAbsencePayments] =
    await Promise.all([
      prisma.appointment.groupBy({
        by: ["doctorId", "status"],
        where: {
          startsAt: { gte: start, lt: end },
          status: { in: [AppointmentState.ATENDIDO, AppointmentState.AUSENTE] },
        },
        _count: { _all: true },
      }),
      prisma.doctor.findMany({ select: { id: true, speciality: true } }),
      prisma.payment.findMany({
        where: {
          status: PaymentStatus.APROBADO,
          paidAt: { gte: start, lt: end },
        },
        select: {
          amount: true,
          appointment: { select: { doctorId: true } },
        },
      }),
      prisma.payment.findMany({
        where: {
          concept: PaymentConcept.INASISTENCIA,
          status: PaymentStatus.PENDIENTE,
          appointment: { is: { startsAt: { gte: start, lt: end } } },
        },
        select: {
          amount: true,
          appointment: { select: { doctorId: true } },
        },
      }),
    ]);

  const specialityByDoctor = new Map(doctors.map((doctor) => [doctor.id, doctor.speciality]));
  const rows: FinancialReportRow[] = Object.values(Speciality).map((speciality) => ({
    speciality,
    label: AGENDA_SPECIALITY_LABELS[speciality] ?? speciality,
    attended: 0,
    absent: 0,
    attendanceCount: 0,
    absenceRate: 0,
    income: 0,
    pendingAbsenceDebt: 0,
  }));
  const rowBySpeciality = new Map(rows.map((row) => [row.speciality, row]));

  for (const group of attendanceGroups) {
    const speciality = specialityByDoctor.get(group.doctorId);
    const row = speciality ? rowBySpeciality.get(speciality) : undefined;
    if (!row) continue;

    if (group.status === AppointmentState.ATENDIDO) row.attended += group._count._all;
    else row.absent += group._count._all;
  }

  for (const payment of approvedPayments) {
    const speciality = specialityByDoctor.get(payment.appointment.doctorId);
    const row = speciality ? rowBySpeciality.get(speciality) : undefined;
    if (row) row.income += Number(payment.amount);
  }

  for (const payment of pendingAbsencePayments) {
    const speciality = specialityByDoctor.get(payment.appointment.doctorId);
    const row = speciality ? rowBySpeciality.get(speciality) : undefined;
    if (row) row.pendingAbsenceDebt += Number(payment.amount);
  }

  for (const row of rows) {
    row.attendanceCount = row.attended + row.absent;
    row.absenceRate = row.attendanceCount === 0 ? 0 : (row.absent / row.attendanceCount) * 100;
  }

  const totals = rows.reduce(
    (sum, row) => ({
      attended: sum.attended + row.attended,
      absent: sum.absent + row.absent,
      attendanceCount: sum.attendanceCount + row.attendanceCount,
      income: sum.income + row.income,
      pendingAbsenceDebt: sum.pendingAbsenceDebt + row.pendingAbsenceDebt,
      absenceRate: 0,
    }),
    {
      attended: 0,
      absent: 0,
      attendanceCount: 0,
      income: 0,
      pendingAbsenceDebt: 0,
      absenceRate: 0,
    },
  );
  totals.absenceRate = totals.attendanceCount === 0
    ? 0
    : (totals.absent / totals.attendanceCount) * 100;

  return { rows, totals };
}

/** CSV compatible con Excel en español (separador punto y coma). */
export function reporteIngresosAusentismoCsv(report: FinancialAttendanceReport): string {
  const percent = (value: number) => `${value.toFixed(1).replace(".", ",")}%`;
  const money = new Intl.NumberFormat("es-AR", {
    useGrouping: false,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const lines = [
    [
      "Especialidad",
      "Turnos totales",
      "Tasa de ausentismo",
      "Ingresos efectivos (ARS)",
      "Deuda pendiente por inasistencia (ARS)",
    ],
    ...report.rows.map((row) => [
      row.label,
      row.attendanceCount,
      percent(row.absenceRate),
      money.format(row.income),
      money.format(row.pendingAbsenceDebt),
    ]),
    [
      "Totales",
      report.totals.attendanceCount,
      percent(report.totals.absenceRate),
      money.format(report.totals.income),
      money.format(report.totals.pendingAbsenceDebt),
    ],
  ];

  return lines
    .map((line) =>
      line
        .map((value) => {
          const text = String(value);
          return /[;"\r\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
        })
        .join(";"),
    )
    .join("\r\n") + "\r\n";
}
