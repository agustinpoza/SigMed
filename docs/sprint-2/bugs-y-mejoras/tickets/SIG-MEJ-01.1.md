# SIG-MEJ-01.1 — Acordar con el cliente el rótulo del detalle del historial

| Campo | Valor |
| --- | --- |
| Sprint | 2 |
| Responsable | Usuario — Bugs y Mejoras |
| Tema padre | SIG-MEJ-01 |
| Tipo de tarea | Definición de texto |
| Prioridad propuesta | P2 |
| Estado inicial | Lista para preparar propuesta; cierre sujeto al cliente |
| Esfuerzo orientativo | 1 h |
| Predecesoras del plan de integración | Ninguna |

## Disponibilidad para arrancar

**Clasificación:** Tarea de definición, no de implementación.

**Alcance que puede avanzar:** Preparar alternativas de rótulo y registrar por qué representan el contenido.

**Dependencia o definición relevante:** Hace falta el acuerdo de texto de DU-02 para cerrar; la preparación puede empezar sin pedir permiso.

**Límite de esta clasificación:** No aplicar una alternativa como definitiva.

[Ver la clasificación de todos los tickets](../ARRANQUE.md). Esta sección no resuelve las dudas registradas ni modifica reglas de negocio; delimita el trabajo que puede empezar con lo ya definido.

## Precedencia y coordinación con otras US

**Predecesora o contrato:** Ninguna para preparar alternativas; acuerdo DU-02 para cerrar.

**US/tareas relacionadas:** SIG-MEJ-01.2 y US-5.1/5.2.

**Coordinación y cierre:** Definir texto del detalle existente; no prometer o agregar datos clínicos.

[Ver el orden del sprint y la matriz de integración](../../ORDEN-E-INTEGRACION.md). Compartir archivo no implica dependencia funcional; las pruebas base pueden empezar antes de repetirlas con las US nuevas.

## Fuente y situación actual

[Documento de análisis — sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md).

La columna se llama Acciones; el botón alterna Detalle/Cerrar y la expansión contiene Indicaciones. El documento indica que el texto definitivo está pendiente de aprobación.

La evidencia de código corresponde a una revisión estática. Las verificaciones indicadas abajo están planificadas, no ejecutadas.

## Objetivo

Obtener una denominación que describa las indicaciones, evitando confundirlas con la columna Diagnóstico ya existente.

## Trabajo y entregable

- Preparar propuesta: columna Indicaciones; botones Ver indicaciones/Ocultar indicaciones.
- Contrastar con Observaciones, Diagnóstico y Detalle clínico mencionados en el documento.
- Registrar en el ticket la elección de columna y ambos estados del botón, quién la valida y fecha del acuerdo.

## Criterios de aceptación

- [ ] **[Definición pendiente DU-02]** Se documentan los tres textos definitivos y su conformidad con lo que despliega la fila.
- [ ] **[Explícito en SIG-MEJ-01]** La aprobación del cliente queda registrada; una propuesta técnica por sí sola no cierra la tarea.
- [ ] **[Propuesta de claridad]** El rótulo no promete información clínica que el detalle actual no muestra.

## Validación prevista

Revisar la propuesta con la tabla y una atención con y sin indicaciones. La aprobación se registra aquí cuando exista; no se presume ni se envían mensajes al cliente como parte de este plan.

## Archivos a revisar

- [src/app/(portal)/paciente/historial/clinical-history-table.tsx](../../../../src/app/%28portal%29/paciente/historial/clinical-history-table.tsx)

## Límite de alcance

No modificar diagnóstico, tratamiento ni implementar el formulario de US-5.1.

## Revisión de requisitos, cobertura y dudas

Fecha: 13/10/2026. Esta revisión distingue reglas documentadas, propuestas de la fuente, implementación existente y supuestos del plan. Un dato observado en código no valida una regla de negocio.

### Requisito o regla correspondiente

RF-18 (consulta del historial). RF-17 define los datos que carga el médico, pero no el rótulo del detalle. La elección de texto y conservación de la expansión provienen de SIG-MEJ-01 en [Documento de sprint 2, sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md). [Requerimientos funcionales](../../../../docs/requerimientos_funcionales.md).

### Historia o ticket que ya lo cubre

US-5.2 ya cubre la vista. SIG-MEJ-01.1 obtiene la definición y SIG-MEJ-01.2 la aplica; US-5.1 no cubre este cambio de texto. [Historias de sprint 1](../../../../docs/user_stories_sprint_1.md).

**Para esta tarea:** Definición explícitamente pedida por la fuente, sin cobertura de texto definitivo en RF-18.

La cobertura encontrada es documental y local; no se consultó un tablero externo ni se afirma que esas historias estén terminadas.

### Qué es explícito y qué se estaba suponiendo

**Explícito en las fuentes:** El texto definitivo está pendiente de aprobación del cliente; debe mantenerse la visualización y ocultación de las indicaciones de la atención correcta.

**Supuesto o propuesta del primer plan:** Indicaciones y Ver/Ocultar indicaciones son propuestas del plan, no textos definitivos. La implementación muestra solo indicaciones en el detalle; eso no autoriza a descartar otras denominaciones del cliente.

Las etiquetas de los criterios separan obligación explícita, interpretación pendiente y verificación técnica. Proponer tests, un helper o atributos accesibles no crea una regla de negocio nueva ni exige un acuerdo funcional sobre cada detalle técnico.

### Datos faltantes o contradictorios

Faltan rótulo de columna, textos del botón y constancia de quién valida. «Diagnóstico» ya tiene otra columna en el código; es posible confusión, no prohibición documentada.

**Dudas abiertas relacionadas:** [DU-02](../REVISION.md#du-02), [DU-12](../REVISION.md#du-12). No hay respuestas registradas; no se adopta una opción como regla por defecto.

### Tratamiento de la duda y alcance seguro

Preparar alternativas; no decidir la denominación en lugar del cliente.

Los criterios condicionados se cierran solo cuando se documenta la definición que falta. Pueden continuar diagnóstico y revisión del comportamiento explícito; las expectativas dudosas no se implementan ni se convierten en pruebas que fijen una regla inventada.

Al completar, registrar evidencia y resultado en este ticket. Para código, indicar commit y comprobaciones realizadas; para definiciones, registrar el acuerdo. No marcar como terminado únicamente por existir código relacionado.

