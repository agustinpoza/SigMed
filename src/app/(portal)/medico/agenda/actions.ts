'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getCurrentActor } from '@/lib/actor';
import { AppointmentState } from '@/generated/prisma/enums';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getSafeCookieStore() {
  try {
    const { cookies } = await import('next/headers');
    return await cookies();
  } catch {
    return null;
  }
}

export async function registrarAsistencia(formData: FormData) {
  const actor = await getCurrentActor();
  if (!actor) throw new Error('No autorizado.');

  const appointmentId = formData.get('appointmentId') as string;
  const nuevoEstado = formData.get('estado') as string; // "ATENDIDO" o "AUSENTE"

  if (!nuevoEstado || !['ATENDIDO', 'AUSENTE'].includes(nuevoEstado)) {
    throw new Error('Estado de asistencia inválido.');
  }

  // Verificar que el usuario activo sea médico
  const medico = await prisma.doctor.findUnique({
    where: { id: actor.id },
  });

  if (!medico) {
    throw new Error('Operación denegada. Solo el médico asignado puede registrar asistencia.');
  }

  // Actualizar en la cookie de turnos si existe allí
  const cookieStore = await getSafeCookieStore();
  if (cookieStore) {
    try {
      const recentCookie = cookieStore.get('sigmed_recent_turnos')?.value;
      if (recentCookie) {
        let list = JSON.parse(recentCookie);
        let updatedInCookie = false;
        list = list.map((item: any) => {
          if (item.id === appointmentId) {
            updatedInCookie = true;
            return { ...item, status: nuevoEstado };
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

  // Si no es un UUID válido (filas demo o identificadores simulados), retornar éxito sin invocar BD
  if (!UUID_REGEX.test(appointmentId)) {
    revalidatePath('/medico/agenda');
    revalidatePath('/medico/hoja-de-trabajo');
    return { success: true };
  }

  // CA2: Verificar que el turno pertenezca al médico asignado
  const turno = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });

  if (turno && turno.doctorId !== medico.id) {
    throw new Error('No puedes actualizar el turno de otro profesional.');
  }

  const attendanceDate = turno && turno.startsAt > new Date() ? turno.startsAt : new Date();

  // CA1: Actualizar estado y registrar asistencia persistente en DB
  await prisma.appointment.updateMany({
    where: {
      id: appointmentId,
      doctorId: medico.id,
    },
    data: {
      status: nuevoEstado as AppointmentState,
      attendanceAt: attendanceDate,
    },
  });

  revalidatePath('/medico/agenda');
  revalidatePath('/medico/hoja-de-trabajo');
  return { success: true };
}
