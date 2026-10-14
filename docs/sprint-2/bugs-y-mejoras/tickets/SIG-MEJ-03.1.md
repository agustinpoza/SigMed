# SIG-MEJ-03.1 — Incorporar Sumar dosis y Descontar dosis en el ajuste de stock

| Campo | Valor |
| --- | --- |
| Sprint | 2 |
| Responsable | Usuario — Bugs y Mejoras |
| Tema padre | SIG-MEJ-03 |
| Tipo de tarea | Mejora de formulario |
| Prioridad propuesta | P2 |
| Estado inicial | Planificada; propuesta funcional del documento |
| Estado actual | Selector e indicador DU-07 implementados/verificados; integración de identidad real externa |
| Esfuerzo orientativo | 2 h |
| Predecesoras del plan de integración | Ninguna |

## Implementación y verificación

Implementado el 14/10/2026 en sprint-2/bugs-y-mejoras, sobre b765674.

Se agregaron las opciones Sumar dosis y Descontar dosis para AJUSTE, sin preseleccionar una operación. La cantidad usa min=1/step=1 y ayuda de entero positivo. Los campos controlados conservan vacuna, lote, motivo, cantidad y operación si el servidor devuelve un error; cambiar tipo elimina la operación incompatible y Cancelar limpia datos y feedback.

[Ver implementación y resultados de SIG-MEJ-03.1/03.2](../SIG-MEJ-03-IMPLEMENTACION.md). Pasaron 38 pruebas nuevas de stock y 28 regresiones de vacunación (66 en total), typecheck y build. Lint sin errores, con un aviso preexistente de vacunación. Las casillas reflejan cobertura automatizada de la entrada, acción y contrato de llamada; no se escribieron movimientos reales para verificarlas.

Actualización del 14/10/2026: SIG-MEJ-03.3 ya verifica stock, rollback y concurrencia en PostgreSQL real. DU-07 se aplica mediante [DEC-005](../../../decisiones.md#dec-005--disponibilidad-por-vacuna-y-número-de-lote): lectura de `quantityAvailable` por vacuna + número de lote; sin clave completa se oculta, un fallo no muestra cero y una consulta posterior descarta el valor anterior. Error con reintento y pruebas de respuestas tardías. [Cierre provisorio y evidencia](../CIERRE-PROVISORIO.md). DU-08 conserva la integración externa de identidad; no se valida el fallback como auditoría real.

## Disponibilidad para arrancar

**Clasificación:** Implementable sin consulta externa, alcance textual definido.

**Alcance que puede avanzar:** Agregar Sumar dosis/Descontar dosis para AJUSTE y pedir cantidad positiva, conservando INGRESO y el resto del formulario.

**Dependencia o definición relevante:** DU-07 está definida para este bloque en DEC-005. El indicador usa el saldo existente; los ajustes siguen sin operación preseleccionada.

**Límite de esta clasificación:** Coordinar operación/cantidad con SIG-MEJ-03.2; no cambiar el modelo del saldo ni considerar el indicador una garantía ante movimientos concurrentes.

[Ver la clasificación de todos los tickets](../ARRANQUE.md). Esta sección no resuelve las dudas registradas ni modifica reglas de negocio; delimita el trabajo que puede empezar con lo ya definido.

## Precedencia y coordinación con otras US

**Predecesora o contrato:** Contrato operación/cantidad con SIG-MEJ-03.2.

**US/tareas relacionadas:** US-3.2 existente y US-7.4.

**Coordinación y cierre:** Selector, acción e indicador integrados. Conservar saldo y guard vigentes; la sesión real corresponde a US-7.2/7.4.

[Ver el orden del sprint y la matriz de integración](../../ORDEN-E-INTEGRACION.md). Compartir archivo no implica dependencia funcional; las pruebas base pueden empezar antes de repetirlas con las US nuevas.

## Fuente y situación actual

[Documento de análisis — sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md).

El formulario diferencia INGRESO/AJUSTE; para AJUSTE explica el uso de negativos y muestra placeholder -5.

La evidencia inicial corresponde a la revisión estática previa. La implementación posterior y su verificación están registradas arriba; la integración real de stock continúa en SIG-MEJ-03.3.

## Objetivo

Permitir elegir la dirección del ajuste sin que la persona deba conocer el signo de la cantidad.

## Trabajo y entregable

- Añadir Sumar dosis/Descontar dosis para AJUSTE conservando INGRESO como recepción de lote.
- Solicitar cantidad positiva con min=1 y step=1; actualizar ejemplos y ayuda.
- Acordar con SIG-MEJ-03.2 el campo de operación; mantener cantidad, operación, lote y motivo cuando falle el envío.
- Aplicar DU-07 / DEC-005: consultar stock disponible por vacuna/lote, distinguir cero/error y descartar lecturas anteriores. Los valores del diseño son ejemplos.

## Criterios de aceptación

- [x] **[Explícito en SIG-MEJ-03]** Para ajustes se elige expresamente Sumar o Descontar y se ingresa una cantidad positiva.
- [x] **[Modelo existente; preservación técnica]** INGRESO mantiene su flujo y no admite una operación de descuento.
- [x] **[Preservación técnica]** Cambiar tipo de movimiento no deja una operación incompatible oculta ni pierde información tras errores.
- [x] **[Propuesta técnica]** Los controles y mensajes son accesibles y consistentes con el formulario actual.
- [x] **[DU-07 / DEC-005]** Indicador por clave vacuna/lote con carga, cantidad, no encontrado y error separados; reintento, limpieza y nueva consulta sin reutilizar saldo anterior.

## Validación prevista

Prueba manual de sumar/descontar, ingreso, cambio de tipo y errores con preservación de valores. El flujo se cierra integrado con SIG-MEJ-03.2; ejecutar lint y typecheck.

## Archivos a revisar

- [src/app/(portal)/enfermera/inventario/movement-form.tsx](../../../../src/app/%28portal%29/enfermera/inventario/movement-form.tsx)

## Límite de alcance

No inventar un nuevo tipo persistido de egreso: se conserva AJUSTE para correcciones y los movimientos por turno de US-3.6.

## Revisión de requisitos, cobertura y dudas

Fecha: 13/10/2026. Esta revisión distingue reglas documentadas, propuestas de la fuente, implementación existente y supuestos del plan. Un dato observado en código no valida una regla de negocio.

### Requisito o regla correspondiente

RF-11 y US-3.2 exigen stock y trazabilidad. SIG-MEJ-03 de [Documento de sprint 2, sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md) explicita operación Sumar/Descontar, entero positivo en UI, signo interno, rechazo si no alcanza y lote/motivo/responsable/cantidad. El modelo exige stock por lote ≥ 0, ajuste con motivo y movimientos inmutables. [Requerimientos funcionales](../../../../docs/requerimientos_funcionales.md); [Diccionario y desvíos de implementación](../../../../docs/BD.md).

### Historia o ticket que ya lo cubre

US-3.2.2 ya permite sumar/descontar; US-3.2.3 ya verifica no negativo y CA2 exige usuario/fecha/lote inmutables. La novedad es la entrada positiva con operación explícita, no rehacer el inventario. [Historias de sprint 1](../../../../docs/user_stories_sprint_1.md).

**Para esta tarea:** Mejora de entrada sobre US-3.2.2, no nuevo tipo de movimiento.

La cobertura encontrada es documental y local; no se consultó un tablero externo ni se afirma que esas historias estén terminadas.

### Qué es explícito y qué se estaba suponiendo

**Explícito en las fuentes:** El signo almacenado sigue representando incremento/decremento; el motivo es obligatorio en ajustes. El diseño muestra AJUSTE, selector de operación, fecha no modificable y stock disponible del lote.

**Supuesto o propuesta del primer plan:** Conservar el contrato firmado de registerStockMovement, los nombres de campos de FormData y la traducción de errores son propuestas técnicas. Un límite del entero de almacenamiento es técnico; no fija un máximo comercial de dosis. El fallback de actor existente no demuestra atribución al operador real.

Las etiquetas de los criterios separan obligación explícita, interpretación pendiente y verificación técnica. Proponer tests, un helper o atributos accesibles no crea una regla de negocio nueva ni exige un acuerdo funcional sobre cada detalle técnico.

### Datos faltantes o contradictorios

image6.png mostraba stock disponible del lote, omitido en el primer plan. DEC-005 define su alcance y lectura; no se copian 37 dosis o 9 como constantes del producto ni se preselecciona la operación.

**Dudas relacionadas:** [DU-07](../REVISION.md#du-07) aplicada y verificada en DEC-005; [DU-08](../REVISION.md#du-08) mantiene integración externa de identidad y [DU-12](../REVISION.md#du-12) la jerarquía general pendiente.

### Tratamiento de la duda y alcance seguro

Registrar la diferencia del diseño como duda de alcance; min/step son soporte técnico del entero positivo explícito.

Los criterios condicionados se cierran solo cuando se documenta la definición que falta. Pueden continuar diagnóstico y revisión del comportamiento explícito; las expectativas dudosas no se implementan ni se convierten en pruebas que fijen una regla inventada.

Al completar, registrar evidencia y resultado en este ticket. Para código, indicar commit y comprobaciones realizadas; para definiciones, registrar el acuerdo. No marcar como terminado únicamente por existir código relacionado.

