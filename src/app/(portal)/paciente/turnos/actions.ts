'use server';

import crypto from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getCurrentActor } from '@/lib/actor';
import { AppointmentState } from '@/generated/prisma/client';
import { eliminarTurnosVencidos } from '@/lib/turnos';

const SPECIALTY_LABELS: Record<string, string> = {
  CLINICO: 'Clínica médica',
  PEDIATRA: 'Pediatría',
  TRAUMATOLOGO: 'Traumatología',
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getSafeCookieStore() {
  try {
    const { cookies } = await import('next/headers');
    return await cookies();
  } catch {
    return null;
  }
}

export async function confirmarTurno(formData: FormData) {
  const actor = await getCurrentActor();
  if (!actor) throw new Error('No autorizado.');

  const appointmentId = formData.get('appointmentId') as string;
  if (!appointmentId) throw new Error('Identificador de turno inválido.');

  // Obtener perfil del paciente
  const paciente = await prisma.patient.findUnique({
    where: { id: actor.id },
  });

  if (!paciente) {
    throw new Error('Solo los pacientes pueden confirmar reservas.');
  }

  // Si el turno está en la cookie de recientes, actualizar su estado
  const cookieStore = await getSafeCookieStore();
  let updatedInCookie = false;
  if (cookieStore) {
    try {
      const recentCookie = cookieStore.get('sigmed_recent_turnos')?.value;
      if (recentCookie) {
        let list = JSON.parse(recentCookie);
        list = list.map((item: any) => {
          if (item.id === appointmentId) {
            updatedInCookie = true;
            return { ...item, status: AppointmentState.CONFIRMADO };
          }
          return item;
        });
        if (updatedInCookie) {
          cookieStore.set('sigmed_recent_turnos', JSON.stringify(list), {
            path: '/',
            maxAge: 86400 * 7,
          });
        }
      }
    } catch {}
  }

  // Solo invocar la base de datos si appointmentId es un UUID válido de PostgreSQL
  if (UUID_REGEX.test(appointmentId)) {
    const updated = await prisma.appointment.updateMany({
      where: {
        id: appointmentId,
        patientId: paciente.id,
        status: AppointmentState.RESERVADO,
      },
      data: {
        status: AppointmentState.CONFIRMADO,
      },
    });

    if (updated.count === 0 && !updatedInCookie) {
      throw new Error('El turno no se encuentra disponible o pertenece a otro usuario.');
    }
  }

  revalidatePath('/paciente/turnos');
  revalidatePath('/paciente/mis-turnos');
  return { success: true };
}

export async function cancelarTurnoPaciente(formData: FormData) {
  const actor = await getCurrentActor();
  if (!actor) throw new Error('No autorizado.');

  const appointmentId = formData.get('appointmentId') as string;
  if (!appointmentId) throw new Error('Identificador de turno inválido.');

  const paciente = await prisma.patient.findUnique({
    where: { id: actor.id },
  });

  if (!paciente) {
    throw new Error('Solo los pacientes pueden cancelar sus turnos.');
  }

  // Si el turno está en la cookie de recientes, eliminarlo
  const cookieStore = await getSafeCookieStore();
  let removedFromCookie = false;
  if (cookieStore) {
    try {
      const recentCookie = cookieStore.get('sigmed_recent_turnos')?.value;
      if (recentCookie) {
        let list = JSON.parse(recentCookie);
        const prevLength = list.length;
        list = list.filter((item: any) => item.id !== appointmentId);
        if (list.length < prevLength) {
          removedFromCookie = true;
          cookieStore.set('sigmed_recent_turnos', JSON.stringify(list), {
            path: '/',
            maxAge: 86400 * 7,
          });
        }
      }
    } catch {}
  }

  // Eliminar el turno físicamente de la base de datos (dar de baja)
  if (UUID_REGEX.test(appointmentId)) {
    const deleted = await prisma.appointment.deleteMany({
      where: {
        id: appointmentId,
        patientId: paciente.id,
      },
    });

    if (deleted.count === 0 && !removedFromCookie) {
      throw new Error('El turno no se encuentra disponible o pertenece a otro usuario.');
    }
  }

  revalidatePath('/paciente/turnos');
  revalidatePath('/paciente/mis-turnos');
  return { success: true };
}

export async function reservarTurno(formData: FormData) {
  const actor = await getCurrentActor();
  if (!actor) throw new Error('No autorizado.');

  const doctorId = formData.get('doctorId') as string | null;
  const startsAtStr = formData.get('startsAt') as string | null;

  if (!doctorId || !startsAtStr) {
    throw new Error('Información de turno incompleta.');
  }

  const paciente = await prisma.patient.findUnique({
    where: { id: actor.id },
  });
  if (!paciente) {
    throw new Error('Solo los pacientes pueden reservar turnos.');
  }

  // Eliminar turnos vencidos antes de operar
  await eliminarTurnosVencidos();

  const startsAt = new Date(startsAtStr);
  if (Number.isNaN(startsAt.getTime())) {
    throw new Error('Fecha u hora inválida.');
  }

  // RF: Turnos previos a la fecha actual no se pueden seleccionar
  if (startsAt.getTime() <= Date.now()) {
    throw new Error('No se pueden seleccionar turnos previos a la fecha y hora actual.');
  }

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: { profile: true },
  });
  if (!doctor) {
    throw new Error('El profesional seleccionado no existe.');
  }

  const duration = doctor?.consultDuration ?? 30;
  const endsAt = new Date(startsAt.getTime() + duration * 60_000);

  // RF: Una vez que se selecciona un turno, este no puede volver a seleccionarse
  const occupied = await prisma.appointment.findFirst({
    where: {
      doctorId,
      startsAt,
      status: {
        in: [
          AppointmentState.CONFIRMADO,
          AppointmentState.RESERVADO,
          AppointmentState.ATENDIDO,
          AppointmentState.AUSENTE,
        ],
      },
    },
  });
  if (occupied) {
    throw new Error('El turno seleccionado ya fue reservado por otro usuario.');
  }

  const created = await prisma.appointment.create({
    data: {
      patientId: paciente.id,
      doctorId,
      startsAt,
      endsAt,
      status: AppointmentState.RESERVADO,
      reservedById: actor.id,
    },
  });

  const datePart = startsAtStr.slice(0, 10);
  const [y, m, d] = datePart.split('-');
  const timePart = startsAtStr.slice(11, 16);
  const formattedDateTime = `${d}/${m}/${y} - ${timePart}`;
  const docName = `Dr. ${doctor.profile.lastName}, ${doctor.profile.firstName}`;
  const specName = SPECIALTY_LABELS[doctor.specialty] ?? doctor.specialty;
  const docLicense = doctor.licenseNumber || 'MP-54210';

  // Guardar en la sesión/cookie para que aparezca reflejado inmediatamente en "Mis turnos"
  const cookieStore = await getSafeCookieStore();
  if (cookieStore) {
    try {
      const existingCookie = cookieStore.get('sigmed_recent_turnos')?.value;
      let recentList: any[] = [];
      if (existingCookie) recentList = JSON.parse(existingCookie);
      const newEntry = {
        id: created.id,
        doctorName: docName,
        doctorLicense: docLicense,
        specialty: specName,
        dateTime: formattedDateTime,
        status: AppointmentState.RESERVADO,
      };
      recentList = [newEntry, ...recentList.filter((item) => item.id !== created.id)];
      cookieStore.set('sigmed_recent_turnos', JSON.stringify(recentList), {
        path: '/',
        maxAge: 86400 * 7,
      });
    } catch {}
  }

  revalidatePath('/paciente/turnos');
  revalidatePath('/paciente/mis-turnos');
  return { success: true, appointmentId: created.id };
}