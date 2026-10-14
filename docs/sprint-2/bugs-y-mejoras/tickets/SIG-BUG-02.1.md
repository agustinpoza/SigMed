# SIG-BUG-02.1 — Reproducir y delimitar el fallo de búsqueda por tildes

| Campo | Valor |
| --- | --- |
| Sprint | 2 |
| Responsable | Usuario — Bugs y Mejoras |
| Tema padre | SIG-BUG-02 |
| Tipo de tarea | Verificación de bug funcional |
| Prioridad propuesta | P1 |
| Estado inicial | Lista para iniciar; bug pendiente de reproducción |
| Estado actual | Diagnóstico completado; fallo reproducido en el componente real con fixtures |
| Esfuerzo orientativo | 1 h |
| Predecesoras del plan de integración | Ninguna |

## Diagnóstico y definición completados

Fecha: 14/10/2026. Base: `9837f80`. [DEC-002](../../../decisiones.md#dec-002--normalización-de-la-búsqueda-del-historial) registra los criterios DU-03/DU-04 propuestos por el usuario y aplicados por esta solicitud.

La suite final de 39 casos ejecutada contra una copia aislada del componente original da 18 aprobados y 21 fallidos. `infeccion` no encuentra `Infección respiratoria alta`; `alta` y `ALTA` sí la encuentran. `Martín` funciona en el campo profesional existente, mientras que `Martin` falla por el acento. Unicode compuesto/descompuesto y nombres en distinto orden también divergen.

La corrección usa NFD, eliminación de diacríticos, minúsculas y términos separados por espacios/comas, todos dentro de una misma atención; ñ/n y diéresis tienen equivalencia explícita en DEC-002. [Ver datos, resultados y límites](../SIG-BUG-02-IMPLEMENTACION.md).

## Disponibilidad para arrancar

**Clasificación:** Diagnóstico completado; habilita SIG-BUG-02.2.

**Alcance que puede avanzar:** Probar cadenas con/sin tilde y mayúsculas con datos controlados; documentar resultado actual y la inconsistencia del ejemplo.

**Dependencia o definición relevante:** DU-03/DU-04 se registran en DEC-002. No se agregan campos; la matriz y ayuda siguen en SIG-MEJ-02.

**Límite de esta clasificación:** La reproducción es local con fixtures; no identifica la consulta histórica del despliegue ni certifica autenticación.

[Ver la clasificación de todos los tickets](../ARRANQUE.md). Esta sección no resuelve las dudas registradas ni modifica reglas de negocio; delimita el trabajo que puede empezar con lo ya definido.

## Precedencia y coordinación con otras US

**Predecesora o contrato:** Ninguna para reproducir variantes.

**US/tareas relacionadas:** SIG-MEJ-02.1, US-5.1 y US-5.2 existente.

**Coordinación y cierre:** Distinguir acentos de campos buscables. Investigar con datos ficticios existentes sin esperar la nueva carga clínica.

[Ver el orden del sprint y la matriz de integración](../../ORDEN-E-INTEGRACION.md). Compartir archivo no implica dependencia funcional; las pruebas base pueden empezar antes de repetirlas con las US nuevas.

## Fuente y situación actual

[Documento de análisis — sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md).

La búsqueda convierte texto y consulta a minúsculas, pero no normaliza acentos. Por inspección, infeccion no coincide con Infección. El documento llama al caso posible bug y su CA1 repite infección con tilde; la descripción aclara el caso sin tilde.

La descripción anterior conserva la situación inicial. La reproducción ejecutada está registrada arriba y en la evidencia de implementación.

## Objetivo

Confirmar la diferencia entre búsqueda con/sin tilde y definir una regresión reproducible.

## Trabajo y entregable

- Preparar registros ficticios con diagnóstico Infección respiratoria alta y profesional Martín Gómez.
- Comparar infección/infeccion/INFECCIÓN/INFECCION y alta/ALTA, junto con filtros y paginación.
- Registrar las equivalencias y la búsqueda por términos definidas en DEC-002, conservando los campos existentes.

## Criterios de aceptación

- [x] **[DU-03; reproducción local]** Se registra resultado esperado/actual del caso sin tilde y de los controles que ya funcionan.
- [x] **[Separación de alcance]** Se distingue el fallo por acentos de la existencia del campo profesional; no se implementa la ayuda de SIG-MEJ-02.
- [x] **[DU-04; DEC-002]** Queda definida la política sobre ñ/n, diéresis, Unicode compuesto/descompuesto y términos en cualquier orden.

## Validación prevista

Reproducción local con datos ficticios o fixture del componente. La inspección del código no se presenta como una prueba de navegador ya ejecutada.

## Archivos a revisar

- [src/app/(portal)/paciente/historial/clinical-history-table.tsx](../../../../src/app/%28portal%29/paciente/historial/clinical-history-table.tsx)

## Límite de alcance

No ampliar campos de búsqueda en este ticket ni tratar el caso Martín como falta de soporte del profesional.

## Revisión de requisitos, cobertura y dudas

Fecha: 13/10/2026. Esta revisión distingue reglas documentadas, propuestas de la fuente, implementación existente y supuestos del plan. Un dato observado en código no valida una regla de negocio.

### Requisito o regla correspondiente

RF-18 aporta el contexto, pero no especifica reglas de búsqueda por acentos. La normalización y mayúsculas provienen de SIG-BUG-02 en [Documento de sprint 2, sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md); hay un ejemplo ambiguo entre descripción y CA1. [Requerimientos funcionales](../../../../docs/requerimientos_funcionales.md).

### Historia o ticket que ya lo cubre

US-5.2 ya cubre consulta del historial y contiene un buscador en el diseño sin política de equivalencia. SIG-MEJ-02 define campos/ayuda; no duplicar esa mejora aquí. [Historias de sprint 1](../../../../docs/user_stories_sprint_1.md).

**Para esta tarea:** Investigación del caso ambiguo de la fuente.

La cobertura encontrada es documental y local; no se consultó un tablero externo ni se afirma que esas historias estén terminadas.

### Qué es explícito y qué se estaba suponiendo

**Explícito en las fuentes:** La fuente pide reproducir el posible fallo con tildes, normalizar acentos y agregar regresiones; exige insensibilidad a mayúsculas. El bug todavía requiere reproducción.

**Supuesto o propuesta del primer plan:** Se interpretó el caso como infeccion → Infección, aunque la fuente escribe «infección» al describir una búsqueda sin tilde. El comportamiento de ñ/n, diéresis, nombres completos, coincidencia parcial y vacío no queda especificado por ese CA.

Las etiquetas de los criterios separan obligación explícita, interpretación pendiente y verificación técnica. Proponer tests, un helper o atributos accesibles no crea una regla de negocio nueva ni exige un acuerdo funcional sobre cada detalle técnico.

### Datos faltantes o contradictorios

El término sin tilde se representó en el plan como infeccion, por interpretación. Es necesario registrar la consulta exacta, datos y resultado real.

**Dudas relacionadas:** [DU-03](../REVISION.md#du-03) y [DU-04](../REVISION.md#du-04), definidas para este bug mediante DEC-002. [DU-05](../REVISION.md#du-05) conserva la matriz/ayuda de SIG-MEJ-02 pendiente de entrega; [DU-12](../REVISION.md#du-12) mantiene pendiente la jerarquía general. Ninguna implica ampliar campos o permisos aquí.

### Tratamiento de la duda y alcance seguro

Se documenta la reproducción contra el componente original y la definición explícita de DEC-002; no se adopta una regla a partir del código existente.

Los criterios condicionados se cierran solo cuando se documenta la definición que falta. Pueden continuar diagnóstico y revisión del comportamiento explícito; las expectativas dudosas no se implementan ni se convierten en pruebas que fijen una regla inventada.

Al completar, registrar evidencia y resultado en este ticket. Para código, indicar commit y comprobaciones realizadas; para definiciones, registrar el acuerdo. No marcar como terminado únicamente por existir código relacionado.

