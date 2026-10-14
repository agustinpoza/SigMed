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
