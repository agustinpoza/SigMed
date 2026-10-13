# SIG-MEJ-04.3 — Verificar y ajustar la actualización de horarios al cambiar la fecha

| Campo | Valor |
| --- | --- |
| Sprint | 2 |
| Responsable | Usuario — Bugs y Mejoras |
| Tema padre | SIG-MEJ-04 |
| Tipo de tarea | Integración y regresión de formulario |
| Prioridad propuesta | P2 |
| Estado inicial | Pendiente de mensajes; actualización básica existente |
| Estado actual | Implementado y verificado con pruebas aisladas; pendiente validación integrada con usuario real |
| Esfuerzo orientativo | 2 h |
| Predecesoras del plan de integración | [SIG-MEJ-04.1](SIG-MEJ-04.1.md), [SIG-MEJ-04.2](SIG-MEJ-04.2.md) |

## Implementación y verificación

Implementado el 13/10/2026 en la rama sprint-2/bugs-y-mejoras, sobre bea3fd1.

Cambiar fecha limpia opciones, selección y error de consulta previos. Los contadores descartan respuestas tardías y una revisión de la selección impide reutilizar errores de un envío anterior. Una selección rechazada por el servidor refresca la lista; cancelar también descarta una consulta pendiente.

**Evidencia:** [implementación y resultados de SIG-MEJ-04](../SIG-MEJ-04-IMPLEMENTACION.md). Pasaron 28 pruebas de formulario y acciones con base de datos simulada, typecheck y build. Lint pasó con un aviso preexistente en el buscador de pacientes. Las casillas de aceptación reflejan cobertura automatizada del alcance definido; no certifican un despliegue, sesión real o escritura contra la base compartida.

Las dudas DU-09/DU-10/DU-11 siguen abiertas: no se cambiaron ciclo de aprobación, duración ni política del botón sin horarios. Se conservó la posibilidad existente de intentar confirmar sin cupos y se corrigió su respuesta; durante una consulta pendiente se impide enviar por coherencia técnica.

## Disponibilidad para arrancar

**Clasificación:** Implementable sin consulta externa, tras integrar mensajes.

**Alcance que puede avanzar:** Verificar/corregir actualización por fecha, selección y errores obsoletos, recuperación y respuestas tardías, sobre loadSlots existente.

**Dependencia o definición relevante:** SIG-MEJ-04.1/04.2 son dependencias técnicas. Mostrar horarios de la última fecha está definido; no depende de decidir duración, feriados o capacidad.

**Límite de esta clasificación:** No recalcular agenda ni adoptar 30 minutos como regla; trabajar con la disponibilidad que entrega el servicio existente.

[Ver la clasificación de todos los tickets](../ARRANQUE.md). Esta sección no resuelve las dudas registradas ni modifica reglas de negocio; delimita el trabajo que puede empezar con lo ya definido.

## Precedencia y coordinación con otras US

**Predecesora o contrato:** SIG-MEJ-04.1/04.2 para regresión integrada; carga actual puede revisarse antes.

**US/tareas relacionadas:** US-3.6 existente y US-7.2/7.4.

**Coordinación y cierre:** Verificar última fecha y errores vigentes. No redefinir duración, cupos o franjas; repetir si cambia externamente identidad/flujo de vacunación.

[Ver el orden del sprint y la matriz de integración](../../ORDEN-E-INTEGRACION.md). Compartir archivo no implica dependencia funcional; las pruebas base pueden empezar antes de repetirlas con las US nuevas.

## Fuente y situación actual

[Documento de análisis — sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md).

loadSlots ya limpia scheduledAt, consulta otra fecha y descarta respuestas antiguas mediante slotsRequest. Sin embargo, durante una carga conserva slots previos y los errores de la acción pueden seguir visibles.

La evidencia inicial de código corresponde a la revisión estática previa al cambio. La ejecución posterior y sus límites están registrados en la sección Implementación y verificación.

## Objetivo

Verificar lo implementado y corregir únicamente estados obsoletos al pasar entre fechas.

## Trabajo y entregable

- Probar cambio de fecha vacía a disponible y viceversa.
- Limpiar la selección y los mensajes de la fecha anterior sin ocultar errores nuevos válidos.
- Comprobar dos cambios rápidos con respuestas en orden inverso y un fallo de consulta recuperable.
- Reutilizar loadSlots y su contador en vez de reimplementar la carga.

## Criterios de aceptación

- [x] **[Explícito en SIG-MEJ-04 CA3]** Otra fecha con disponibilidad muestra sus horarios y permite confirmar uno válido.
- [x] **[Preservación técnica]** No queda seleccionado un horario de la fecha anterior ni se muestra su error fuera de contexto.
- [x] **[Propuesta técnica contra respuestas obsoletas]** La última fecha elegida prevalece aunque llegue tarde una respuesta anterior.
- [x] **[Propuesta técnica de recuperación]** Carga, falta de disponibilidad y fallo de consulta se distinguen y se puede recuperar cambiando fecha.

## Validación prevista

Prueba del componente/flujo con respuestas demoradas y cambio vacío→disponible→vacío; verificar éxito posterior sin errores viejos. Ejecutar lint y typecheck.

## Archivos a revisar

- [src/app/(portal)/enfermera/turnos-vacunacion/assignment-form.tsx](../../../../src/app/%28portal%29/enfermera/turnos-vacunacion/assignment-form.tsx)
- [src/app/(portal)/enfermera/turnos-vacunacion/actions.ts](../../../../src/app/%28portal%29/enfermera/turnos-vacunacion/actions.ts)

## Límite de alcance

No crear una nueva agenda ni cambiar la regla de duración del vacunatorio.

## Revisión de requisitos, cobertura y dudas

Fecha: 13/10/2026. Esta revisión distingue reglas documentadas, propuestas de la fuente, implementación existente y supuestos del plan. Un dato observado en código no valida una regla de negocio.

### Requisito o regla correspondiente

RF-12 / US-3.6 cubren asignación de vacunación con stock. SIG-MEJ-04 CA1–CA4 en [Documento de sprint 2, sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md) exige mensaje por día sin disponibilidad, impedir operación, refrescar otra fecha y reservar «El horario es obligatorio» para cuando existen horarios. RF-31 define solicitud pendiente y aprobación posterior: hay una diferencia con el flujo actual. [Requerimientos funcionales](../../../../docs/requerimientos_funcionales.md).

### Historia o ticket que ya lo cubre

US-3.6.3 ya cubre horarios libres y 3.6.4 reserva de dosis. SIG-MEJ-04 corrige mensajes/estados de esa UI; no implementa US-1.1/1.2 ni US-2.2 de turnos médicos. [Historias de sprint 1](../../../../docs/user_stories_sprint_1.md).

**Para esta tarea:** Verificación y ajuste de US-3.6.3, no segunda implementación de loadSlots.

La cobertura encontrada es documental y local; no se consultó un tablero externo ni se afirma que esas historias estén terminadas.

### Qué es explícito y qué se estaba suponiendo

**Explícito en las fuentes:** No confirmar sin horarios, informar el motivo y permitir otra fecha. El texto ofrece un mensaje «como» ejemplo; el diseño muestra además el botón Confirmar turno deshabilitado.

**Supuesto o propuesta del primer plan:** Bloquear durante carga, representar errores de consulta y usar contador de solicitudes son soluciones técnicas. El código APROBADO directo no convierte ese flujo en regla de negocio validada. No se supone duración fija ni capacidad nueva.

Las etiquetas de los criterios separan obligación explícita, interpretación pendiente y verificación técnica. Proponer tests, un helper o atributos accesibles no crea una regla de negocio nueva ni exige un acuerdo funcional sobre cada detalle técnico.

### Datos faltantes o contradictorios

Actualización básica ya presente; faltan evidencia runtime y decisión sobre mensajes y botón. La regla 60/30 minutos aparece como observación pendiente, no mandato.

**Dudas abiertas relacionadas:** [DU-09](../REVISION.md#du-09), [DU-10](../REVISION.md#du-10), [DU-11](../REVISION.md#du-11), [DU-12](../REVISION.md#du-12). No hay respuestas registradas; no se adopta una opción como regla por defecto.

### Tratamiento de la duda y alcance seguro

Probar cambio de fecha y respuestas tardías como calidad técnica sin cambiar el cálculo de duración o capacidad.

Los criterios condicionados se cierran solo cuando se documenta la definición que falta. Pueden continuar diagnóstico y revisión del comportamiento explícito; las expectativas dudosas no se implementan ni se convierten en pruebas que fijen una regla inventada.

Al completar, registrar evidencia y resultado en este ticket. Para código, indicar commit y comprobaciones realizadas; para definiciones, registrar el acuerdo. No marcar como terminado únicamente por existir código relacionado.

