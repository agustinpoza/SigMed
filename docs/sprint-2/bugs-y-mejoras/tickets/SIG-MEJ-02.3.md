# SIG-MEJ-02.3 — Verificar que la búsqueda conserve la separación de historiales por paciente

| Campo | Valor |
| --- | --- |
| Sprint | 2 |
| Responsable | Usuario — Bugs y Mejoras |
| Tema padre | SIG-MEJ-02 |
| Tipo de tarea | Verificación de aislamiento de datos |
| Prioridad propuesta | P1 |
| Estado inicial | Pendiente de integración de búsqueda |
| Esfuerzo orientativo | 2 h |
| Predecesoras del plan de integración | [SIG-MEJ-02.2](SIG-MEJ-02.2.md) |

## Disponibilidad para arrancar

**Clasificación:** Regresión implementable sin consulta externa.

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

La evidencia de código corresponde a una revisión estática. Las verificaciones indicadas abajo están planificadas, no ejecutadas.

## Objetivo

Demostrar que buscar por profesional o contenido clínico solo opera sobre el historial del paciente activo.

## Trabajo y entregable

- Usar dos pacientes ficticios con términos clínicos/profesionales coincidentes.
- Comprobar render y datos enviados al cliente al cambiar de paciente o acceder sin actor/con rol distinto.
- Revisar que los cambios de búsqueda no alteren el filtro de paciente ni el select del servidor.

## Criterios de aceptación

- [ ] **[Explícito en RF-18 y US-5.2 CA2]** El paciente A nunca recibe ni encuentra registros exclusivos del paciente B.
- [ ] **[Regresión de aislamiento]** Al cambiar de paciente no permanece visible el historial anterior.
- [ ] **[RF-18/RNF-04; permisos administrativos pendientes DU-06]** Sin sesión válida no se entrega historial. El acceso por ADMINISTRADOR se evalúa con la matriz que defina US-7.5; no se inventa autorización ni prohibición general para ese rol.
- [ ] **[Entregable técnico]** Se registra evidencia y se informa cualquier fallo al responsable de permisos con pasos de reproducción.

## Validación prevista

Prueba de integración con dos identidades y fixtures aislados, revisando también los datos del render y no solo el texto visible. El actor de desarrollo sirve para el estado actual; repetir al integrar autenticación real.

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

**Dudas abiertas relacionadas:** [DU-04](../REVISION.md#du-04), [DU-05](../REVISION.md#du-05), [DU-06](../REVISION.md#du-06), [DU-12](../REVISION.md#du-12). No hay respuestas registradas; no se adopta una opción como regla por defecto.

### Tratamiento de la duda y alcance seguro

Verificar pacientes A/B y acceso no autorizado. Registrar la matriz administrativa pendiente como dependencia externa, no rehacer permisos.

Los criterios condicionados se cierran solo cuando se documenta la definición que falta. Pueden continuar diagnóstico y revisión del comportamiento explícito; las expectativas dudosas no se implementan ni se convierten en pruebas que fijen una regla inventada.

Al completar, registrar evidencia y resultado en este ticket. Para código, indicar commit y comprobaciones realizadas; para definiciones, registrar el acuerdo. No marcar como terminado únicamente por existir código relacionado.

