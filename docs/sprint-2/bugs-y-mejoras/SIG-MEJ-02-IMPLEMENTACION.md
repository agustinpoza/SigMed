# SIG-MEJ-02.1 / 02.2 — Campos y ayuda del buscador del historial

Fecha: 14/10/2026. Rama: `sprint-2/bugs-y-mejoras`. Base: `5e1ef9e`. Implementación y verificaciones locales; sin publicación.

## Requisito y decisión

RF-18 / US-5.2 cubren el historial propio. SIG-MEJ-02 del [documento de sprint 2](../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md) pide definir los campos, completar búsqueda por profesional y ayuda; aislamiento pertenece a SIG-MEJ-02.3.

El usuario propuso en DU-05 conservar los seis campos y enumerarlos en la ayuda, buscando la fecha como se muestra. Su solicitud actual de implementar SIG-MEJ-02.1/02.2 permite aplicar ese criterio. [DEC-003](../../decisiones.md#dec-003--campos-y-ayuda-de-búsqueda-del-historial) registra fuente, responsable, fecha y texto; no se presume aprobación externa del cliente/docente ni se usa el código como autoridad funcional.

## SIG-MEJ-02.1 — Matriz entregada

[La matriz del ticket](tickets/SIG-MEJ-02.1.md#matriz-de-campos-y-ejemplos) identifica para cada campo su fuente actual, ejemplo ficticio, consulta y cobertura previa:

- Profesional: nombre y apellido, conservando la presentación `Apellido, Nombre` y admitiendo ambos órdenes al buscar.
- Especialidad, diagnóstico, tratamiento e indicaciones: textos existentes; los opcionales nulos no agregan texto buscable.
- Fecha: fecha visible de la atención —asistencia si existe o inicio del turno— en zona Buenos Aires, `dd/mm/aaaa`.

Los seis campos ya estaban incluidos; tildes, ñ/n y términos en cualquier orden se entregaron en SIG-BUG-02 bajo DEC-002. Esta mejora define la matriz y presenta la ayuda; no duplica el buscador ni agrega datos clínicos.

## SIG-MEJ-02.2 — Ayuda implementada

En [clinical-history-table.tsx](../../../src/app/%28portal%29/paciente/historial/clinical-history-table.tsx), `searchHelp` contiene:

> Buscar por profesional (nombre o apellido), especialidad, diagnóstico, tratamiento, indicaciones o fecha (dd/mm/aaaa).

La ayuda queda debajo del input y el botón, visible en cualquier ancho y asociada con `aria-describedby="history-search-help"`. La fila input/botón se conserva dentro del formulario; se mantiene envío mediante Buscar o Enter.

El matcher `createHistorySearchMatcher`, consulta del servidor, filtros, orden, paginación, textos originales y permisos no se modifican. No se agregan dependencias ni pruebas que dupliquen el copy: se reutilizan las 39 regresiones existentes y se comprueba la accesibilidad en navegador.

## Verificación

### Componente y comprobaciones del proyecto

```powershell
npm.cmd run test:history
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

- **39/39** regresiones del historial aprobadas, incluidos los seis campos, profesional en ambos órdenes, filtros, orden y paginación.
- Typecheck y build aprobados con Next.js 16.3.8.
- Lint sin errores; conserva una advertencia previa de `aria-expanded` en vacunación.
- `git diff --check` aprobado; la página del servidor, matcher, esquema y consultas no tienen cambios.

### Chrome y teclado

Chrome for Testing **155.0.8059.79**, a 360×800, 768×800 y 1280×800, zoom 100% / DPR 1 y preferencia clara emulada. Se montó el componente React real e interactivo con CSS real y dos registros ficticios; no se usó servidor Next, sesión ni base de datos.

- La ayuda es visible y queda dentro del ancho de la ventana, debajo del campo.
- El árbol de accesibilidad expone el texto completo como descripción del input.
- **27 búsquedas con teclado**: `Martin`, `Gomez`, `Martin Gomez`, `Gomez, Martin`, `clinica`, `infeccion`, `reposo`, `control` y `14/10/2026`, repetidas en los tres anchos. Todas devuelven la atención ficticia correspondiente.
- Tab desde el input llega a Buscar; Enter envía tanto desde el campo como desde el botón.
- No hay desbordamiento horizontal de página; la tabla conserva su scroll propio.

[Mediciones y resultados](evidencias/sig-mej-02/resultados.json). Capturas del componente con la ayuda visible:

| 360 px | 768 px | 1280 px |
| --- | --- | --- |
| [Ver captura](evidencias/sig-mej-02/ayuda-360.png) | [Ver captura](evidencias/sig-mej-02/ayuda-768.png) | [Ver captura](evidencias/sig-mej-02/ayuda-1280.png) |

El script temporal y fixtures de inspección quedan en `node_modules/.cache/sig-mej-02-browser.mjs` y `node_modules/.cache/sig-mej-02/`; no se instalan herramientas nuevas en el proyecto.

## Cierre y límites

SIG-MEJ-02.1 queda completado con matriz y definición trazable. SIG-MEJ-02.2 queda implementado/verificado con ayuda visible, descripción accesible y reutilización del buscador. DU-05 se resuelve para estos entregables mediante DEC-003.

SIG-MEJ-02.3 sigue pendiente: verificar los datos que entrega el servidor y repetir aislamiento al integrar sesión real de US-7.2/7.4. Esta entrega conserva el filtro existente, pero no certifica seguridad por las pruebas de UI. Permisos administrativos de DU-06 siguen en US-7.5; DU-12 conserva pendiente su jerarquía documental. La captura histórica del fallo del profesional no se atribuye a estos fixtures ni se declara probado el despliegue compartido.
