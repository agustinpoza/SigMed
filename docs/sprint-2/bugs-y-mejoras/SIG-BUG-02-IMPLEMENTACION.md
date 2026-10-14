# SIG-BUG-02.1 / 02.2 / 02.3 — Búsqueda normalizada del historial

Fecha: 14/10/2026. Rama: `sprint-2/bugs-y-mejoras`. Base: `9837f80`. Implementación y verificaciones locales; sin publicación.

## Requisito, definición y límites

RF-18 y US-5.2 cubren la consulta del historial propio. La corrección de acentos y las regresiones corresponden a SIG-BUG-02 del [documento de sprint 2](../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md). El ejemplo original tiene una ambigüedad al escribir una búsqueda «sin tilde» con tilde; no se usa esa inconsistencia para inventar resultados.

[DEC-002](../../decisiones.md#dec-002--normalización-de-la-búsqueda-del-historial) registra los criterios del usuario aplicados por esta solicitud: búsqueda insensible a acentos/mayúsculas; NFD, eliminación de diacríticos y minúsculas, incluyendo ñ≡n y ü≡u; términos en cualquier orden, todos dentro de una misma atención. Espacios y comas separan términos para admitir nombres completos en ambos órdenes.

Se conserva la búsqueda sobre los seis campos actuales, la fecha tal como se muestra (`dd/mm/aaaa`), coincidencias parciales, filtros, orden, paginación y detalle de indicaciones. SIG-MEJ-02 conserva sus entregables de matriz/ayuda y aislamiento del servidor; no se implementa ni se da por cerrado por este bug.

## SIG-BUG-02.1 — Reproducción

Se usa el componente real `ClinicalHistoryTable` con cuatro registros ficticios:

- `Infección respiratoria alta`, profesional `Gómez, Martín`, especialidad `Clínica médica`, tratamiento `Reposo`, indicaciones `Control en 72 horas`, fecha `14/10/2026`.
- `Dermatitis`, profesional `Pérez, Ana`, tratamiento `Crema húmeda` e indicaciones `Aplicar ungüento`.
- `Niño con alergia`, profesional `Muñoz, Lucía`, sin tratamiento.
- `Infeccio\u0301n localizada`: acento descompuesto en Unicode, profesional `Ferrer, Álvaro`, sin tratamiento ni indicaciones. En esta notación `\u0301` representa el carácter combinante del fixture, no texto literal mostrado.

La misma suite final corre contra una copia aislada del componente original obtenida mediante `git show 9837f80:src/app/(portal)/paciente/historial/clinical-history-table.tsx`. Un alias temporal de Vitest permite probarla sin reemplazar los archivos de trabajo. Resultado original: **18/39 aprobadas y 21/39 fallidas**.

| Consulta o comprobación | Componente original | Componente corregido |
| --- | --- | --- |
| `infeccion` / `INFECCION` | No encuentra las dos atenciones de infección | Encuentra ambas |
| `infección` / `INFECCIÓN` | Solo encuentra la atención con acento compuesto | Encuentra ambas |
| `alta` / `ALTA` | Encuentra la atención respiratoria | Conserva el resultado |
| `Martin` | No encuentra `Gómez, Martín` | Encuentra su atención |
| `Martín` | Ya encuentra al profesional | Conserva el resultado; no era falta del campo profesional |
| `Martin Gomez`, `Gomez Martin`, `Martin, Gomez` | No coinciden con el texto almacenado | Encuentran la misma atención |
| `nino`, `munoz`, `unguento` | No coinciden con ñ/diéresis | Siguen la equivalencia definida |
| `respiratoria dermatitis` | Sin resultados | Sin resultados: no combina términos de atenciones distintas |

No se afirma conocer la consulta histórica exacta ni la versión del despliegue original. Esta evidencia reproduce el comportamiento del componente de la rama.

## SIG-BUG-02.2 — Corrección

| Archivo | Cambio |
| --- | --- |
| [clinical-history-search.ts](../../../src/lib/clinical-history-search.ts) | Matcher compartido: normaliza consulta y contenido, separa términos por espacios/comas y exige coincidencia de todos en una misma atención. |
| [clinical-history-table.tsx](../../../src/app/%28portal%29/paciente/historial/clinical-history-table.tsx) | Usa el matcher en el filtro existente. Conserva los campos, form, orden, filtros, paginación y textos. |
| [package.json](../../../package.json) | Agrega `test:history`, reutilizando el runner instalado. |

La normalización solo se usa para comparar; no modifica los registros, la consulta Prisma ni el texto visible. Una consulta sin términos conserva los resultados del filtro activo; campos opcionales nulos no incorporan la palabra `null`. No se agregan dependencias.

## SIG-BUG-02.3 — Regresiones y comandos

[39 pruebas del componente](../../../src/app/%28portal%29/paciente/historial/clinical-history-table.test.tsx) con Vitest, Testing Library y jsdom, sin mocks del buscador:

- Resultados equivalentes con/sin acento, mayúsculas y Unicode compuesto/descompuesto.
- Profesional existente, nombres completos en ambos órdenes, comas, ñ/n y diéresis.
- Preservación de los seis campos y fecha visible; varios términos en campos distintos de una sola atención.
- Exclusión cuando falta un término y cuando los términos pertenecen a atenciones distintas.
- Coincidencia parcial, consulta vacía, separadores, campos nulos e historial vacío.
- Combinación con tratamiento/indicaciones; orden y paginación con siete registros ficticios; reinicio de página tras consulta/filtro.
- Conservación de registros/textos originales y apertura/cierre de indicaciones.

**Resultados guardados:** [comparación de los 39 casos antes/después y suite completa](evidencias/sig-bug-02/resultados.json).

```powershell
npm.cmd run test:history
npm.cmd test
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

Pasaron **39/39** regresiones del historial y **105/105** pruebas totales, incluidas las 66 previas de stock y vacunación. Typecheck y build aprobados; lint sin errores, con una advertencia preexistente de `aria-expanded` en vacunación. `git diff --check` aprobado.

El informe compara resultados del componente, no una copia de su algoritmo. Los archivos temporales del baseline y la configuración están en `node_modules/.cache/`; el comando normal del proyecto solo verifica la implementación actual.

## Estado y trabajo relacionado

SIG-BUG-02.1 queda diagnosticado, SIG-BUG-02.2 implementado y SIG-BUG-02.3 completado para DEC-002. DU-03/DU-04 tienen definición y evidencia registradas.

La ayuda visible y la matriz de SIG-MEJ-02.1/02.2 siguen pendientes de entrega y pueden reutilizar esta política. SIG-MEJ-02.3 debe verificar los datos enviados por el servidor y repetir con sesión real al integrar US-7.2/7.4; las pruebas del componente no certifican aislamiento ni permisos administrativos. DU-12 mantiene pendiente su jerarquía general. No se consultó ni escribió la base de datos, no se probó un despliegue y no se cambió el rótulo clínico de DU-02.
