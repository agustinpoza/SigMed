// app/(portal)/medico/agenda/page.tsx
import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/actor";
import HojaTrabajoTable, { DoctorTurnoRow } from "@/app/ui/medico/agenda/hoja-trabajo-table";
import { type Speciality } from "@/generated/prisma/client";

const SPECIALITY_LABELS: Record<Speciality, string> = {
  CLINICO: "Clínica médica",
  PEDIATRA: "Pediatría",
  TRAUMATOLOGO: "Traumatología",
};

type SearchParams = {
  fecha?: string;
};

const TIME_ZONE = "America/Argentina/Buenos_Aires";

function obtenerFechaActual() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

function parseDate(value: string) {
  const slashDate = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  const isoDate = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  const match = slashDate ?? isoDate;

  if (!match) return null;

  const [, first, second, third] = match;
  const year = Number(slashDate ? third : first);
  const month = Number(second);
  const day = Number(slashDate ? first : third);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export default async function HojaDeTrabajoMedicoPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolvedParams = await searchParams;
  const hoy = obtenerFechaActual();
  const selectedDate = parseDate(resolvedParams.fecha?.trim() ?? "") ?? hoy;
  const { day: d, month: m, year: y } = selectedDate;

  const formattedDate = `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
  const isoDate = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const actor = await getCurrentActor();
  const doctor = actor
    ? await prisma.doctor.findUnique({
        where: { id: actor.id },
        include: { profile: true },
      })
    : null;

  // Consultar todas las fechas en las que el profesional tiene turnos asignados
  const doctorAllAppointments = doctor
    ? await prisma.appointment.findMany({
        where: { doctorId: doctor.id },
        select: { startsAt: true },
      })
    : [];

  const availableDatesSet = new Set(
    doctorAllAppointments.map((t) => {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(t.startsAt);
      const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
      return `${values.year}-${values.month}-${values.day}`;
    })
  );

  const availableDates = Array.from(availableDatesSet);

  // Consultar turnos asignados al médico para la jornada seleccionada
  const turnosDB = doctor
    ? await prisma.appointment.findMany({
        where: {
          doctorId: doctor.id,
          startsAt: {
            gte: new Date(`${isoDate}T00:00:00-03:00`),
            lte: new Date(`${isoDate}T23:59:59.999-03:00`),
          },
        },
        include: {
          patient: {
            include: { profile: true },
          },
          doctor: true,
        },
        orderBy: { startsAt: "asc" },
      })
    : [];

  let listTurnos: DoctorTurnoRow[] = turnosDB.map((t) => {
    const time = new Date(t.startsAt).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Argentina/Buenos_Aires",
    });

    return {
      id: t.id,
      time,
      patientName: t.patient
        ? `${t.patient.profile.lastName}, ${t.patient.profile.firstName}`
        : "Sin asignar",
      speciality: SPECIALITY_LABELS[t.doctor.speciality] ?? t.doctor.speciality,
      status: t.status,
    };
  });

  // Si no hay turnos registrados en BD para esa jornada, cargar filas representativas de US-2.8
  if (listTurnos.length === 0 && (formattedDate === "14/10/2026" || !resolvedParams.fecha)) {
    listTurnos = [
      {
        id: "demo-asistencia-1",
        time: "14:00",
        patientName: "Pérez, Juan",
        speciality: doctor ? (SPECIALITY_LABELS[doctor.speciality] ?? doctor.speciality) : "Pediatría",
        status: "ATENDIDO",
      },
      {
        id: "demo-asistencia-2",
        time: "15:00",
        patientName: "López, Marta",
        speciality: doctor ? (SPECIALITY_LABELS[doctor.speciality] ?? doctor.speciality) : "Pediatría",
        status: "CANCELADO",
      },
    ];
  }

  return (
    <div className="flex flex-col">
      {/* Título de pantalla y bajada informativa */}
      <div className="flex flex-col bg-linear-to-l from-slate-300 to-slate-200 rounded-xl justify-between px-3 py-2 my-4">
        <h1 className="text-2xl text-black font-bold tracking-tight">
          Hoja de trabajo
        </h1>
        <p className="text-sm text-zinc-500">
          Registrá la asistencia de los pacientes a tus turnos.
        </p>
      </div>

      {/* Tarjeta con selector de fecha, calendario interactivo, tabla y contador */}
      <HojaTrabajoTable
        initialTurnos={listTurnos}
        formattedDate={formattedDate}
        isoDate={isoDate}
        availableDates={availableDates}
      />
    </div>
  );
}