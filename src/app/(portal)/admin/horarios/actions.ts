'use server';

import { revalidatePath } from 'next/cache';
// import { actualizarHorarioMedico } from '@/lib/agenda'; // Lógica de base de datos futura

export async function modificarHorarios(formData: FormData) {
  // 1. Extracción de datos del FormData
  const doctorId = formData.get('doctorId') as string;
  const dias = formData.getAll('dias') as string[];
  const horaInicio = formData.get('horaInicio') as string;
  const horaFin = formData.get('horaFin') as string;
  const duracionStr = formData.get('duracion') as string;

  // 2. Validación manual estricta (Sin Zod)
  if (!doctorId || typeof doctorId !== 'string') {
    throw new Error('Debe seleccionar un profesional válido.');
  }
  if (!dias || dias.length === 0) {
    throw new Error('Debe seleccionar al menos un día de atención.');
  }
  if (!horaInicio || !horaFin) {
    throw new Error('Debe especificar la franja horaria completa.');
  }
  if (horaInicio >= horaFin) {
    throw new Error('La hora de inicio debe ser anterior a la hora de fin.');
  }
  
  const duracion = parseInt(duracionStr, 10);
  if (isNaN(duracion) || duracion <= 0) {
    throw new Error('Debe seleccionar una duración de turno válida.');
  }

  // 3. Integración con la capa de negocio (Ejemplo de abstracción hacia lib/)
  try {
    // Aquí se llamaría a la función de src/lib/agenda.ts pasando el actorId y los datos
    // await actualizarHorarioMedico(actorId, { doctorId, dias, horaInicio, horaFin, duracion });
    
    console.log('Horarios guardados exitosamente:', { doctorId, dias, horaInicio, horaFin, duracion });

    // 4. Actualizar la vista (Actualiza los turnos disponibles según el cambio - Tarea 1.5.3)
    revalidatePath('/admin/horarios');
    revalidatePath('/medico/agenda'); // Impactar agenda pública
    
  } catch (error) {
    console.error('Error al guardar los horarios:', error);
    throw new Error('Ocurrió un problema al persistir los cambios.');
  }
}
