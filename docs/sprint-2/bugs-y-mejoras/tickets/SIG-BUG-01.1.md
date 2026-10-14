# SIG-BUG-01.1 — Diagnosticar contenedores, alturas y fondos del área médica

| Campo | Valor |
| --- | --- |
| Sprint | 2 |
| Responsable | Usuario — Bugs y Mejoras |
| Tema padre | SIG-BUG-01 |
| Tipo de tarea | Diagnóstico de bug visual |
| Prioridad propuesta | P1 |
| Estado inicial | Lista para iniciar |
| Estado actual | Diagnóstico completado; evidencia visual aislada en navegador |
| Esfuerzo orientativo | 2 h |
| Predecesoras del plan de integración | Ninguna |

## Diagnóstico realizado

Fecha: 14/10/2026. Base: `516414e`, que ya incluye `bea3fd1`. [Decisión de alcance DEC-001](../../../decisiones.md#dec-001--alcance-de-la-corrección-visual-sig-bug-01).

La altura porcentual `min-h-full` del portal no ocupa la ventana porque el `body` solo tiene altura mínima, sin una altura definida para resolver ese porcentaje. Con tabla vacía, a 1280×800 el portal termina a 503 px y expone el fondo del `body`. La regla global de preferencia oscura pinta ese fondo `#0a0a0a`; la clase de fondo del body no la reemplaza porque pertenece a una capa CSS de menor prioridad.

A 360 px, los filtros que no permiten acomodar sus elementos producen un ancho de documento de 673 px. El ajuste previo de la tabla no resuelve ninguno de esos dos problemas.

Se propone `min-h-dvh` en el portal, filtros adaptables y scroll contenido en la tabla. [Ver capturas, mediciones y límites de reproducción](../SIG-BUG-01-IMPLEMENTACION.md). Los filtros y la condición de las acciones médicas se conservan.

## Disponibilidad para arrancar

**Clasificación:** Diagnóstico sin consulta externa.

**Alcance que puede avanzar:** Reproducir la franja negra y localizar la causa. Elegir tamaños de prueba e inspeccionar CSS son decisiones técnicas.

**Dependencia o definición relevante:** Ninguna confirmación para investigar. No definir un nuevo tema visual ni soporte de dispositivos como regla.

**Límite de esta clasificación:** Su resultado habilita SIG-BUG-01.2.

[Ver la clasificación de todos los tickets](../ARRANQUE.md). Esta sección no resuelve las dudas registradas ni modifica reglas de negocio; delimita el trabajo que puede empezar con lo ya definido.

## Precedencia y coordinación con otras US

**Predecesora o contrato:** Ninguna para diagnosticar.

**US/tareas relacionadas:** US-7.4 y US-2.8.

**Coordinación y cierre:** Diagnosticar alturas/fondos, sin editar navegación, permisos o asistencia. No esperar esas US para reproducir.

[Ver el orden del sprint y la matriz de integración](../../ORDEN-E-INTEGRACION.md). Compartir archivo no implica dependencia funcional; las pruebas base pueden empezar antes de repetirlas con las US nuevas.

## Cambio upstream a revisar antes del diagnóstico

El commit bea3fd1, ya incorporado en la rama de trabajo, ajusta alturas/scroll de la hoja médica y puede cubrir parte del problema visual. Reproducir sobre esta versión actualizada antes de decidir qué falta corregir. No dar por resuelta la franja negra únicamente por el diff. [Ver revisión e incorporación del commit](../../REVISION-COMMIT-bea3fd1.md).

## Fuente y situación actual

[Documento de análisis — sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md).

La captura image4.png muestra la hoja de trabajo y una franja negra inferior. El portal usa min-h-full dentro de un body con min-h-full; globals.css aplica un fondo oscuro según prefers-color-scheme. Son candidatos a revisar, no una causa demostrada en ejecución.

La situación anterior describe la hipótesis inicial. El diagnóstico ejecutado y su evidencia están registrados arriba; se usaron componentes reales con identidad y consultas simuladas, sin acceso a la base de datos.

## Objetivo

Identificar el elemento y la regla que dejan parte de la ventana fuera del fondo del portal.

## Trabajo y entregable

- Reproducir los componentes de /medico/agenda con tabla vacía y con turnos; emular preferencia clara/oscura como diagnóstico del fondo existente.
- Inspeccionar alturas calculadas de html, body, portal y main, y quién pinta el área negra.
- Comparar con /paciente/historial y /enfermera/inventario; registrar la corrección mínima propuesta.

## Criterios de aceptación

- [x] **[DEC-001; evidencia aislada]** Existe evidencia antes del cambio con tamaño de ventana y preferencia de sistema emulada.
- [x] **[Diagnóstico reproducido]** Se documenta la causa, los archivos afectados y la diferencia entre reproducción local y despliegue original.
- [x] **[Preservación funcional]** La propuesta conserva filtros, tabla y acciones médicas; los cambios de código son de presentación.

## Validación prevista

Chrome for Testing, zoom 100%, a 360×800, 768×800 y 1280×800 según DEC-001. Entregar capturas y mediciones con tabla vacía/larga; las preferencias clara/oscura se usan para diagnosticar el fondo, sin agregar un tema nuevo.

## Archivos a revisar

- [src/app/layout.tsx](../../../../src/app/layout.tsx)
- [src/app/globals.css](../../../../src/app/globals.css)
- [src/app/(portal)/layout.tsx](../../../../src/app/%28portal%29/layout.tsx)
- [src/app/(portal)/role-shell.tsx](../../../../src/app/%28portal%29/role-shell.tsx)
- [src/app/(portal)/medico/agenda/page.tsx](../../../../src/app/%28portal%29/medico/agenda/page.tsx)

## Límite de alcance

No implementar disponibilidad mensual, asistencia ni rediseñar la hoja de trabajo.

## Revisión de requisitos, cobertura y dudas

Fecha: 13/10/2026. Esta revisión distingue reglas documentadas, propuestas de la fuente, implementación existente y supuestos del plan. Un dato observado en código no valida una regla de negocio.

### Requisito o regla correspondiente

RF-04 (consulta de la hoja de trabajo). La corrección del espacio negro y la consistencia visual se solicitan directamente en [Documento de sprint 2, sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md), SIG-BUG-01 CA1/CA2; RF-04 no define alturas CSS, tema ni tamaños de ventana. [Requerimientos funcionales](../../../../docs/requerimientos_funcionales.md).

### Historia o ticket que ya lo cubre

US-1.4, tarea 1.4.1, ya cubre la pantalla. Estos tickets corrigen su presentación. US-7.4 puede tocar el shell, pero no cubre por sí sola esta corrección. [Historias de sprint 1](../../../../docs/user_stories_sprint_1.md).

**Para esta tarea:** Diagnóstico de una pantalla ya cubierta, no nuevo requisito.

La cobertura encontrada es documental y local; no se consultó un tablero externo ni se afirma que esas historias estén terminadas.

### Qué es explícito y qué se estaba suponiendo

**Explícito en las fuentes:** La captura evidencia una franja negra y la fuente pide revisar contenedores, alturas y fondos; no exige nuevas funciones médicas.

**Supuesto o propuesta del primer plan:** El origen en flex/min-h-full/fondo oscuro es hipótesis técnica. Los tres tamaños de prueba y ambos temas fueron elegidos por el plan; no son dispositivos ni soporte de tema aprobados.

Las etiquetas de los criterios separan obligación explícita, interpretación pendiente y verificación técnica. Proponer tests, un helper o atributos accesibles no crea una regla de negocio nueva ni exige un acuerdo funcional sobre cada detalle técnico.

### Datos faltantes o contradictorios

La causa actual se reprodujo localmente y el criterio de cierre se registra en DEC-001. Se desconocen navegador/tema/zoom y versión exacta de la captura original; no se atribuyen al despliegue las condiciones del ensayo aislado.

**Dudas relacionadas:** [DU-01](../REVISION.md#du-01), definida para este alcance mediante DEC-001 y reproducción local; [DU-12](../REVISION.md#du-12), pendiente en su jerarquía general. Esta última no impide documentar una corrección visual autorizada.

### Tratamiento de la duda y alcance seguro

Puede reproducirse y documentarse sin decidir un nuevo soporte de temas o dispositivos.

Los criterios condicionados se cierran solo cuando se documenta la definición que falta. Pueden continuar diagnóstico y revisión del comportamiento explícito; las expectativas dudosas no se implementan ni se convierten en pruebas que fijen una regla inventada.

Al completar, registrar evidencia y resultado en este ticket. Para código, indicar commit y comprobaciones realizadas; para definiciones, registrar el acuerdo. No marcar como terminado únicamente por existir código relacionado.

