import { prisma } from "@/lib/db";
import { Weekday } from '@/generated/prisma/client';

export class AgendaRuleError extends Error {
  constructor(public message: string, public field?: string) {
    super(message);
    this.name = 'AgendaRuleError';
  }
}

interface HorarioData {
  doctorId: string;
  dias: string[];
  horaInicio: string;
  horaFin: string;
  duracion: number;
}

// Mapeo del formulario (string) al enum de Prisma
const mapDiaToWeekday = (dia: string): Weekday => {
  const mapeo: Record<string, Weekday> = {
    'Lunes': 'LUNES',
    'Martes': 'MARTES',
    'Miércoles': 'MIERCOLES',
    'Jueves': 'JUEVES',
    'Viernes': 'VIERNES',
    'Sábado': 'SABADO',
    'Domingo': 'DOMINGO'
  };
  return mapeo[dia] || 'LUNES';
};

// Convierte "HH:MM" a un objeto Date base para el campo @db.Time(0)
const parseTime = (timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(1970, 0, 1, hours, minutes, 0, 0);
  return date;
};

export async function actualizarHorarioMedico(actorId: string, data: HorarioData) {
  // 1. Validar que el actor existe (Se asume rol de admin validado previamente o por middleware)
  const actorProfile = await prisma.userProfile.findUnique({
    where: { id: actorId }
  });

  if (!actorProfile) {
    throw new AgendaRuleError('No autorizado. El perfil del administrador no existe.');
  }

  const diasEnum = data.dias.map(mapDiaToWeekday);
  const fechaInicio = parseTime(data.horaInicio);
  const fechaFin = parseTime(data.horaFin);

  try {
    await prisma.$transaction(async (tx) => {
      // 2. Actualizar la duración global de la consulta en el perfil del médico
      await tx.doctor.update({
        where: { id: data.doctorId },
        data: { consultDuration: data.duracion }
      });

      // 3. Eliminar los horarios anteriores para los días seleccionados
      await tx.doctorSchedule.deleteMany({
        where: {
          doctorId: data.doctorId,
          weekday: { in: diasEnum }
        }
      });

      // 4. Insertar la nueva configuración de la agenda
      const nuevosHorarios = diasEnum.map(dia => ({
        doctorId: data.doctorId,
        weekday: dia,
        startTime: fechaInicio,
        endTime: fechaFin,
        modifiedById: actorId,
        modifiedAt: new Date()
      }));

      await tx.doctorSchedule.createMany({
        data: nuevosHorarios
      });
    });
  } catch (error) {
    console.error("Error transaccional al actualizar horarios:", error);
    throw new AgendaRuleError('Error al guardar en la base de datos.');
  }
}