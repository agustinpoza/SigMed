# SIG-MEJ-02.1 — Definir el alcance de campos buscables del historial

| Campo | Valor |
| --- | --- |
| Sprint | 2 |
| Responsable | Usuario — Bugs y Mejoras |
| Tema padre | SIG-MEJ-02 |
| Tipo de tarea | Definición de mejora funcional |
| Prioridad propuesta | P2 |
| Estado inicial | Lista para preparar definición; aprobación funcional pendiente |
| Estado actual | Completado; matriz y alcance registrados en DEC-003 |
| Esfuerzo orientativo | 1 h |
| Predecesoras del plan de integración | Ninguna |

## Definición entregada

Fecha: 14/10/2026. Base: `5e1ef9e`. El criterio DU-05 del usuario y esta solicitud de implementación definen conservar los seis campos y enumerarlos en la ayuda. [DEC-003](../../../decisiones.md#dec-003--campos-y-ayuda-de-búsqueda-del-historial) registra fuente, responsable y fecha; no se presume aprobación externa.

### Matriz de campos y ejemplos

Los ejemplos usan las atenciones ficticias de las regresiones de SIG-BUG-02 y de la comprobación de navegador. Cada consulta encuentra la atención correspondiente; todos los términos se evalúan dentro de una misma atención según DEC-002.

| Campo | Fuente existente | Ejemplo visible | Consultas verificadas | Cobertura/diferencia |
| --- | --- | --- | --- | --- |
| Profesional | `record.doctor`: apellido y nombre del perfil del médico | Gómez, Martín | `Martin`, `Gomez`, `Martin Gomez`, `Gomez, Martin` | Campo ya existente; normalización/ambos órdenes entregados en SIG-BUG-02. |
| Especialidad | `record.specialty`: nombre visible de la especialidad | Clínica médica | `clinica` | Campo existente conservado; ahora se enumera en la ayuda. |
| Diagnóstico | `record.diagnosis` | Infección respiratoria alta | `infeccion` | Campo existente; acentos corregidos en SIG-BUG-02. |
| Tratamiento | `record.treatment`, opcional | Reposo | `reposo` | Campo existente conservado; un valor nulo no agrega texto buscable. |
| Indicaciones | `record.indications`, opcional | Control en 72 horas | `control`, `72` | Campo existente, incluso cuando el detalle está cerrado; se enumera en la ayuda. |
| Fecha | `record.date`: asistencia si existe, o inicio del turno; formato visible es-AR y zona Buenos Aires | 14/10/2026 | `14/10/2026` | Campo existente; se busca la fecha mostrada y se explicita `dd/mm/aaaa`. |

**Ayuda definida:** «Buscar por profesional (nombre o apellido), especialidad, diagnóstico, tratamiento, indicaciones o fecha (dd/mm/aaaa).» El diseño proponía tres campos; se incluyen los seis por el criterio explícito del usuario, no por deducir aprobación del código.

**Separación de tareas:** esta matriz define alcance/ejemplos; SIG-MEJ-02.2 publica la ayuda; SIG-BUG-02 aporta el matcher compartido; SIG-MEJ-02.3 verifica aislamiento. [Ver evidencia y límites de la entrega](../SIG-MEJ-02-IMPLEMENTACION.md).

## Disponibilidad para arrancar

**Clasificación:** Definición completada; habilita la ayuda de SIG-MEJ-02.2.

**Alcance que puede avanzar:** Inventariar los seis campos del código y los tres del diseño; preparar matriz de ejemplos y dudas.

**Dependencia o definición relevante:** DU-04 resuelta en DEC-002; DU-05 definida en DEC-003. La matriz queda registrada arriba.

**Límite de esta clasificación:** No tomar la presencia de código como aprobación de seis campos.

[Ver la clasificación de todos los tickets](../ARRANQUE.md). Esta sección no resuelve las dudas registradas ni modifica reglas de negocio; delimita el trabajo que puede empezar con lo ya definido.

## Precedencia y coordinación con otras US

**Predecesora o contrato:** DEC-002 para equivalencias y DEC-003 para campos/ayuda; ambos registrados.

**US/tareas relacionadas:** SIG-BUG-02.1, SIG-MEJ-02.2 y US-5.2.

**Coordinación y cierre:** Definir campos/ayuda una sola vez; el buscador de turnos de US-2.1 es otro caso.

[Ver el orden del sprint y la matriz de integración](../../ORDEN-E-INTEGRACION.md). Compartir archivo no implica dependencia funcional; las pruebas base pueden empezar antes de repetirlas con las US nuevas.

## Fuente y situación actual

[Documento de análisis — sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md).

Ya se busca por profesional, especialidad, diagnóstico, tratamiento, indicaciones y fecha. El documento propone profesional/diagnóstico/tratamiento y condiciona la búsqueda por profesional a aprobación.

La situación inicial se conserva como antecedente. La matriz y las verificaciones ejecutadas están registradas arriba y en la evidencia enlazada.

## Objetivo

Acordar los campos visibles en la ayuda y confirmar la búsqueda por profesional sin duplicar funcionalidad existente.

## Trabajo y entregable

- Inventariar los seis campos existentes y registrar cuáles se mantienen.
- Contrastar los tres campos del diseño con los seis del código y registrar la duda. No dar por aprobada su conservación ni eliminarlos sin definición funcional.
- Acordar búsqueda por nombre y apellido separados, y aclarar si nombre completo en orden natural debe funcionar pese al formato Apellido, Nombre.

## Criterios de aceptación

- [x] **[DU-05; criterio del usuario]** La matriz de campos y ejemplos queda registrada con fuente, responsable y fecha; no se presume aprobación externa.
- [x] **[Separación de alcance]** Se distingue soporte existente de la normalización de SIG-BUG-02 y de la ayuda de SIG-MEJ-02.2.
- [x] **[DEC-003]** El texto de ayuda enumera los seis campos y la fecha buscable que el componente admite.

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

La diferencia de tres/seis campos se resuelve mediante el criterio DU-05 del usuario y DEC-003. Los nombres completos reutilizan DEC-002; no se define otra política a partir del código.

**Dudas relacionadas:** [DU-04](../REVISION.md#du-04) y [DU-05](../REVISION.md#du-05), definidas mediante DEC-002/003. [DU-06](../REVISION.md#du-06) conserva permisos administrativos en US-7.5; [DU-12](../REVISION.md#du-12), la jerarquía general. No bloquean esta matriz del historial propio.

### Tratamiento de la duda y alcance seguro

Se registra la matriz conforme al criterio del usuario, sin ampliar campos ni asumir reglas de permisos.

Los criterios condicionados se cierran solo cuando se documenta la definición que falta. Pueden continuar diagnóstico y revisión del comportamiento explícito; las expectativas dudosas no se implementan ni se convierten en pruebas que fijen una regla inventada.

Al completar, registrar evidencia y resultado en este ticket. Para código, indicar commit y comprobaciones realizadas; para definiciones, registrar el acuerdo. No marcar como terminado únicamente por existir código relacionado.

