# SIG-MEJ-02.2 — Completar la búsqueda por profesional y publicar su texto de ayuda

| Campo | Valor |
| --- | --- |
| Sprint | 2 |
| Responsable | Usuario — Bugs y Mejoras |
| Tema padre | SIG-MEJ-02 |
| Tipo de tarea | Mejora de búsqueda y ayuda |
| Prioridad propuesta | P2 |
| Estado inicial | Pendiente de definición; soporte básico existente |
| Estado actual | Implementado y verificado; ayuda visible y accesible, matcher existente reutilizado |
| Esfuerzo orientativo | 2 h |
| Predecesoras del plan de integración | [SIG-MEJ-02.1](SIG-MEJ-02.1.md), [SIG-BUG-02.2](SIG-BUG-02.2.md) |

## Implementación y verificación

Fecha: 14/10/2026. Base: `5e1ef9e`. Se aplica la [matriz de SIG-MEJ-02.1](SIG-MEJ-02.1.md#matriz-de-campos-y-ejemplos) y [DEC-003](../../../decisiones.md#dec-003--campos-y-ayuda-de-búsqueda-del-historial).

La ayuda enumera profesional, especialidad, diagnóstico, tratamiento, indicaciones y fecha `dd/mm/aaaa`. Se guarda en una constante y se muestra bajo el input, asociado por `aria-describedby`; input y botón conservan su fila y envío con Enter. Nombre/apellido y ambos órdenes reutilizan el matcher de SIG-BUG-02, sin otro filtro ni datos nuevos.

Pasaron las 39 regresiones existentes del historial. Chrome verificó ayuda visible, descripción accesible y 27 búsquedas con teclado a 360/768/1280 px. [Ver capturas, comandos y límites](../SIG-MEJ-02-IMPLEMENTACION.md).

## Disponibilidad para arrancar

**Clasificación:** Implementación completada con la definición de SIG-MEJ-02.1/DEC-003.

**Alcance implementado:** Ayuda visible/accesible de los seis campos actuales; reutilización de búsqueda por profesional normalizada.

**Dependencia o definición relevante:** SIG-MEJ-02.1 y las equivalencias relevantes de SIG-BUG-02.2: campos, ayuda y comportamiento por profesional.

**Límite de esta clasificación:** No se amplían campos ni consultas; no se implementan permisos o aislamiento del servidor en este ticket.

[Ver la clasificación de todos los tickets](../ARRANQUE.md). Esta sección no resuelve las dudas registradas ni modifica reglas de negocio; delimita el trabajo que puede empezar con lo ya definido.

## Precedencia y coordinación con otras US

**Predecesora o contrato:** SIG-MEJ-02.1; SIG-BUG-02.2 para integrar equivalencias acordadas.

**US/tareas relacionadas:** SIG-MEJ-01.2, SIG-BUG-02.3 y US-5.1.

**Coordinación y cierre:** Ayuda/campos aquí, equivalencias en el bug. Rótulos comparten archivo pero no bloquean la función. Verificar con contrato de datos del historial.

[Ver el orden del sprint y la matriz de integración](../../ORDEN-E-INTEGRACION.md). Compartir archivo no implica dependencia funcional; las pruebas base pueden empezar antes de repetirlas con las US nuevas.

## Fuente y situación actual

[Documento de análisis — sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md).

record.doctor ya se incluye en el filtro y se construye como Apellido, Nombre. Hay un label sr-only, pero no ayuda visible bajo el buscador.

La situación anterior describe el componente previo. La implementación y sus verificaciones están registradas arriba.

## Objetivo

Hacer comprensible la búsqueda y completar solo las diferencias respecto del alcance aprobado.

## Trabajo y entregable

- Agregar ayuda visible asociada al input mediante aria-describedby.
- Reutilizar nombre/apellido existentes; ajustar nombre completo solo si SIG-MEJ-02.1 lo acordó.
- Reutilizar normalización de SIG-BUG-02.2; mantener filtros y paginación.

## Criterios de aceptación

- [x] **[DEC-003]** La ayuda visible describe los seis campos y queda asociada al input; Chrome expone el mismo texto como descripción accesible.
- [x] **[DEC-002/003]** Las consultas por nombre, apellido y ambos órdenes definidas en la matriz encuentran la atención correspondiente.
- [x] **[Reutilización]** El nombre mostrado conserva Apellido, Nombre y la búsqueda usa el matcher existente de SIG-BUG-02.
- [x] **[RF-18; preservación estática]** No se modifica la consulta/filtro por paciente ni los registros de entrada. Las pruebas de aislamiento real del servidor permanecen en SIG-MEJ-02.3.

## Validación prevista

Verificación por nombres, apellidos, diagnóstico y tratamiento; revisar ayuda con teclado. Reutilizar regresiones de SIG-BUG-02.3. Ejecutar lint y typecheck.

## Archivos a revisar

- [src/app/(portal)/paciente/historial/clinical-history-table.tsx](../../../../src/app/%28portal%29/paciente/historial/clinical-history-table.tsx)
- [src/app/(portal)/paciente/historial/page.tsx](../../../../src/app/%28portal%29/paciente/historial/page.tsx)

## Límite de alcance

No implementar autenticación, asignación de roles ni una consulta global de historias clínicas.

## Revisión de requisitos, cobertura y dudas

Fecha: 13/10/2026. Esta revisión distingue reglas documentadas, propuestas de la fuente, implementación existente y supuestos del plan. Un dato observado en código no valida una regla de negocio.

### Requisito o regla correspondiente

RF-18 exige consulta del historial propio; no define la ampliación por profesional. SIG-MEJ-02 de [Documento de sprint 2, sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md) propone esa ampliación y la condiciona a definición/aprobación. RNF-04 aporta autenticación y permisos. [Requerimientos funcionales](../../../../docs/requerimientos_funcionales.md); [Requerimientos no funcionales](../../../../docs/requerimientos_no_funcionales.md).

### Historia o ticket que ya lo cubre

US-5.2 cubre el historial; su tarea 5.2.3 y CA2 ya cubren aislamiento por paciente. SIG-BUG-02 corrige acentos. US-7.2/7.4/7.5 cubren autenticación y permisos, sin que este bloque pueda redefinirlos. [Historias de sprint 1](../../../../docs/user_stories_sprint_1.md).

**Para esta tarea:** Ajuste sobre soporte por profesional ya existente.

La cobertura encontrada es documental y local; no se consultó un tablero externo ni se afirma que esas historias estén terminadas.

### Qué es explícito y qué se estaba suponiendo

**Explícito en las fuentes:** La fuente pide definir campos, agregar nombre/apellido y ayuda y verificar separación de pacientes. El diseño propuesto muestra «Buscar por profesional, diagnóstico o tratamiento». RF-18 prohíbe entregar registros ajenos al paciente.

**Supuesto o propuesta del primer plan:** El código ya incluye seis campos, pero conservarlos como alcance aprobado fue una propuesta. Buscar en orden Nombre Apellido, insensibilidad a ñ y equivalencias adicionales no están definidos.

Las etiquetas de los criterios separan obligación explícita, interpretación pendiente y verificación técnica. Proponer tests, un helper o atributos accesibles no crea una regla de negocio nueva ni exige un acuerdo funcional sobre cada detalle técnico.

### Datos faltantes o contradictorios

SIG-BUG-02 reprodujo la diferencia Martín/Martin y entregó su corrección. Esta entrega verifica las consultas de la matriz con fixtures. Las condiciones históricas del despliegue original siguen desconocidas; no se presentan como reproducción de ese despliegue.

**Dudas relacionadas:** [DU-04](../REVISION.md#du-04) y [DU-05](../REVISION.md#du-05), definidas mediante DEC-002/003. [DU-06](../REVISION.md#du-06) conserva permisos administrativos en US-7.5; [DU-12](../REVISION.md#du-12), la jerarquía general. No se presumen nuevas autorizaciones.

### Tratamiento de la duda y alcance seguro

Agregar solo diferencias del alcance definido; normalización en SIG-BUG-02.2 y ayuda aquí, sin dos implementaciones.

Los criterios condicionados se cierran solo cuando se documenta la definición que falta. Pueden continuar diagnóstico y revisión del comportamiento explícito; las expectativas dudosas no se implementan ni se convierten en pruebas que fijen una regla inventada.

Al completar, registrar evidencia y resultado en este ticket. Para código, indicar commit y comprobaciones realizadas; para definiciones, registrar el acuerdo. No marcar como terminado únicamente por existir código relacionado.

