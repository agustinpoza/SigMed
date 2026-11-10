'use server';

import { revalidatePath } from 'next/cache';
import { UserRole } from '@/generated/prisma/enums';
import { getCurrentActor } from '@/lib/actor';
import { prisma } from '@/lib/db';

export async function actualizarValorConsulta(valor: number): Promise<void> {
  const actor = await getCurrentActor();

  if (!actor || actor.role !== UserRole.MEDICO) {
    throw new Error('No autorizado.');
  }

  if (!Number.isFinite(valor) || valor <= 0) {
    throw new Error('Ingresá un valor mayor que cero.');
  }

  const medico = await prisma.doctor.findUnique({
    where: { id: actor.id },
    select: { id: true },
  });

  if (!medico) {
    throw new Error('No se encontró la ficha del médico.');
  }

  await prisma.doctor.update({
    where: { id: medico.id },
    data: { consultFee: valor },
  });

  revalidatePath('/medico/perfil');
}