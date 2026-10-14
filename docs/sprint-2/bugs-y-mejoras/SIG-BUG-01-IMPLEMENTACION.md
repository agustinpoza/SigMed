# SIG-BUG-01.1 / SIG-BUG-01.2 — Diagnóstico y corrección visual

Fecha: 14/10/2026. Rama: `sprint-2/bugs-y-mejoras`. Base: `516414e`, que incorpora `bea3fd1`. Implementación y verificaciones locales; sin publicación.

## Alcance y decisión

RF-04 / US-1.4 cubren la hoja de trabajo existente. SIG-BUG-01 pide diagnosticar y corregir la franja inferior, alturas y fondos. El criterio del usuario se registra en [DEC-001](../../decisiones.md#dec-001--alcance-de-la-corrección-visual-sig-bug-01): Chrome, anchos 360/768/1280 px, sin franja negra ni contenido inaccesible; no agregar modo oscuro ni nuevas funciones médicas.

La altura de 800 px, zoom 100%, DPR 1 y los datos ficticios son condiciones técnicas de prueba. Se emulan preferencias clara/oscura para identificar quién pinta el fondo existente, sin entregar un tema nuevo. Se desconoce la versión y preferencia de sistema de la captura original.

## Diagnóstico de SIG-BUG-01.1

1. `html` tiene `h-full`; `body` tiene `min-h-full`, pero no una altura definida. El `min-h-full` porcentual del portal no le garantiza ocupar la ventana. Con contenido corto, el portal acaba antes del borde inferior.
2. El espacio restante expone el fondo del `body`. La regla global sin capa `body { background: var(--background) }` tiene prioridad sobre la utilidad `bg-gray-300` de Tailwind. Con preferencia oscura, `--background` vale `#0a0a0a`, reproduciendo la franja negra.
3. Los filtros médicos tenían filas sin posibilidad de acomodarse al ancho disponible. A 360 px ensanchaban la página y dejaban controles fuera del viewport.

El ajuste previo de `bea3fd1` en sección/tabla conserva su utilidad para scroll, pero no corrige la altura mínima del portal ni la disposición de filtros.

## Corrección de SIG-BUG-01.2

| Archivo | Cambio y propósito |
| --- | --- |
| [Layout del portal](../../../src/app/%28portal%29/layout.tsx) | `min-h-dvh` cubre la ventana y permite crecer con contenido largo. Texto explícito conserva legibilidad bajo ambas preferencias de sistema. Header permite acomodar sus elementos; padding lateral menor en pantallas pequeñas. |
| [Filtros médicos](../../../src/app/ui/medico/filtros.tsx) | Fecha y estados permiten wrapping; búsqueda se adapta al ancho disponible. Se conservan handlers, opciones y parámetros. |
| [Tabla médica](../../../src/app/ui/medico/tabla-trabajo.tsx) | `min-w-0`, `overflow-auto` y ancho mínimo de 640 px mantienen columnas legibles con scroll dentro del contenedor, sin ensanchar la página. |

Se mantienen las reglas globales de tema, consultas, estados, permisos y condiciones de asistencia existentes. No se implementa US-2.8 ni se cambian acciones de negocio.

## Verificación visual

Se renderizaron los componentes React y el CSS Tailwind reales en páginas locales aisladas. Las consultas, identidad y primitivas de Next que requieren servidor se sustituyeron por fixtures; la tabla se obtuvo del componente asíncrono real. No se consultó ni modificó la base de datos.

Matriz por versión: seis escenarios × tres anchos × dos preferencias = **36 casos antes y 36 después**:

- Médico: tabla vacía y 40 turnos con nombres largos, comprobando desplazamiento a la última fila y columnas finales.
- Paciente: tabla real del historial vacía y con registros ficticios.
- Enfermera: página real de inventario con catálogo ficticio e historial vacío.
- Administrador: layout real con contenido breve de prueba; no representa toda la página de horarios.

Las mediciones, versión del navegador y capturas quedan en [evidencia visual](evidencias/sig-bug-01/resultados.json).

| Comprobación | Antes | Después |
| --- | --- | --- |
| Hoja vacía, 1280×800 | Portal termina a 503 px; fondo del body visible debajo | Portal cubre al menos 800 px |
| Hoja a 360 px | Documento llega a 673 px de ancho | Documento contenido en el ancho de ventana |
| Contenido breve en las áreas ensayadas | Varias páginas dejan descubierto el fondo del body | Ningún caso deja el portal más corto que la ventana |
| Contenido largo médico | La última fila es accesible con el scroll existente | Continúa accesible; columnas finales mediante scroll propio |
| Controles médicos | Parte de los filtros sale de la ventana a 360 px | Ningún input/botón del main queda fuera horizontalmente |

### Capturas antes/después

| Ancho | Antes, preferencia oscura | Después, preferencia oscura |
| --- | --- | --- |
| 360 px | [Tabla vacía](evidencias/sig-bug-01/antes-360.png) | [Tabla vacía](evidencias/sig-bug-01/despues-360.png) |
| 768 px | [Tabla vacía](evidencias/sig-bug-01/antes-768.png) | [Tabla vacía](evidencias/sig-bug-01/despues-768.png) |
| 1280 px | [Tabla vacía](evidencias/sig-bug-01/antes-1280.png) | [Tabla vacía](evidencias/sig-bug-01/despues-1280.png) |

El código y los fixtures temporales usados para la inspección quedan en `node_modules/.cache/sig-bug-01/`. Chrome for Testing se descarga allí desde el catálogo oficial de Google; no se instala en el sistema ni se agrega como dependencia del proyecto. La primera comprobación se realizó en Edge/Chromium, antes de la verificación en Chrome.

## Comprobaciones del proyecto

- `npm.cmd run typecheck`: aprobado.
- `npm.cmd run lint`: sin errores; conserva una advertencia preexistente de `aria-expanded` en vacunación.
- `npm.cmd run build`: aprobado con Next.js 16.3.8.
- `npm.cmd test`: 66 pruebas existentes aprobadas.
- `git diff --check`: aprobado.

## Cierre y límites

SIG-BUG-01.1 queda diagnosticado y SIG-BUG-01.2 implementado/verificado en el alcance visual acordado. Las pruebas son de presentación aislada en navegador, no de hidratación interactiva de las rutas completas, sesión real, asistencia o operaciones contra la base compartida. La conservación de handlers y consultas se comprueba en el diff.

Repetir la regresión visual si US-7.4 modifica el shell o US-2.8 cambia las acciones/contenido médico. DU-01 tiene alcance definido y evidencia local; la jerarquía documental de DU-12 sigue pendiente. No se cierran las US relacionadas por esta corrección.
