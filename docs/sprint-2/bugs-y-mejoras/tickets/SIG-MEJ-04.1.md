# SIG-MEJ-04.1 — Informar claramente que la fecha de vacunación no tiene horarios libres

| Campo | Valor |
| --- | --- |
| Sprint | 2 |
| Responsable | Usuario — Bugs y Mejoras |
| Tema padre | SIG-MEJ-04 |
| Tipo de tarea | Mejora de estado vacío |
| Prioridad propuesta | P2 |
| Estado inicial | Planificada |
| Estado actual | Implementado y verificado con pruebas aisladas; pendiente validación integrada con usuario real |
| Esfuerzo orientativo | 1 h |
| Predecesoras del plan de integración | Ninguna |

## Implementación y verificación

Implementado el 13/10/2026 en la rama sprint-2/bugs-y-mejoras, sobre bea3fd1.

El formulario muestra el mensaje informativo por fecha sin horarios, lo asocia al campo mediante aria-describedby y distingue carga, consulta fallida y disponibilidad vacía. Los errores de fecha/horario se anuncian con role=alert.

**Evidencia:** [implementación y resultados de SIG-MEJ-04](../SIG-MEJ-04-IMPLEMENTACION.md). Pasaron 28 pruebas de formulario y acciones con base de datos simulada, typecheck y build. Lint pasó con un aviso preexistente en el buscador de pacientes. Las casillas de aceptación reflejan cobertura automatizada del alcance definido; no certifican un despliegue, sesión real o escritura contra la base compartida.

Complemento del 14/10/2026: [DEC-006](../../../decisiones.md#dec-006--confirmación-deshabilitada-sin-horarios-de-vacunación) aplica DU-10 con respaldo de image13: Confirmar deshabilitado sin horarios y asociado al aviso visible. Una consulta fallida mantiene su error distinto y el botón bloqueado; al recuperar horarios se habilita. Pruebas actualizadas y Chrome a 360/768/1280 px verificado; [cierre provisorio](../CIERRE-PROVISORIO.md). Ciclo DU-09 y duración DU-11 siguen abiertos fuera de este cambio.

## Disponibilidad para arrancar

**Clasificación:** Implementable sin consulta externa, mensaje definido.

**Alcance que puede avanzar:** Mostrar información de fecha sin horarios y retirar el mensaje al recuperar disponibilidad; distinguir carga o fallo de consulta para no informar falta de cupos falsamente.

**Dependencia o definición relevante:** No hace falta decidir duración (DU-11), ciclo (DU-09) ni interacción del botón (DU-10) para implementar el mensaje.

**Límite de esta clasificación:** Aplicar el bloqueo de DEC-006, usando el mensaje existente sin inventar causas de falta de disponibilidad ni cambiar ciclo/duración.

[Ver la clasificación de todos los tickets](../ARRANQUE.md). Esta sección no resuelve las dudas registradas ni modifica reglas de negocio; delimita el trabajo que puede empezar con lo ya definido.

## Precedencia y coordinación con otras US

**Predecesora o contrato:** Contrato de estados del servicio de slots existente.

**US/tareas relacionadas:** US-3.6 existente, SIG-MEJ-04.2/04.3 y US-7.4.

**Coordinación y cierre:** Mensaje de vacío de vacunación; no depende de agenda médica US-1.1/1.2. Coordinar cliente/servidor y preservar ciclo, duración e interacción pendiente.

[Ver el orden del sprint y la matriz de integración](../../ORDEN-E-INTEGRACION.md). Compartir archivo no implica dependencia funcional; las pruebas base pueden empezar antes de repetirlas con las US nuevas.

## Fuente y situación actual

[Documento de análisis — sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md).

El select ya muestra No hay horarios libres y se deshabilita con slots vacíos. No distingue con ayuda suficiente carga, error de consulta y ausencia real de horarios.

La evidencia inicial de código corresponde a la revisión estática previa al cambio. La ejecución posterior y sus límites están registrados en la sección Implementación y verificación.

## Objetivo

Explicar la ausencia de disponibilidad y orientar a elegir otra fecha.

## Trabajo y entregable

- Usar como referencia propuesta el mensaje del texto/diseño: No hay horarios disponibles para la fecha seleccionada. Elegí otra fecha. La fuente admite un mensaje claro equivalente.
- Distinguir fecha sin seleccionar, cargando, consulta fallida y resultado válido vacío.
- Asociar el mensaje al campo y anunciar cambios de disponibilidad sin tratar un fallo de consulta como día completo.

## Criterios de aceptación

- [x] **[Explícito en SIG-MEJ-04 CA1]** Una consulta exitosa sin slots muestra el mensaje y mantiene el select sin opciones.
- [x] **[Propuesta técnica]** Durante la carga no se anuncia ausencia de horarios; un error de consulta tiene mensaje propio.
- [x] **[Explícito en SIG-MEJ-04 CA3]** Con horarios disponibles el mensaje vacío desaparece y se permite seleccionar.
- [x] **[Propuesta técnica]** El mensaje es perceptible por teclado y lector de pantalla.

## Validación prevista

Probar los cuatro estados con datos controlados o respuesta simulada. Ejecutar lint y typecheck tras implementar.

## Archivos a revisar

- [src/app/(portal)/enfermera/turnos-vacunacion/assignment-form.tsx](../../../../src/app/%28portal%29/enfermera/turnos-vacunacion/assignment-form.tsx)

## Límite de alcance

Esto es disponibilidad del vacunatorio; no disponibilidad mensual de médicos (US-1.1) ni publicación automática (US-1.2).

## Revisión de requisitos, cobertura y dudas

Fecha: 13/10/2026. Esta revisión distingue reglas documentadas, propuestas de la fuente, implementación existente y supuestos del plan. Un dato observado en código no valida una regla de negocio.

### Requisito o regla correspondiente

RF-12 / US-3.6 cubren asignación de vacunación con stock. SIG-MEJ-04 CA1–CA4 en [Documento de sprint 2, sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md) exige mensaje por día sin disponibilidad, impedir operación, refrescar otra fecha y reservar «El horario es obligatorio» para cuando existen horarios. RF-31 define solicitud pendiente y aprobación posterior: hay una diferencia con el flujo actual. [Requerimientos funcionales](../../../../docs/requerimientos_funcionales.md).

### Historia o ticket que ya lo cubre

US-3.6.3 ya cubre horarios libres y 3.6.4 reserva de dosis. SIG-MEJ-04 corrige mensajes/estados de esa UI; no implementa US-1.1/1.2 ni US-2.2 de turnos médicos. [Historias de sprint 1](../../../../docs/user_stories_sprint_1.md).

**Para esta tarea:** Estado vacío documentado para la UI existente de US-3.6.3.

La cobertura encontrada es documental y local; no se consultó un tablero externo ni se afirma que esas historias estén terminadas.

### Qué es explícito y qué se estaba suponiendo

**Explícito en las fuentes:** No confirmar sin horarios, informar el motivo y permitir otra fecha. El texto ofrece un mensaje «como» ejemplo; el diseño muestra además el botón Confirmar turno deshabilitado.

**Supuesto o propuesta del primer plan:** Bloquear durante carga, representar errores de consulta y usar contador de solicitudes son soluciones técnicas. El código APROBADO directo no convierte ese flujo en regla de negocio validada. No se supone duración fija ni capacidad nueva.

Las etiquetas de los criterios separan obligación explícita, interpretación pendiente y verificación técnica. Proponer tests, un helper o atributos accesibles no crea una regla de negocio nueva ni exige un acuerdo funcional sobre cada detalle técnico.

### Datos faltantes o contradictorios

El diseño deshabilita Confirmar turno, pero la descripción considera el intento de confirmar sin cupos. Falta decisión de interacción y distinguir falta de franja/día completo/fallo de consulta.

**Dudas relacionadas:** [DU-10](../REVISION.md#du-10) aplicada/verificada bajo DEC-006. [DU-09](../REVISION.md#du-09), [DU-11](../REVISION.md#du-11) y [DU-12](../REVISION.md#du-12) mantienen sus pendientes; no se resuelven por esta decisión de interfaz.

### Tratamiento de la duda y alcance seguro

El mensaje sin cupos sí está definido. No inferir feriados, cupos por profesional/vacuna o duración fija para explicar un resultado vacío.

Los criterios condicionados se cierran solo cuando se documenta la definición que falta. Pueden continuar diagnóstico y revisión del comportamiento explícito; las expectativas dudosas no se implementan ni se convierten en pruebas que fijen una regla inventada.

Al completar, registrar evidencia y resultado en este ticket. Para código, indicar commit y comprobaciones realizadas; para definiciones, registrar el acuerdo. No marcar como terminado únicamente por existir código relacionado.

