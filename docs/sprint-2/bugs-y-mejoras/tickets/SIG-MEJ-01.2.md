# SIG-MEJ-01.2 — Actualizar el encabezado y el botón del historial sin alterar la expansión

| Campo | Valor |
| --- | --- |
| Sprint | 2 |
| Responsable | Usuario — Bugs y Mejoras |
| Tema padre | SIG-MEJ-01 |
| Tipo de tarea | Mejora de texto en interfaz |
| Prioridad propuesta | P2 |
| Estado inicial | Pendiente de rótulo acordado |
| Estado actual | Rótulo provisorio aplicado mediante constante; conformidad definitiva pendiente |
| Esfuerzo orientativo | 1 h |
| Predecesoras del plan de integración | [SIG-MEJ-01.1](SIG-MEJ-01.1.md) |

## Implementación provisoria de DU-02

Fecha: 14/10/2026. [DEC-004](../../../decisiones.md#dec-004--rótulo-provisorio-de-indicaciones-del-historial) registra la autorización expresa del usuario para avanzar provisoriamente. `detailTexts` centraliza «Indicaciones» para encabezado y título del detalle, conservando los textos existentes «Detalle» / «Cerrar».

Se conserva la expansión de `record.indications` por ID de atención, el mensaje cuando no hay indicaciones y los atributos `aria-expanded` / `aria-controls`. Esta entrega no declara textos aprobados ni cierra DU-02.

## Disponibilidad para arrancar

**Clasificación:** Implementación provisoria autorizada y aplicada; aprobación definitiva pendiente.

**Alcance que puede avanzar:** Usar «Indicaciones» provisoriamente desde la constante según DEC-004, conservando Detalle/Cerrar hasta la definición final.

**Dependencia o definición relevante:** DEC-004 permite el avance provisorio; SIG-MEJ-01.1 / DU-02 mantienen pendiente el acuerdo definitivo de textos.

**Límite de esta clasificación:** La autorización temporal no demuestra aprobación del cliente ni permite cerrar el criterio definitivo.

[Ver la clasificación de todos los tickets](../ARRANQUE.md). Esta sección no resuelve las dudas registradas ni modifica reglas de negocio; delimita el trabajo que puede empezar con lo ya definido.

## Precedencia y coordinación con otras US

**Predecesora o contrato:** DEC-004 para el avance provisorio; acuerdo de SIG-MEJ-01.1 para la conformidad definitiva.

**US/tareas relacionadas:** SIG-BUG-02.2, SIG-MEJ-02.2 y US-5.1.

**Coordinación y cierre:** Comparte clinical-history-table.tsx con búsqueda, pero no depende funcionalmente de ella. Coordinar merges y verificar expansión con datos integrados.

[Ver el orden del sprint y la matriz de integración](../../ORDEN-E-INTEGRACION.md). Compartir archivo no implica dependencia funcional; las pruebas base pueden empezar antes de repetirlas con las US nuevas.

## Fuente y situación actual

[Documento de análisis — sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md).

El detalle está enlazado por record.id y usa aria-expanded y aria-controls. El contenido expandido corresponde a record.indications.

La situación inicial corresponde a una revisión estática. Las regresiones y comprobaciones de la alternativa provisoria ya se ejecutaron, según la validación registrada abajo.

## Objetivo

Aplicar la alternativa provisoria autorizada manteniendo el detalle de cada atención; incorporar los textos definitivos cuando exista su aprobación.

## Trabajo y entregable

- Cambiar encabezado y los textos de abrir/cerrar según SIG-MEJ-01.1.
- Conservar identificación de fila, atributos accesibles y mensaje cuando no hay indicaciones.
- Verificar filtros y paginación sin introducir cambios funcionales.

## Criterios de aceptación

- [ ] **[Condicionado a DU-02]** Los textos coinciden con el acuerdo del cliente.
- [x] **[Avance provisorio DEC-004]** Encabezado y título usan «Indicaciones» desde una constante de textos, con aprobación definitiva expresamente pendiente.
- [x] **[Explícito en SIG-MEJ-01; regresión existente]** Abrir y cerrar muestra y oculta las indicaciones de la atención filtrada, sin modificar los datos de entrada.
- [ ] **[Preservación técnica]** Una atención sin indicaciones mantiene su mensaje y el botón sigue siendo accesible con teclado.

## Validación realizada y pendiente

- `npm.cmd run test:history`: **39 pruebas existentes aprobadas**, incluidas expansión/cierre, atención sin indicaciones, filtros, orden y paginación. No se agregaron tests que solo repliquen los textos provisorios.
- `npm.cmd run typecheck`: aprobado.
- `npm.cmd run lint`: sin errores; advertencia preexistente de `aria-expanded` en vacunación.
- `git diff --check`: aprobado.

El botón nativo, `type="button"`, `aria-expanded`, `aria-controls` y el estilo de foco no cambian. El caso sin indicaciones está cubierto por la suite; la comprobación manual con teclado permanece pendiente y no se declara ejecutada con Vitest. La conformidad con los textos definitivos sigue pendiente de DU-02.

## Archivos a revisar

- [src/app/(portal)/paciente/historial/clinical-history-table.tsx](../../../../src/app/%28portal%29/paciente/historial/clinical-history-table.tsx)

## Límite de alcance

No agregar nuevos campos clínicos ni cambiar la búsqueda.

## Revisión de requisitos, cobertura y dudas

Fecha: 13/10/2026. Esta revisión distingue reglas documentadas, propuestas de la fuente, implementación existente y supuestos del plan. Un dato observado en código no valida una regla de negocio.

### Requisito o regla correspondiente

RF-18 (consulta del historial). RF-17 define los datos que carga el médico, pero no el rótulo del detalle. La elección de texto y conservación de la expansión provienen de SIG-MEJ-01 en [Documento de sprint 2, sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md). [Requerimientos funcionales](../../../../docs/requerimientos_funcionales.md).

### Historia o ticket que ya lo cubre

US-5.2 ya cubre la vista. SIG-MEJ-01.1 obtiene la definición y SIG-MEJ-01.2 la aplica; US-5.1 no cubre este cambio de texto. [Historias de sprint 1](../../../../docs/user_stories_sprint_1.md).

**Para esta tarea:** Aplicación de un acuerdo, no ampliación clínica de US-5.1.

La cobertura encontrada es documental y local; no se consultó un tablero externo ni se afirma que esas historias estén terminadas.

### Qué es explícito y qué se estaba suponiendo

**Explícito en las fuentes:** El texto definitivo está pendiente de aprobación del cliente; debe mantenerse la visualización y ocultación de las indicaciones de la atención correcta.

**Supuesto o propuesta del primer plan:** Indicaciones y Ver/Ocultar indicaciones son propuestas del plan, no textos definitivos. La implementación muestra solo indicaciones en el detalle; eso no autoriza a descartar otras denominaciones del cliente.

Las etiquetas de los criterios separan obligación explícita, interpretación pendiente y verificación técnica. Proponer tests, un helper o atributos accesibles no crea una regla de negocio nueva ni exige un acuerdo funcional sobre cada detalle técnico.

### Datos faltantes o contradictorios

Los textos provisorios de DEC-004 no se convierten en criterios definitivos antes de resolver SIG-MEJ-01.1.

**Dudas abiertas relacionadas:** [DU-02](../REVISION.md#du-02) mantiene pendiente la aprobación definitiva pese al avance provisorio autorizado; [DU-12](../REVISION.md#du-12) conserva la jerarquía general pendiente.

### Tratamiento de la duda y alcance seguro

Aplicar la alternativa temporal registrada en DEC-004; esperar el acuerdo para fijar los textos definitivos. No agregar observaciones o diagnósticos nuevos al detalle.

Los criterios condicionados se cierran solo cuando se documenta la definición que falta. Pueden continuar diagnóstico y revisión del comportamiento explícito; las expectativas dudosas no se implementan ni se convierten en pruebas que fijen una regla inventada.

Al completar, registrar evidencia y resultado en este ticket. Para código, indicar commit y comprobaciones realizadas; para definiciones, registrar el acuerdo. No marcar como terminado únicamente por existir código relacionado.

