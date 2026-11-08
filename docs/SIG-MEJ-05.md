# SIG-MEJ-05 — Confirmar turno al reservar

## Resumen

Cuando un paciente reserva un turno, el turno queda **confirmado de forma
instantánea**. Ya no existe un paso posterior de "Confirmar asistencia": el
paciente únicamente puede **darse de baja** del turno.

## Flujo de reserva

1. El paciente elige un horario disponible en `Buscar turnos`.
2. Al presionar **Reservar turno**, el Server Action `reservarTurno`
   (`src/app/(portal)/paciente/turnos/actions.ts`) crea el `Appointment` con
   `status: CONFIRMADO`.
3. El turno también se guarda como `CONFIRMADO` en la cookie de sesión
   `sigmed_recent_turnos`, para que aparezca de inmediato en **Mis turnos**.
4. En **Mis turnos** el turno se muestra con el badge **Confirmado** y la
   única acción disponible es **Darse de baja**.

## Criterios de aceptación

- **CA1:** al reservar, el turno aparece como confirmado.
- **CA2:** el paciente solo puede modificar el turno para darse de baja, no
  para confirmar asistencia.

## Cambios realizados

- `src/app/(portal)/paciente/turnos/actions.ts`
  - `reservarTurno` crea el turno con `status: CONFIRMADO`.
  - Se elimina el Server Action `confirmarTurno`.
- `src/app/(portal)/paciente/mis-turnos/mis-turnos-client.tsx`
  - Se quita el botón "Confirmar asistencia".
  - El botón "Darse de baja" se mantiene para turnos `CONFIRMADO` (y para
    turnos `RESERVADO` heredados).
- `src/app/(portal)/paciente/mis-turnos/page.tsx`
  - Se actualiza el texto de la pantalla.

## Notas

- No requiere migración: el estado `confirmado` ya existe en el enum
  `estado_turno` y el trigger `fn_turno_reglas` permite crear un turno
  directamente en ese estado, incluyéndolo en el control de solapamiento.
- El proyecto no implementa envío de emails, por lo que no hay un correo de
  confirmación que preservar.
