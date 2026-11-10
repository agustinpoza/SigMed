// Período de los reportes administrativos (US-6.1 / RF-19).
// Funciones puras: sin Prisma, para poder probarlas y usarlas desde cualquier lado.

const TIME_ZONE = "America/Argentina/Buenos_Aires";
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

export type ReportPeriod = {
  /** Fecha desde, inclusive, en formato YYYY-MM-DD (hora de Argentina). */
  desde: string;
  /** Fecha hasta, inclusive, en formato YYYY-MM-DD (hora de Argentina). */
  hasta: string;
};

export type ReportPeriodResult =
  | { ok: true; period: ReportPeriod }
  | { ok: false; period: ReportPeriod; error: string };

/** Devuelve la fecha solo si es un día calendario real con formato YYYY-MM-DD. */
export function parseIsoDate(value: string | null | undefined): string | null {
  const match = ISO_DATE.exec(value?.trim() ?? "");
  if (!match) return null;

  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return match[0];
}

/** Período por defecto: del primer día del mes en curso hasta hoy. */
export function defaultReportPeriod(now: Date = new Date()): ReportPeriod {
  const hasta = now.toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
  return { desde: `${hasta.slice(0, 8)}01`, hasta };
}

/**
 * Interpreta los parámetros `desde` y `hasta`. Sin parámetros usa el período
 * por defecto; con fechas inválidas o invertidas informa el error y no consulta.
 */
export function resolveReportPeriod(
  desde: string | null | undefined,
  hasta: string | null | undefined,
  now: Date = new Date(),
): ReportPeriodResult {
  const fallback = defaultReportPeriod(now);

  if (!desde && !hasta) return { ok: true, period: fallback };

  const parsedDesde = parseIsoDate(desde);
  const parsedHasta = parseIsoDate(hasta);

  if (!parsedDesde || !parsedHasta) {
    return {
      ok: false,
      period: {
        desde: parsedDesde ?? fallback.desde,
        hasta: parsedHasta ?? fallback.hasta,
      },
      error: "Indicá una fecha desde y una fecha hasta válidas.",
    };
  }

  const period = { desde: parsedDesde, hasta: parsedHasta };

  if (parsedDesde > parsedHasta) {
    return {
      ok: false,
      period,
      error: "La fecha desde no puede ser posterior a la fecha hasta.",
    };
  }

  return { ok: true, period };
}

/** Límites del período como instantes: [start, end) en hora de Argentina. */
export function reportPeriodBounds(period: ReportPeriod): { start: Date; end: Date } {
  const start = new Date(`${period.desde}T00:00:00-03:00`);
  const end = new Date(new Date(`${period.hasta}T00:00:00-03:00`).getTime() + DAY_MS);
  return { start, end };
}

/** YYYY-MM-DD → DD/MM/YYYY. */
export function formatReportDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}
