# SIG-MEJ-02.1 — Definir el alcance de campos buscables del historial

| Campo | Valor |
| --- | --- |
| Sprint | 2 |
| Responsable | Usuario — Bugs y Mejoras |
| Tema padre | SIG-MEJ-02 |
| Tipo de tarea | Definición de mejora funcional |
| Prioridad propuesta | P2 |
| Estado inicial | Lista para preparar definición; aprobación funcional pendiente |
| Esfuerzo orientativo | 1 h |
| Predecesoras del plan de integración | Ninguna |

## Disponibilidad para arrancar

**Clasificación:** Tarea de definición, no de implementación.

**Alcance que puede avanzar:** Inventariar los seis campos del código y los tres del diseño; preparar matriz de ejemplos y dudas.

**Dependencia o definición relevante:** Resolver DU-04/DU-05 sobre campos y forma de nombres para cerrar. No se necesita permiso para preparar la matriz.

**Límite de esta clasificación:** No tomar la presencia de código como aprobación de seis campos.

[Ver la clasificación de todos los tickets](../ARRANQUE.md). Esta sección no resuelve las dudas registradas ni modifica reglas de negocio; delimita el trabajo que puede empezar con lo ya definido.

## Precedencia y coordinación con otras US

**Predecesora o contrato:** Ninguna para preparar matriz; DU-04/DU-05 para cerrar.

**US/tareas relacionadas:** SIG-BUG-02.1, SIG-MEJ-02.2 y US-5.2.

**Coordinación y cierre:** Definir campos/ayuda una sola vez; el buscador de turnos de US-2.1 es otro caso.

[Ver el orden del sprint y la matriz de integración](../../ORDEN-E-INTEGRACION.md). Compartir archivo no implica dependencia funcional; las pruebas base pueden empezar antes de repetirlas con las US nuevas.

## Fuente y situación actual

[Documento de análisis — sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md).

Ya se busca por profesional, especialidad, diagnóstico, tratamiento, indicaciones y fecha. El documento propone profesional/diagnóstico/tratamiento y condiciona la búsqueda por profesional a aprobación.

La evidencia de código corresponde a una revisión estática. Las verificaciones indicadas abajo están planificadas, no ejecutadas.

## Objetivo

Acordar los campos visibles en la ayuda y confirmar la búsqueda por profesional sin duplicar funcionalidad existente.

## Trabajo y entregable

- Inventariar los seis campos existentes y registrar cuáles se mantienen.
- Contrastar los tres campos del diseño con los seis del código y registrar la duda. No dar por aprobada su conservación ni eliminarlos sin definición funcional.
- Acordar búsqueda por nombre y apellido separados, y aclarar si nombre completo en orden natural debe funcionar pese al formato Apellido, Nombre.

## Criterios de aceptación

- [ ] **[Definición pendiente DU-05]** La matriz de campos y ejemplos queda registrada y validada por el cliente/responsable funcional.
- [ ] **[Separación de alcance]** Se distingue soporte existente de ajustes adicionales; Martín/Martin depende de SIG-BUG-02.
- [ ] **[Condicionado a definición DU-05]** El texto de ayuda aprobado coincide con lo que el buscador realmente admite.

## Validación prevista

Contrastar el documento y el código con ejemplos por cada campo. Registrar decisiones; no declarar aprobado un alcance propuesto.

## Archivos a revisar

- [src/app/(portal)/paciente/historial/clinical-history-table.tsx](../../../../src/app/%28portal%29/paciente/historial/clinical-history-table.tsx)
- [src/app/(portal)/paciente/historial/page.tsx](../../../../src/app/%28portal%29/paciente/historial/page.tsx)

## Límite de alcance

El texto de ayuda y la ampliación de campos quedan en SIG-MEJ-02, aunque también se mencionen en el diseño de SIG-BUG-02.

## Revisión de requisitos, cobertura y dudas

Fecha: 13/10/2026. Esta revisión distingue reglas documentadas, propuestas de la fuente, implementación existente y supuestos del plan. Un dato observado en código no valida una regla de negocio.

### Requisito o regla correspondiente

RF-18 exige consulta del historial propio; no define la ampliación por profesional. SIG-MEJ-02 de [Documento de sprint 2, sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md) propone esa ampliación y la condiciona a definición/aprobación. RNF-04 aporta autenticación y permisos. [Requerimientos funcionales](../../../../docs/requerimientos_funcionales.md); [Requerimientos no funcionales](../../../../docs/requerimientos_no_funcionales.md).

### Historia o ticket que ya lo cubre

US-5.2 cubre el historial; su tarea 5.2.3 y CA2 ya cubren aislamiento por paciente. SIG-BUG-02 corrige acentos. US-7.2/7.4/7.5 cubren autenticación y permisos, sin que este bloque pueda redefinirlos. [Historias de sprint 1](../../../../docs/user_stories_sprint_1.md).

**Para esta tarea:** Definición funcional de una ampliación de RF-18.

La cobertura encontrada es documental y local; no se consultó un tablero externo ni se afirma que esas historias estén terminadas.

### Qué es explícito y qué se estaba suponiendo

**Explícito en las fuentes:** La fuente pide definir campos, agregar nombre/apellido y ayuda y verificar separación de pacientes. El diseño propuesto muestra «Buscar por profesional, diagnóstico o tratamiento». RF-18 prohíbe entregar registros ajenos al paciente.

**Supuesto o propuesta del primer plan:** El código ya incluye seis campos, pero conservarlos como alcance aprobado fue una propuesta. Buscar en orden Nombre Apellido, insensibilidad a ñ y equivalencias adicionales no están definidos.

Las etiquetas de los criterios separan obligación explícita, interpretación pendiente y verificación técnica. Proponer tests, un helper o atributos accesibles no crea una regla de negocio nueva ni exige un acuerdo funcional sobre cada detalle técnico.

### Datos faltantes o contradictorios

El diseño/ayuda nombra tres campos; el código usa seis. Falta decisión sobre fecha, especialidad, indicaciones y nombres completos; no asumir que seis es lo requerido.

**Dudas abiertas relacionadas:** [DU-04](../REVISION.md#du-04), [DU-05](../REVISION.md#du-05), [DU-06](../REVISION.md#du-06), [DU-12](../REVISION.md#du-12). No hay respuestas registradas; no se adopta una opción como regla por defecto.

### Tratamiento de la duda y alcance seguro

Documentar matriz de alcance y preguntas. No borrar ni convertir campos actuales en exigencias definitivas.

Los criterios condicionados se cierran solo cuando se documenta la definición que falta. Pueden continuar diagnóstico y revisión del comportamiento explícito; las expectativas dudosas no se implementan ni se convierten en pruebas que fijen una regla inventada.

Al completar, registrar evidencia y resultado en este ticket. Para código, indicar commit y comprobaciones realizadas; para definiciones, registrar el acuerdo. No marcar como terminado únicamente por existir código relacionado.

