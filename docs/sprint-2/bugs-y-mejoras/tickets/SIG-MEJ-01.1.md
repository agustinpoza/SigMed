# SIG-MEJ-01.1 — Acordar con el cliente el rótulo del detalle del historial

| Campo | Valor |
| --- | --- |
| Sprint | 2 |
| Responsable | Usuario — Bugs y Mejoras |
| Tema padre | SIG-MEJ-01 |
| Tipo de tarea | Definición de texto |
| Prioridad propuesta | P2 |
| Estado inicial | Lista para preparar propuesta; cierre sujeto al cliente |
| Estado actual | Alternativa provisoria registrada en DEC-004; aprobación definitiva pendiente |
| Esfuerzo orientativo | 1 h |
| Predecesoras del plan de integración | Ninguna |

## Avance provisorio de DU-02

Fecha: 14/10/2026. Por instrucción expresa del usuario, [DEC-004](../../../decisiones.md#dec-004--rótulo-provisorio-de-indicaciones-del-historial) registra «Indicaciones» como rótulo provisorio de columna y detalle. Los botones conservan «Detalle» / «Cerrar» en la misma constante `detailTexts`. La expansión sigue mostrando únicamente `record.indications`.

Esta autorización permite aplicar la alternativa mientras se obtiene la definición final; no es aprobación del cliente. Permanecen pendientes los tres textos definitivos y su constancia de conformidad. No se agregan Observaciones ni datos de US-5.1.

## Disponibilidad para arrancar

**Clasificación:** Alternativa provisoria documentada; acuerdo definitivo pendiente.

**Alcance que puede avanzar:** Registrar y aplicar la alternativa autorizada en DEC-004, contrastando el rótulo con las indicaciones existentes.

**Dependencia o definición relevante:** Hace falta el acuerdo de texto de DU-02 para cerrar; la preparación puede empezar sin pedir permiso.

**Límite de esta clasificación:** La alternativa aplicada sigue siendo provisoria; no cerrar la aprobación definitiva.

[Ver la clasificación de todos los tickets](../ARRANQUE.md). Esta sección no resuelve las dudas registradas ni modifica reglas de negocio; delimita el trabajo que puede empezar con lo ya definido.

## Precedencia y coordinación con otras US

**Predecesora o contrato:** Ninguna para preparar alternativas; acuerdo DU-02 para cerrar.

**US/tareas relacionadas:** SIG-MEJ-01.2 y US-5.1/5.2.

**Coordinación y cierre:** Definir texto del detalle existente; no prometer o agregar datos clínicos.

[Ver el orden del sprint y la matriz de integración](../../ORDEN-E-INTEGRACION.md). Compartir archivo no implica dependencia funcional; las pruebas base pueden empezar antes de repetirlas con las US nuevas.

## Fuente y situación actual

[Documento de análisis — sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md).

La revisión inicial encontró la columna Acciones, botones Detalle/Cerrar y una expansión con Indicaciones. DEC-004 cambia provisoriamente la columna a Indicaciones y centraliza sus textos; el documento mantiene pendiente la aprobación definitiva.

La situación inicial corresponde a una revisión estática. El avance provisorio y las verificaciones ejecutadas se registran en esta entrega; la aprobación del cliente sigue pendiente.

## Objetivo

Obtener una denominación que describa las indicaciones, evitando confundirlas con la columna Diagnóstico ya existente.

## Trabajo y entregable

- Preparar propuesta: columna Indicaciones; botones Ver indicaciones/Ocultar indicaciones.
- Contrastar con Observaciones, Diagnóstico y Detalle clínico mencionados en el documento.
- Registrar en el ticket la elección de columna y ambos estados del botón, quién la valida y fecha del acuerdo.

## Criterios de aceptación

- [ ] **[Definición pendiente DU-02]** Se documentan los tres textos definitivos y su conformidad con lo que despliega la fila.
- [ ] **[Explícito en SIG-MEJ-01]** La aprobación del cliente queda registrada; una propuesta técnica por sí sola no cierra la tarea.
- [x] **[Avance provisorio DEC-004]** «Indicaciones» y los botones existentes quedan documentados y centralizados; se distingue la autorización provisoria de la aprobación definitiva.
- [x] **[Propuesta de claridad]** El rótulo provisorio describe `record.indications`, sin prometer otros datos clínicos.

## Validación prevista

El rótulo provisorio corresponde al campo mostrado en la expansión. Las 39 regresiones existentes del historial pasan, incluyendo abrir/cerrar y el caso sin indicaciones. Typecheck aprobado; lint sin errores, con la advertencia preexistente de `aria-expanded` en vacunación. [Detalle de verificación técnica](SIG-MEJ-01.2.md#validación-realizada-y-pendiente).

La aprobación definitiva se registra cuando exista; no se presume ni se envían mensajes al cliente como parte de este plan.

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

Faltan el rótulo y los textos definitivos, y constancia de quién los valida. DEC-004 registra solo la alternativa provisoria autorizada. «Diagnóstico» ya tiene otra columna en el código; es posible confusión, no prohibición documentada.

**Dudas abiertas relacionadas:** [DU-02](../REVISION.md#du-02) mantiene la aprobación definitiva pendiente, con avance provisorio en DEC-004; [DU-12](../REVISION.md#du-12) conserva la jerarquía general pendiente.

### Tratamiento de la duda y alcance seguro

Aplicar la alternativa provisoria autorizada por el usuario y registrar expresamente su carácter temporal. La denominación definitiva sigue sujeta al acuerdo del cliente.

Los criterios condicionados se cierran solo cuando se documenta la definición que falta. Pueden continuar diagnóstico y revisión del comportamiento explícito; las expectativas dudosas no se implementan ni se convierten en pruebas que fijen una regla inventada.

Al completar, registrar evidencia y resultado en este ticket. Para código, indicar commit y comprobaciones realizadas; para definiciones, registrar el acuerdo. No marcar como terminado únicamente por existir código relacionado.

