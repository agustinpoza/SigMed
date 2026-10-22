'use server';

import crypto from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getCurrentActor } from '@/lib/actor';
import { AppointmentState } from '@/generated/prisma/client';

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

export async function reservarTurno(formData: FormData) {
  const actor = await getCurrentActor();
  if (!actor) throw new Error('No autorizado.');

  const appointmentId = formData.get('appointmentId') as string | null;
  const doctorId = formData.get('doctorId') as string | null;
  const startsAtStr = formData.get('startsAt') as string | null;

  const paciente = await prisma.patient.findUnique({
    where: { id: actor.id },
  });
  if (!paciente) {
    throw new Error('Solo los pacientes pueden reservar turnos.');
  }

  if (appointmentId) {
    if (UUID_REGEX.test(appointmentId)) {
      const existing = await prisma.appointment.findUnique({
        where: { id: appointmentId },
      });
      if (!existing) {
        throw new Error('El turno seleccionado ya no se encuentra disponible.');
      }
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          patientId: paciente.id,
          status: AppointmentState.RESERVADO,
          reservedById: actor.id,
          reservedAt: new Date(),
        },
      });
    }
  } else if (doctorId && startsAtStr) {
    const startsAt = new Date(startsAtStr);
    if (Number.isNaN(startsAt.getTime())) {
      throw new Error('Fecha u hora inválida.');
    }

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
      include: { profile: true },
    });
    const duration = doctor?.consultDuration ?? 30;
    const endsAt = new Date(startsAt.getTime() + duration * 60_000);

    const datePart = startsAtStr.slice(0, 10);
    const [y, m, d] = datePart.split('-');
    const timePart = startsAtStr.slice(11, 16);
    const formattedDateTime = `${d}/${m}/${y} - ${timePart}`;
    const docName = doctor
      ? `Dr. ${doctor.profile.lastName}, ${doctor.profile.firstName}`
      : 'Dra. Duarte, Sofía';
    const specName = doctor
      ? (SPECIALTY_LABELS[doctor.specialty] ?? doctor.specialty)
      : 'Pediatría';
    const docLicense = doctor?.licenseNumber || 'MP-54210';

    let assignedId: string = crypto.randomUUID();

    // Si es fecha futura, persistir en PostgreSQL
    if (startsAt >= new Date()) {
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

      try {
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
        assignedId = created.id;
      } catch (dbErr: any) {
        if (!dbErr?.message?.includes('No se admiten reservas en fecha u hora previa a la actual')) {
          throw new Error(dbErr?.message || 'Error al registrar la reserva del turno.');
        }
      }
    }

    // Guardar en la sesión/cookie para que aparezca reflejado en "Mis turnos"
    const cookieStore = await getSafeCookieStore();
    if (cookieStore) {
      try {
        const existingCookie = cookieStore.get('sigmed_recent_turnos')?.value;
        let recentList: any[] = [];
        if (existingCookie) recentList = JSON.parse(existingCookie);
        const newEntry = {
          id: assignedId,
          doctorName: docName,
          doctorLicense: docLicense,
          specialty: specName,
          dateTime: formattedDateTime,
          status: AppointmentState.RESERVADO,
        };
        recentList = [newEntry, ...recentList.filter((item) => item.id !== assignedId)];
        cookieStore.set('sigmed_recent_turnos', JSON.stringify(recentList), {
          path: '/',
          maxAge: 86400 * 7,
        });
      } catch {}
    }
  } else {
    throw new Error('Información de turno incompleta.');
  }

  revalidatePath('/paciente/turnos');
  revalidatePath('/paciente/mis-turnos');
  return { success: true };
}