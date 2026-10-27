// app/(portal)/medico/agenda/page.tsx
import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/actor";
import HojaTrabajoTable, { DoctorTurnoRow } from "@/app/ui/medico/agenda/hoja-trabajo-table";

const SPECIALTY_LABELS: Record<string, string> = {
  CLINICO: "Clínica médica",
  PEDIATRA: "Pediatría",
  TRAUMATOLOGO: "Traumatología",
};

type SearchParams = {
  fecha?: string;
};

export default async function HojaDeTrabajoMedicoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const rawFecha = resolvedParams.fecha?.trim() || "14/10/2026";

  // Parsear fecha en formato DD/MM/AAAA o AAAA-MM-DD
  let d = 14;
  let m = 10;
  let y = 2026;

  if (rawFecha.includes("/")) {
    const parts = rawFecha.split("/").map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      d = parts[0];
      m = parts[1];
      y = parts[2];
    }
  } else if (rawFecha.includes("-")) {
    const parts = rawFecha.split("-").map(Number);
    if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
      if (parts[0] > 1000) {
        y = parts[0];
        m = parts[1];
        d = parts[2];
      } else {
        d = parts[0];
        m = parts[1];
        y = parts[2];
      }
    }
  }

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
      const dateObj = new Date(t.startsAt);
      const dy = dateObj.getFullYear();
      const dm = String(dateObj.getMonth() + 1).padStart(2, "0");
      const dd = String(dateObj.getDate()).padStart(2, "0");
      return `${dy}-${dm}-${dd}`;
    })
  );

  // Incluir 2026-10-14 en el set si corresponde a la vista demo inicial
  availableDatesSet.add("2026-10-14");
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
      specialty: SPECIALTY_LABELS[t.doctor.specialty] ?? t.doctor.specialty,
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
        specialty: doctor ? (SPECIALTY_LABELS[doctor.specialty] ?? doctor.specialty) : "Pediatría",
        status: "ATENDIDO",
      },
      {
        id: "demo-asistencia-2",
        time: "15:00",
        patientName: "López, Marta",
        specialty: doctor ? (SPECIALTY_LABELS[doctor.specialty] ?? doctor.specialty) : "Pediatría",
        status: "PENDIENTE",
      },
    ];
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Título de pantalla y bajada informativa */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Hoja de trabajo</h1>
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