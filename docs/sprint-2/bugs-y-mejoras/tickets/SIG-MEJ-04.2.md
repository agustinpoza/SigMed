# SIG-MEJ-04.2 — Diferenciar al confirmar entre día sin cupos y horario no seleccionado

| Campo | Valor |
| --- | --- |
| Sprint | 2 |
| Responsable | Usuario — Bugs y Mejoras |
| Tema padre | SIG-MEJ-04 |
| Tipo de tarea | Corrección de mensajes y validación |
| Prioridad propuesta | P1 |
| Estado inicial | Pendiente de estados del formulario |
| Estado actual | Implementado y verificado con pruebas aisladas; pendiente validación integrada con usuario real |
| Esfuerzo orientativo | 3 h |
| Predecesoras del plan de integración | [SIG-MEJ-04.1](SIG-MEJ-04.1.md) |

## Implementación y verificación

Implementado el 13/10/2026 en la rama sprint-2/bugs-y-mejoras, sobre bea3fd1.

La acción valida la fecha y consulta getFreeSlots antes de exigir una selección: sin cupos devuelve la orientación para cambiar fecha; con opciones sin seleccionar devuelve El horario es obligatorio. Un horario ocupado o ajeno a la fecha se rechaza antes de asignar. Se mantiene el control de concurrencia de la función de asignación.

**Evidencia:** [implementación y resultados de SIG-MEJ-04](../SIG-MEJ-04-IMPLEMENTACION.md). Pasaron 28 pruebas de formulario y acciones con base de datos simulada, typecheck y build. Lint pasó con un aviso preexistente en el buscador de pacientes. Las casillas de aceptación reflejan cobertura automatizada del alcance definido; no certifican un despliegue, sesión real o escritura contra la base compartida.

Complemento del 14/10/2026: [DEC-006](../../../decisiones.md#dec-006--confirmación-deshabilitada-sin-horarios-de-vacunación) aplica DU-10. El botón y el handler bloquean sin horarios o ante error de consulta, con aviso/error asociado y diferenciado. La validación del servidor sigue protegiendo peticiones directas y exige horario cuando existen opciones. [Pruebas actualizadas y cierre provisorio](../CIERRE-PROVISORIO.md). DU-09/DU-11 siguen abiertos; no se cambia ciclo ni duración.

## Disponibilidad para arrancar

**Clasificación:** Implementable sin consulta externa, validación definida.

**Alcance que puede avanzar:** En el servidor distinguir fecha sin cupos de horario no seleccionado cuando sí hay opciones; devolver el mensaje correspondiente e impedir creación inválida.

**Dependencia o definición relevante:** SIG-MEJ-04.1 es dependencia de integración. La validación del servidor aplica tanto con botón activo como deshabilitado; no requiere decidir DU-10 ni cambiar el ciclo de DU-09.

**Límite de esta clasificación:** No agregar aprobación automática, estados nuevos, prioridades de todos los errores ni modificar el momento de reserva. La coherencia del ciclo existente queda pendiente fuera de esta corrección de mensajes.

[Ver la clasificación de todos los tickets](../ARRANQUE.md). Esta sección no resuelve las dudas registradas ni modifica reglas de negocio; delimita el trabajo que puede empezar con lo ya definido.

## Precedencia y coordinación con otras US

**Predecesora o contrato:** Contrato de mensajes con SIG-MEJ-04.1; ambas capas pueden programarse en paralelo.

**US/tareas relacionadas:** US-3.6/RF-31 existentes y US-7.2/7.4.

**Coordinación y cierre:** Corregir error sin cupos vs selección, sin crear otro ciclo/dosis. DU-09 se coordina con vacunación; no se transfiere a US-2.2 de turnos médicos.

[Ver el orden del sprint y la matriz de integración](../../ORDEN-E-INTEGRACION.md). Compartir archivo no implica dependencia funcional; las pruebas base pueden empezar antes de repetirlas con las US nuevas.

## Fuente y situación actual

[Documento de análisis — sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md).

La acción aplica requiredText a scheduledAt antes de comprobar disponibilidad. Con el select vacío/deshabilitado se devuelve El horario es obligatorio aunque el día no tenga cupos; la capa de asignación ya valida horarios y concurrencia.

La evidencia inicial de código corresponde a la revisión estática previa al cambio. La ejecución posterior y sus límites están registrados en la sección Implementación y verificación.

## Objetivo

Dar un error acorde a la disponibilidad real y conservar la protección de la reserva en el servidor.

## Trabajo y entregable

- En el servidor distinguir fecha válida sin slots de fecha con slots pero sin selección; no confiar en una bandera de disponibilidad del cliente.
- Conservar validación de fecha/paciente/vacuna y bloqueo durante carga; aplicar DU-10 / DEC-006 con aviso visible sin cupos.
- Si el horario se ocupa entre consulta y envío, devolver conflicto comprensible y refrescar sin crear otro turno.
- Conservar las restricciones actuales sin asumir que APROBADO directo es la regla validada: el ciclo y momento de reserva se aclaran en DU-09 con RF-31 y US-3.6.

## Criterios de aceptación

- [x] **[Explícito en SIG-MEJ-04 CA2]** Sin cupos: impide crear y muestra el mensaje de elegir otra fecha, sin El horario es obligatorio.
- [x] **[Explícito en SIG-MEJ-04 CA4]** Con cupos y sin selección: muestra El horario es obligatorio.
- [x] **[Propuesta técnica]** Fecha inválida o consulta fallida no se presenta como falta de cupos.
- [x] **[Integridad de US-3.6; ciclo pendiente DU-09]** Un envío directo o un horario ocupado no crea turno inválido ni descuenta stock.
- [x] **[DU-10 / DEC-006; wireframe]** Confirmar queda deshabilitado sin horarios o con error de consulta, con su explicación asociada; recuperar horarios lo habilita.

## Validación prevista

Pruebas de la acción y del flujo para día vacío, selección faltante, fecha inválida y último horario ocupado durante el envío. Reutilizar test:vaccination para las invariantes pertinentes, revisando sus fixtures y escrituras primero. Ejecutar lint/typecheck.

## Archivos a revisar

- [src/app/(portal)/enfermera/turnos-vacunacion/assignment-form.tsx](../../../../src/app/%28portal%29/enfermera/turnos-vacunacion/assignment-form.tsx)
- [src/app/(portal)/enfermera/turnos-vacunacion/actions.ts](../../../../src/app/%28portal%29/enfermera/turnos-vacunacion/actions.ts)
- [src/lib/vaccination.ts](../../../../src/lib/vaccination.ts)

## Límite de alcance

No implementar US-2.2: esa historia corresponde a confirmación del turno médico del paciente, no al formulario de vacunación de enfermería.

## Revisión de requisitos, cobertura y dudas

Fecha: 13/10/2026. Esta revisión distingue reglas documentadas, propuestas de la fuente, implementación existente y supuestos del plan. Un dato observado en código no valida una regla de negocio.

### Requisito o regla correspondiente

RF-12 / US-3.6 cubren asignación de vacunación con stock. SIG-MEJ-04 CA1–CA4 en [Documento de sprint 2, sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md) exige mensaje por día sin disponibilidad, impedir operación, refrescar otra fecha y reservar «El horario es obligatorio» para cuando existen horarios. RF-31 define solicitud pendiente y aprobación posterior: hay una diferencia con el flujo actual. [Requerimientos funcionales](../../../../docs/requerimientos_funcionales.md).

### Historia o ticket que ya lo cubre

US-3.6.3 ya cubre horarios libres y 3.6.4 reserva de dosis. SIG-MEJ-04 corrige mensajes/estados de esa UI; no implementa US-1.1/1.2 ni US-2.2 de turnos médicos. [Historias de sprint 1](../../../../docs/user_stories_sprint_1.md).

**Para esta tarea:** Validación de mensaje documentada, con conservación de restricciones de RF-12.

La cobertura encontrada es documental y local; no se consultó un tablero externo ni se afirma que esas historias estén terminadas.

### Qué es explícito y qué se estaba suponiendo

**Explícito en las fuentes:** No confirmar sin horarios, informar el motivo y permitir otra fecha. El texto ofrece un mensaje «como» ejemplo; el diseño muestra además el botón Confirmar turno deshabilitado.

**Supuesto o propuesta del primer plan:** Bloquear durante carga, representar errores de consulta y usar contador de solicitudes son soluciones técnicas. El código APROBADO directo no convierte ese flujo en regla de negocio validada. No se supone duración fija ni capacidad nueva.

Las etiquetas de los criterios separan obligación explícita, interpretación pendiente y verificación técnica. Proponer tests, un helper o atributos accesibles no crea una regla de negocio nueva ni exige un acuerdo funcional sobre cada detalle técnico.

### Datos faltantes o contradictorios

RF-31 pide PENDIENTE antes de aprobar; el código crea APROBADO y asigna dosis en una acción. Falta definir si el botón representa solicitud, aprobación o ambas operaciones autorizadas.

**Dudas relacionadas:** [DU-10](../REVISION.md#du-10) aplicada/verificada bajo DEC-006. [DU-09](../REVISION.md#du-09), [DU-11](../REVISION.md#du-11) y [DU-12](../REVISION.md#du-12) mantienen sus pendientes; no se resuelven por esta decisión de interfaz.

### Tratamiento de la duda y alcance seguro

No modificar el ciclo ni el momento de stock desde este ticket. El servidor debe rechazar la operación sin horario aunque la UI termine deshabilitando el botón.

Los criterios condicionados se cierran solo cuando se documenta la definición que falta. Pueden continuar diagnóstico y revisión del comportamiento explícito; las expectativas dudosas no se implementan ni se convierten en pruebas que fijen una regla inventada.

Al completar, registrar evidencia y resultado en este ticket. Para código, indicar commit y comprobaciones realizadas; para definiciones, registrar el acuerdo. No marcar como terminado únicamente por existir código relacionado.

