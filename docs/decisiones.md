# Decisiones de implementación

Cada entrada identifica alcance, fuente, responsable y fecha. Este registro no establece una jerarquía general entre RF, US y diseños; esa parte de DU-12 continúa pendiente.

## DEC-001 — Alcance de la corrección visual SIG-BUG-01

- **Fecha:** 14/10/2026.
- **Estado:** adoptado para SIG-BUG-01.1 y SIG-BUG-01.2.
- **Fuente:** criterio DU-01 propuesto por el usuario en esta conversación y solicitud posterior de implementar/resolver ambos tickets; [documento de sprint 2, SIG-BUG-01](../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md), RF-04 y US-1.4.
- **Responsable del alcance:** usuario, Bugs y Mejoras. **Responsable de ejecución y evidencia:** Codex.
- **Criterio:** comprobar en Chrome los anchos 360/768/1280 px, sin franja negra inferior ni recortes que impidan acceder al contenido. No agregar modo oscuro ni redefinir funciones médicas.
- **Condiciones de prueba técnicas:** altura de 800 px, zoom 100%, DPR 1, tabla vacía y 40 turnos ficticios. Emular preferencia de sistema clara/oscura únicamente para diagnosticar el fondo existente. No significa que se entregue soporte de un nuevo tema.
- **Solución técnica:** altura mínima del portal basada en la ventana (`min-h-dvh`), colores explícitos de texto, filtros adaptables y desplazamiento horizontal contenido en la tabla. Se mantienen las reglas globales de tema y los ajustes de `bea3fd1`.
- **Evidencia y límites:** [diagnóstico, corrección y resultados](sprint-2/bugs-y-mejoras/SIG-BUG-01-IMPLEMENTACION.md). Se verifica presentación con componentes reales y datos ficticios; no certifica autenticación, operaciones clínicas o un despliegue.

El criterio de DU-01 queda definido para estos tickets. La versión, zoom y preferencia de sistema de la captura original siguen sin conocerse; la reproducción local no atribuye esas condiciones al despliegue original.

## DEC-002 — Normalización de la búsqueda del historial

- **Fecha:** 14/10/2026.
- **Estado:** adoptado y verificado para SIG-BUG-02.1/02.2/02.3.
- **Fuente:** criterios DU-03/DU-04 propuestos por el usuario en esta conversación, revisión posterior de sus límites y solicitud de implementar/resolver SIG-BUG-02; [documento de sprint 2, SIG-BUG-02](../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md). RF-18 y US-5.2 aportan el contexto de historial propio, no la política lingüística.
- **Responsable del alcance:** usuario, Bugs y Mejoras. **Responsable de ejecución y evidencia:** Codex.
- **Criterio de equivalencia:** `infeccion`, `infección` e `INFECCIÓN` devuelven los mismos registros. Se aplica NFD, eliminación de diacríticos y minúsculas a consulta y contenido; esto incluye ñ≡n, ü≡u y Unicode compuesto/descompuesto.
- **Términos:** espacios y comas separan términos para admitir nombres en ambos órdenes. Todos deben coincidir, como subcadenas, en los campos de una misma atención, en cualquier orden. No se reúnen coincidencias de atenciones distintas.
- **Preservación:** quedan los seis campos existentes —profesional, especialidad, diagnóstico, tratamiento, indicaciones y fecha mostrada `dd/mm/aaaa`—, los filtros, orden, paginación y textos originales. Consulta sin términos recupera el filtro activo; campos nulos no agregan texto buscable.
- **Límite frente a SIG-MEJ-02:** este bug no agrega campos, ayuda visible, permisos ni consultas nuevas. La matriz y entrega de ayuda quedan en SIG-MEJ-02.1/02.2; aislamiento de datos del servidor en SIG-MEJ-02.3. La política común se reutiliza, sin otra normalización incompatible.
- **Evidencia:** [reproducción, corrección y resultados](sprint-2/bugs-y-mejoras/SIG-BUG-02-IMPLEMENTACION.md): 21/39 regresiones fallan contra el componente de `9837f80`; 39/39 pasan corregidas. Se usan el componente real y fixtures ficticios, sin credenciales ni base de datos.

DU-03 y DU-04 quedan definidas para la corrección. No se afirma conocer la consulta histórica exacta del despliegue original: los resultados proceden de reproducción local.

## DEC-003 — Campos y ayuda de búsqueda del historial

- **Fecha:** 14/10/2026.
- **Estado:** adoptado y entregado para SIG-MEJ-02.1/02.2.
- **Fuente:** criterio DU-05 del usuario en esta conversación —buscar los seis campos, enumerarlos en la ayuda y buscar la fecha como se muestra— y solicitud posterior de implementar SIG-MEJ-02.1/02.2; [documento de sprint 2, SIG-MEJ-02](../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md).
- **Responsable del alcance:** usuario, Bugs y Mejoras. **Responsable de ejecución, copy y evidencia:** Codex. No se presume una aprobación externa del cliente/docente.
- **Campos:** profesional (nombre y apellido), especialidad, diagnóstico, tratamiento, indicaciones y fecha visible `dd/mm/aaaa`. La fecha sigue el dato y zona horaria que ya usa la pantalla; no se incorpora otro tipo de fecha ni se agregan campos.
- **Texto visible:** «Buscar por profesional (nombre o apellido), especialidad, diagnóstico, tratamiento, indicaciones o fecha (dd/mm/aaaa).» La redacción aplica el alcance del usuario; no agrega una regla de negocio.
- **Presentación:** ayuda debajo del buscador, en una constante de texto y asociada al input mediante `aria-describedby`. Conserva el botón Buscar y el envío con Enter.
- **Contrato compartido:** se reutiliza [DEC-002](#dec-002--normalización-de-la-búsqueda-del-historial) para tildes, mayúsculas, ñ/n y nombres en ambos órdenes; no se crea otra normalización.
- **Evidencia:** [matriz de campos y ejemplos](sprint-2/bugs-y-mejoras/tickets/SIG-MEJ-02.1.md#matriz-de-campos-y-ejemplos) y [implementación/verificaciones](sprint-2/bugs-y-mejoras/SIG-MEJ-02-IMPLEMENTACION.md).
- **Límite:** no modifica consultas, datos clínicos, selección del paciente o permisos. SIG-MEJ-02.3 conserva las pruebas de aislamiento del servidor y su integración con sesión real; DU-06 sigue con US-7.5.

DU-05 queda definida para estos entregables. La contradicción tres campos del diseño/seis del código se resuelve por el criterio explícito del usuario, no por asumir que el código era la autoridad funcional.

## DEC-004 — Rótulo provisorio de indicaciones del historial

- **Fecha:** 14/10/2026.
- **Estado:** provisorio para DU-02 / SIG-MEJ-01.1 y SIG-MEJ-01.2; aprobación definitiva del cliente pendiente.
- **Fuente:** instrucción del usuario en esta conversación: «DU-02 puede avanzar con “Indicaciones” en una constante de textos, marcada como provisoria en docs/decisiones.md, sin darla por aprobada». La [fuente de SIG-MEJ-01](../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md) mantiene pendiente la aprobación del texto definitivo.
- **Responsable del avance provisorio:** usuario, Bugs y Mejoras. **Responsable de ejecución:** Codex. No se presume conformidad del cliente/docente.
- **Aplicación:** la columna antes titulada «Acciones» y el título del detalle usan «Indicaciones». La constante local `detailTexts` centraliza ese rótulo y los textos existentes de los botones, «Detalle» / «Cerrar», en [clinical-history-table.tsx](../src/app/%28portal%29/paciente/historial/clinical-history-table.tsx).
- **Motivo:** el detalle actual muestra `record.indications`; el rótulo describe ese contenido. Diagnóstico y tratamiento conservan sus columnas. No se añade un campo Observaciones ni se redefine información clínica para justificar el texto.
- **Pendiente:** confirmar el rótulo definitivo y ambos textos del botón, quién los aprueba y la fecha. DU-02 permanece abierta; esta decisión permite implementar la alternativa provisoria sin cerrar el acuerdo de SIG-MEJ-01.1 ni la conformidad definitiva de SIG-MEJ-01.2.
- **Revisión posterior:** al obtener el acuerdo, actualizar la constante y esta entrada, y repetir las regresiones del historial. La aprobación debe registrarse expresamente; no se infiere de que el texto ya esté en la interfaz.
