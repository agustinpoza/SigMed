import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getCurrentActor } from "@/lib/actor";
import { AppointmentState } from "@/generated/prisma/client";
import { eliminarTurnosVencidos } from "@/lib/turnos";
import {
  AGENDA_SPECIALTY_LABELS,
  obtenerHorariosAlternativosProfesional,
  type HorarioAlternativo,
} from "@/lib/agenda";
import MisTurnosClient, { type MyAppointment } from "./mis-turnos-client";

const SPECIALTY_LABELS: Record<string, string> = AGENDA_SPECIALTY_LABELS;

function isPastTurno(dateTimeStr: string): boolean {
  try {
    const [datePart, timePart] = dateTimeStr.split(" - ");
    const [d, m, y] = datePart.split("/").map(Number);
    const cleanTime = timePart.replace(/[^\d:]/g, "");
    const [hh, mm] = cleanTime.split(":").map(Number);
    const dateObj = new Date(y, m - 1, d, hh || 0, mm || 0);
    return dateObj.getTime() < Date.now();
  } catch {
    return false;
  }
}

export default async function MisTurnosPage() {
  const actor = await getCurrentActor();

  // Eliminar turnos vencidos de la base de datos
  await eliminarTurnosVencidos();

  // Leer turnos reservados recientemente en la sesión
  const cookieStore = await cookies();
  const recentCookie = cookieStore.get("sigmed_recent_turnos")?.value;
  let recentTurnos: MyAppointment[] = [];
  try {
    if (recentCookie) {
      const parsed: MyAppointment[] = JSON.parse(recentCookie);
      recentTurnos = parsed.filter(
        (t) => t.status !== AppointmentState.CANCELADO && !isPastTurno(t.dateTime),
      );
    }
  } catch {}

  // Consultar turnos reales del paciente en BD
  const turnosDB = actor
    ? await prisma.appointment.findMany({
        where: {
          patientId: actor.id,
        },
        include: {
          doctor: {
            include: { profile: true },
          },
        },
        orderBy: { startsAt: "asc" },
      })
    : [];

  const listTurnos: MyAppointment[] = turnosDB.map((t) => {
    const d = new Date(t.startsAt);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const time = d.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Argentina/Buenos_Aires",
    });

    return {
      id: t.id,
      doctorId: t.doctorId,
      doctorName: `${t.doctor.profile.firstName} ${t.doctor.profile.lastName}`,
      doctorLicense: t.doctor.licenseNumber,
      speciality: SPECIALTY_LABELS[t.doctor.speciality] ?? t.doctor.speciality,
      dateTime: `${day}/${month}/${year} - ${time}`,
      startsAtISO: t.startsAt.toISOString(),
      status: t.status,
      cancellationReason: t.cancellationReason ?? undefined,
    };
  });

  const finalTurnos: MyAppointment[] = [
    ...recentTurnos.filter((rt) => !listTurnos.some((cl) => cl.id === rt.id)),
    ...listTurnos.map((cl) => {
      const match = recentTurnos.find((rt) => rt.id === cl.id);
      return match ? { ...cl, status: match.status } : cl;
    }),
  ];

  // Pre-cargar horarios alternativos disponibles para cada profesional de los turnos activos
  const distinctDoctorIds = Array.from(
    new Set(
      finalTurnos
        .map((t) => t.doctorId)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  );

  const horariosEntries = await Promise.all(
    distinctDoctorIds.map(async (docId) => {
      const slots = await obtenerHorariosAlternativosProfesional(docId);
      return [docId, slots] as const;
    }),
  );

  const initialHorariosPorMedico: Record<string, HorarioAlternativo[]> =
    Object.fromEntries(horariosEntries);

  return (
    <div className="flex flex-col gap-6">
      {/* Título y Bajada */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Mis turnos</h1>
        <p className="text-sm text-slate-600">
          Consultá el estado de tus turnos, confirmá tu asistencia cuando corresponda, cancelá o reprogramá tu consulta.
        </p>
      </div>

      {/* Componente cliente con tabla y modales interactivos */}
      <MisTurnosClient
        initialTurnos={finalTurnos}
        initialHorariosPorMedico={initialHorariosPorMedico}
      />
    </div>
  );
}
