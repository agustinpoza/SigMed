import { eliminarTurnosVencidos } from "@/lib/turnos";
import { prisma } from "@/lib/db";
import { Speciality, AppointmentState } from "@/generated/prisma/client";
import InteractiveBooking from "./interactive-booking";

export default async function BusquedaTurnosPage({
  searchParams,
}: {
  searchParams: Promise<{ speciality?: string; doctorId?: string; date?: string; fecha?: string }>;
}) {
  const params = await searchParams;
  const hoyStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
  let dateParam = params.date || params.fecha || hoyStr;
  if (dateParam < hoyStr) {
    dateParam = hoyStr;
  }

  // Eliminar turnos pasados de fecha y/o hora (turnos vencidos sin atención)
  await eliminarTurnosVencidos();

  // Cargar lista de médicos con horarios para el selector y el calendario interactivo
  const medicos = await prisma.doctor.findMany({
    include: {
      profile: true,
      schedules: true,
    },
    orderBy: { profile: { lastName: "asc" } },
  });

  // Consultar todos los turnos ocupados (reservados, confirmados, atendidos o ausentes)
  // desde hoy en adelante para asegurar que ningún turno ocupado vuelva a ofrecerse
  const turnosOcupados = await prisma.appointment.findMany({
    where: {
      startsAt: {
        gte: new Date(`${hoyStr}T00:00:00-03:00`),
      },
      status: {
        in: [
          AppointmentState.RESERVADO,
          AppointmentState.CONFIRMADO,
          AppointmentState.ATENDIDO,
          AppointmentState.AUSENTE,
        ],
      },
      ...(params.doctorId ? { doctorId: params.doctorId } : {}),
      ...(params.speciality
        ? { doctor: { speciality: params.speciality as Speciality } }
        : {}),
    },
    include: {
      doctor: {
        include: {
          profile: true,
        },
      },
    },
    orderBy: {
      startsAt: "asc",
    },
  });

  const serializedDoctors = medicos.map((m) => ({
    id: m.id,
    speciality: m.speciality as Speciality,
    name: `Dr. ${m.profile.lastName}, ${m.profile.firstName}`,
    schedules: m.schedules.map((s) => ({
      weekday: s.weekday,
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
    })),
  }));

  const serializedTurnos = turnosOcupados.map((t) => ({
    id: t.id,
    doctorId: t.doctorId,
    startsAt: t.startsAt.toISOString(),
    endsAt: t.endsAt.toISOString(),
    status: t.status,
    doctor: {
      speciality: t.doctor.speciality as Speciality,
      profile: {
        firstName: t.doctor.profile.firstName,
        lastName: t.doctor.profile.lastName,
      },
    },
  }));

  return (
    <section>
      <InteractiveBooking
        medicos={serializedDoctors}
        initialSpeciality={params.speciality}
        initialDoctorId={params.doctorId}
        initialDate={dateParam}
        turnosDB={serializedTurnos}
      />
    </section>
  );
}

