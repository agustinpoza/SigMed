# SIG-MEJ-02.3 — Verificar que la búsqueda conserve la separación de historiales por paciente

| Campo | Valor |
| --- | --- |
| Sprint | 2 |
| Responsable | Usuario — Bugs y Mejoras |
| Tema padre | SIG-MEJ-02 |
| Tipo de tarea | Verificación de aislamiento de datos |
| Prioridad propuesta | P1 |
| Estado inicial | Pendiente de integración de búsqueda |
| Estado actual | Alcance del bloque implementado/verificado; integración con sesión real pendiente de US-7.2/7.4 |
| Esfuerzo orientativo | 2 h |
| Predecesoras del plan de integración | [SIG-MEJ-02.2](SIG-MEJ-02.2.md) |

## Implementación y marco de integración

Fecha: 14/10/2026. Base: `dd3a6a4`. Se ejecutan 8 pruebas con PostgreSQL y la página/componente reales, simulando solo identidad. Se inspeccionan los datos enviados al cliente y las búsquedas de A/B, ausencia de actor, roles actuales y cambios de paciente.

Se corrigió el estado retenido al cambiar de paciente: la tabla usa `key={actor.id}` para limpiar consulta, filtros, orden, página y detalle. [Ver evidencia](../SIG-MEJ-02.3-03.3-IMPLEMENTACION.md).

El usuario indicó que las US de acceso corresponden a otro integrante. [Marco de integración para ese responsable](../../INTEGRACION-US-7.2-7.4.md), con tres TODO separados y sin mock de identidad en su archivo. No se implementa autenticación ni US-7.5.

## Disponibilidad para arrancar

**Clasificación:** Regresión entregada; integración externa con sesión real pendiente.

**Alcance que puede avanzar:** Preparar/ejecutar pruebas de pacientes A/B y sesión inválida sobre el historial existente, verificando los datos enviados además de lo visible.

**Dependencia o definición relevante:** RF-18 y US-5.2 CA2 ya definen el aislamiento. SIG-MEJ-02.2 es dependencia para repetir la regresión al integrar su cambio, no para empezar la prueba base.

**Límite de esta clasificación:** No definir ni probar como regla nueva el acceso administrativo pendiente en DU-06. No confundir esta regresión con certificar toda la autenticación real.

[Ver la clasificación de todos los tickets](../ARRANQUE.md). Esta sección no resuelve las dudas registradas ni modifica reglas de negocio; delimita el trabajo que puede empezar con lo ya definido.

## Precedencia y coordinación con otras US

**Predecesora o contrato:** Ninguna para regresión base; repetir tras SIG-MEJ-02.2.

**US/tareas relacionadas:** US-7.2/7.4/7.5 y US-5.1.

**Coordinación y cierre:** Arrancar pruebas A/B sobre lo existente. Para cerrar permisos reales repetir con sesión de US-7.2/7.4; acceso administrativo requiere DU-06 y US-7.5, sin inventar su matriz.

[Ver el orden del sprint y la matriz de integración](../../ORDEN-E-INTEGRACION.md). Compartir archivo no implica dependencia funcional; las pruebas base pueden empezar antes de repetirlas con las US nuevas.

## Fuente y situación actual

[Documento de análisis — sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md).

HistorialPage comprueba rol PACIENTE y filtra por appointment.patientId = actor.id antes de enviar los registros al cliente. Son controles existentes cuya efectividad debe verificarse.

La situación inicial describe el control existente. La verificación ejecutada y su límite de identidad simulada están registrados arriba.

## Objetivo

Demostrar que buscar por profesional o contenido clínico solo opera sobre el historial del paciente activo.

## Trabajo y entregable

- Usar dos pacientes ficticios con términos clínicos/profesionales coincidentes.
- Comprobar render y datos enviados al cliente al cambiar de paciente o acceder sin actor/con rol distinto.
- Revisar que los cambios de búsqueda no alteren el filtro de paciente ni el select del servidor.

## Criterios de aceptación

- [x] **[RF-18/US-5.2; perfiles de prueba]** A/B reciben y buscan únicamente sus registros; se inspeccionan también las props del cliente y la consulta real en PostgreSQL.
- [x] **[Regresión]** Cambiar de paciente elimina datos y estado del historial anterior, incluida la página 2.
- [x] **[Contrato actual]** Actor nulo no entrega historial; se preservan los guards actuales sin definir la matriz administrativa de US-7.5.
- [ ] **[Integración externa RNF-04/US-7.2/7.4]** Repetir con sesión real inválida/vencida y cambio de cuenta. Permisos administrativos dependen de DU-06/US-7.5.
- [x] **[Entregable técnico]** Evidencia, casos reproducibles y contratos para el responsable externo registrados; no se envían mensajes a terceros.

## Validación prevista

`npm.cmd run test:integration`: PostgreSQL propio temporal con fixtures, página resuelta y componente real. No usa credenciales externas, seed o `.env`; repetir por HTTP al integrar autenticación real.

## Archivos a revisar

- [src/app/(portal)/paciente/historial/page.tsx](../../../../src/app/%28portal%29/paciente/historial/page.tsx)
- [src/app/(portal)/paciente/historial/clinical-history-table.tsx](../../../../src/app/%28portal%29/paciente/historial/clinical-history-table.tsx)
- [src/lib/dev-actor.ts](../../../../src/lib/dev-actor.ts)

## Límite de alcance

No implementar US-7.2, US-7.4 o US-7.5. Corregir un fallo introducido por esta mejora sí pertenece al ticket.

## Revisión de requisitos, cobertura y dudas

Fecha: 13/10/2026. Esta revisión distingue reglas documentadas, propuestas de la fuente, implementación existente y supuestos del plan. Un dato observado en código no valida una regla de negocio.

### Requisito o regla correspondiente

RF-18 exige consulta del historial propio; no define la ampliación por profesional. SIG-MEJ-02 de [Documento de sprint 2, sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md) propone esa ampliación y la condiciona a definición/aprobación. RNF-04 aporta autenticación y permisos. [Requerimientos funcionales](../../../../docs/requerimientos_funcionales.md); [Requerimientos no funcionales](../../../../docs/requerimientos_no_funcionales.md).

### Historia o ticket que ya lo cubre

US-5.2 cubre el historial; su tarea 5.2.3 y CA2 ya cubren aislamiento por paciente. SIG-BUG-02 corrige acentos. US-7.2/7.4/7.5 cubren autenticación y permisos, sin que este bloque pueda redefinirlos. [Historias de sprint 1](../../../../docs/user_stories_sprint_1.md).

**Para esta tarea:** Regresión explícita de US-5.2.3/CA2, reutilizada después de cambiar el buscador.

La cobertura encontrada es documental y local; no se consultó un tablero externo ni se afirma que esas historias estén terminadas.

### Qué es explícito y qué se estaba suponiendo

**Explícito en las fuentes:** La fuente pide definir campos, agregar nombre/apellido y ayuda y verificar separación de pacientes. El diseño propuesto muestra «Buscar por profesional, diagnóstico o tratamiento». RF-18 prohíbe entregar registros ajenos al paciente.

**Supuesto o propuesta del primer plan:** El código ya incluye seis campos, pero conservarlos como alcance aprobado fue una propuesta. Buscar en orden Nombre Apellido, insensibilidad a ñ y equivalencias adicionales no están definidos.

Las etiquetas de los criterios separan obligación explícita, interpretación pendiente y verificación técnica. Proponer tests, un helper o atributos accesibles no crea una regla de negocio nueva ni exige un acuerdo funcional sobre cada detalle técnico.

### Datos faltantes o contradictorios

No inventar una prohibición general para ADMINISTRADOR: RF-26/US-7.5 permiten funciones adicionales pero no detallan qué historial consultar ni cómo seleccionarlo.

**Dudas relacionadas:** DU-04/DU-05 resueltas por DEC-002/003. [DU-06](../REVISION.md#du-06) permanece con US-7.5; [DU-12](../REVISION.md#du-12), con su jerarquía general pendiente. La integración de sesión real queda en el marco externo, sin inventar permisos.

### Tratamiento de la duda y alcance seguro

Verificar pacientes A/B y acceso no autorizado. Registrar la matriz administrativa pendiente como dependencia externa, no rehacer permisos.

Los criterios condicionados se cierran solo cuando se documenta la definición que falta. Pueden continuar diagnóstico y revisión del comportamiento explícito; las expectativas dudosas no se implementan ni se convierten en pruebas que fijen una regla inventada.

Al completar, registrar evidencia y resultado en este ticket. Para código, indicar commit y comprobaciones realizadas; para definiciones, registrar el acuerdo. No marcar como terminado únicamente por existir código relacionado.

