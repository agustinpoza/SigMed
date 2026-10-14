# SIG-BUG-02.2 — Normalizar acentos en la consulta y en el contenido del historial

| Campo | Valor |
| --- | --- |
| Sprint | 2 |
| Responsable | Usuario — Bugs y Mejoras |
| Tema padre | SIG-BUG-02 |
| Tipo de tarea | Corrección de búsqueda |
| Prioridad propuesta | P1 |
| Estado inicial | Pendiente de reproducción y política de normalización |
| Estado actual | Implementado y verificado con 39 regresiones del componente |
| Esfuerzo orientativo | 2 h |
| Predecesoras del plan de integración | [SIG-BUG-02.1](SIG-BUG-02.1.md) |

## Implementación y verificación

Fecha: 14/10/2026. Base: `9837f80`. Se aplica el [diagnóstico de SIG-BUG-02.1](SIG-BUG-02.1.md) y la definición [DEC-002](../../../decisiones.md#dec-002--normalización-de-la-búsqueda-del-historial).

`createHistorySearchMatcher` normaliza consulta y campos existentes con NFD, elimina diacríticos y pasa a minúsculas. Espacios/comas separan términos; todos deben coincidir en una misma atención. Se conserva el texto original, el envío del formulario, filtros, orden y reinicio de paginación. No hay consultas o campos nuevos.

Pasaron 39 regresiones del componente. [Ver cambios, evidencia y límites](../SIG-BUG-02-IMPLEMENTACION.md).

## Disponibilidad para arrancar

**Clasificación:** Implementación completada con la definición registrada en DEC-002.

**Alcance implementado:** Normalización compartida y coincidencia de términos en los campos existentes del historial.

**Dependencia o definición relevante:** Diagnóstico completado y DU-03/DU-04 definidas. Se conserva el alcance de campos; matriz y ayuda se coordinan con SIG-MEJ-02.

**Límite de esta clasificación:** No elegir un algoritmo que fije una regla lingüística no definida solo para poder terminar el ticket.

[Ver la clasificación de todos los tickets](../ARRANQUE.md). Esta sección no resuelve las dudas registradas ni modifica reglas de negocio; delimita el trabajo que puede empezar con lo ya definido.

## Precedencia y coordinación con otras US

**Predecesora o contrato:** SIG-BUG-02.1 y definiciones aplicables DU-03/DU-04.

**US/tareas relacionadas:** SIG-MEJ-02.1/02.2 y US-5.1.

**Coordinación y cierre:** Una sola normalización; campos/ayuda pertenecen a SIG-MEJ-02. Coordinar el archivo, no absorber búsqueda de turnos de US-2.1.

[Ver el orden del sprint y la matriz de integración](../../ORDEN-E-INTEGRACION.md). Compartir archivo no implica dependencia funcional; las pruebas base pueden empezar antes de repetirlas con las US nuevas.

## Fuente y situación actual

[Documento de análisis — sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md).

searchableText y searchTerm utilizan toLocaleLowerCase(es-AR) por separado. Ambos lados necesitan la misma normalización.

La situación anterior describe el filtro original. La implementación y las pruebas ejecutadas están registradas arriba.

## Objetivo

Encontrar una atención sin exigir escribir las tildes, manteniendo los textos originales visibles.

## Trabajo y entregable

- Aplicar una función común a consulta y campos buscables según la política acordada.
- Mantener coincidencia parcial, minúsculas, trim, filtros y reinicio de página.
- No ampliar ni reducir campos a partir de una suposición. Resolver el alcance en SIG-MEJ-02.1; las equivalencias no definidas quedan pendientes.

## Criterios de aceptación

- [x] **[DU-03; DEC-002]** infeccion/infección/INFECCIÓN encuentran las mismas atenciones; la consulta y fixture se registran en SIG-BUG-02.1.
- [x] **[DU-04; campo existente]** Martín/Martin y ambos órdenes del nombre encuentran la misma atención.
- [x] **[Preservación; DEC-002]** No se alteran los textos mostrados ni los registros de entrada; ñ y Unicode siguen la política documentada.
- [x] **[Preservación]** Una búsqueda vacía vuelve a los resultados admitidos por el filtro activo.

## Validación prevista

Verificar los ejemplos de SIG-BUG-02.1 y coordinar su automatización con SIG-BUG-02.3. Ejecutar lint y typecheck.

## Archivos a revisar

- [src/app/(portal)/paciente/historial/clinical-history-table.tsx](../../../../src/app/%28portal%29/paciente/historial/clinical-history-table.tsx)
- [src/lib/clinical-history-search.ts](../../../../src/lib/clinical-history-search.ts)

## Límite de alcance

No mover la búsqueda a otro paciente ni implementar carga clínica (US-5.1).

## Revisión de requisitos, cobertura y dudas

Fecha: 13/10/2026. Esta revisión distingue reglas documentadas, propuestas de la fuente, implementación existente y supuestos del plan. Un dato observado en código no valida una regla de negocio.

### Requisito o regla correspondiente

RF-18 aporta el contexto, pero no especifica reglas de búsqueda por acentos. La normalización y mayúsculas provienen de SIG-BUG-02 en [Documento de sprint 2, sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md); hay un ejemplo ambiguo entre descripción y CA1. [Requerimientos funcionales](../../../../docs/requerimientos_funcionales.md).

### Historia o ticket que ya lo cubre

US-5.2 ya cubre consulta del historial y contiene un buscador en el diseño sin política de equivalencia. SIG-MEJ-02 define campos/ayuda; no duplicar esa mejora aquí. [Historias de sprint 1](../../../../docs/user_stories_sprint_1.md).

**Para esta tarea:** Normalización del caso que se confirme en SIG-BUG-02.1.

La cobertura encontrada es documental y local; no se consultó un tablero externo ni se afirma que esas historias estén terminadas.

### Qué es explícito y qué se estaba suponiendo

**Explícito en las fuentes:** La fuente pide reproducir el posible fallo con tildes, normalizar acentos y agregar regresiones; exige insensibilidad a mayúsculas. El bug todavía requiere reproducción.

**Supuesto o propuesta del primer plan:** Se interpretó el caso como infeccion → Infección, aunque la fuente escribe «infección» al describir una búsqueda sin tilde. El comportamiento de ñ/n, diéresis, nombres completos, coincidencia parcial y vacío no queda especificado por ese CA.

Las etiquetas de los criterios separan obligación explícita, interpretación pendiente y verificación técnica. Proponer tests, un helper o atributos accesibles no crea una regla de negocio nueva ni exige un acuerdo funcional sobre cada detalle técnico.

### Datos faltantes o contradictorios

La política aplicable está en DEC-002. Se normalizan los seis campos ya existentes sin agregar ni quitar campos; la matriz y ayuda de SIG-MEJ-02 no se dan por entregadas.

**Dudas relacionadas:** [DU-03](../REVISION.md#du-03) y [DU-04](../REVISION.md#du-04), definidas mediante DEC-002. [DU-05](../REVISION.md#du-05) conserva la matriz/ayuda pendiente; [DU-12](../REVISION.md#du-12), la jerarquía general. Se mantiene aislamiento y alcance de campos.

### Tratamiento de la duda y alcance seguro

La implementación se limita al contrato documentado en DEC-002 y a la preservación de los campos y filtros existentes.

Los criterios condicionados se cierran solo cuando se documenta la definición que falta. Pueden continuar diagnóstico y revisión del comportamiento explícito; las expectativas dudosas no se implementan ni se convierten en pruebas que fijen una regla inventada.

Al completar, registrar evidencia y resultado en este ticket. Para código, indicar commit y comprobaciones realizadas; para definiciones, registrar el acuerdo. No marcar como terminado únicamente por existir código relacionado.

