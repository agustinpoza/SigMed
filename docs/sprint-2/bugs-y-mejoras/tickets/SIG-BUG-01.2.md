# SIG-BUG-01.2 — Corregir la maquetación del área médica y validar tamaños de ventana

| Campo | Valor |
| --- | --- |
| Sprint | 2 |
| Responsable | Usuario — Bugs y Mejoras |
| Tema padre | SIG-BUG-01 |
| Tipo de tarea | Corrección visual |
| Prioridad propuesta | P1 |
| Estado inicial | Pendiente de diagnóstico |
| Esfuerzo orientativo | 3 h |
| Predecesoras del plan de integración | [SIG-BUG-01.1](SIG-BUG-01.1.md) |

## Disponibilidad para arrancar

**Clasificación:** Implementable sin consulta externa, tras diagnóstico.

**Alcance que puede avanzar:** Corregir la franja negra, alturas/fondos y recortes según la causa reproducida, preservando la pantalla existente.

**Dependencia o definición relevante:** Completar SIG-BUG-01.1 es una dependencia técnica, no una aprobación del cliente. DU-01 no impide corregir una causa demostrada.

**Límite de esta clasificación:** No extender la tarea a rediseñar la interfaz o cambiar funciones médicas.

[Ver la clasificación de todos los tickets](../ARRANQUE.md). Esta sección no resuelve las dudas registradas ni modifica reglas de negocio; delimita el trabajo que puede empezar con lo ya definido.

## Precedencia y coordinación con otras US

**Predecesora o contrato:** SIG-BUG-01.1: causa reproducida.

**US/tareas relacionadas:** US-7.4 y US-2.8.

**Coordinación y cierre:** Corregir CSS existente; coordinar si cambia el shell y repetir prueba visual tras integración. No agregar acciones médicas.

[Ver el orden del sprint y la matriz de integración](../../ORDEN-E-INTEGRACION.md). Compartir archivo no implica dependencia funcional; las pruebas base pueden empezar antes de repetirlas con las US nuevas.

## Cambio upstream y prevención de trabajo duplicado

El commit bea3fd1, ya incorporado en la rama de trabajo, agrega flex-1/min-h-0 y scroll vertical en la hoja médica. Es cobertura parcial del área de este ticket, pendiente de verificación visual. Completar SIG-BUG-01.1 sobre esa versión y corregir solo los problemas restantes. Los botones de asistencia agregados pertenecen a US-2.8, no a este bug visual. [Ver revisión e incorporación del commit](../../REVISION-COMMIT-bea3fd1.md).

## Fuente y situación actual

[Documento de análisis — sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md).

La captura del documento evidencia espacio inferior negro; la solución concreta depende del diagnóstico de SIG-BUG-01.1.

La evidencia de código corresponde a una revisión estática. Las verificaciones indicadas abajo están planificadas, no ejecutadas.

## Objetivo

Hacer que el fondo y el contenedor del portal cubran la ventana sin cortar contenido.

## Trabajo y entregable

- Aplicar la corrección mínima de alturas/flex/fondos definida por el diagnóstico.
- Mantener el ancho de contenido y el comportamiento de tablas; permitir desplazamiento cuando el contenido supera la ventana.
- Revisar efectos del shell compartido en las otras áreas.

## Criterios de aceptación

- [ ] **[Explícito en SIG-BUG-01]** No queda una franja negra innecesaria con contenido corto o tabla vacía.
- [ ] **[Propuesta técnica]** Con contenido largo se puede llegar al final sin recortes ni superposición.
- [ ] **[Propuesta técnica; soporte de dispositivos no definido]** En escritorio y móvil la hoja de trabajo mantiene filtros y tabla utilizables y consistencia con las otras áreas.

## Validación prevista

Comparar capturas antes/después en los tres tamaños del diagnóstico y ambos temas. Recorrer médico, paciente, enfermera y administrador. Ejecutar lint y typecheck después de implementar.

## Archivos a revisar

- [src/app/layout.tsx](../../../../src/app/layout.tsx)
- [src/app/globals.css](../../../../src/app/globals.css)
- [src/app/(portal)/layout.tsx](../../../../src/app/%28portal%29/layout.tsx)
- [src/app/(portal)/role-shell.tsx](../../../../src/app/%28portal%29/role-shell.tsx)

## Límite de alcance

No incorporar acciones de asistencia (US-2.8) ni cambiar permisos o navegación por rol (US-7.4).

## Revisión de requisitos, cobertura y dudas

Fecha: 13/10/2026. Esta revisión distingue reglas documentadas, propuestas de la fuente, implementación existente y supuestos del plan. Un dato observado en código no valida una regla de negocio.

### Requisito o regla correspondiente

RF-04 (consulta de la hoja de trabajo). La corrección del espacio negro y la consistencia visual se solicitan directamente en [Documento de sprint 2, sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md), SIG-BUG-01 CA1/CA2; RF-04 no define alturas CSS, tema ni tamaños de ventana. [Requerimientos funcionales](../../../../docs/requerimientos_funcionales.md).

### Historia o ticket que ya lo cubre

US-1.4, tarea 1.4.1, ya cubre la pantalla. Estos tickets corrigen su presentación. US-7.4 puede tocar el shell, pero no cubre por sí sola esta corrección. [Historias de sprint 1](../../../../docs/user_stories_sprint_1.md).

**Para esta tarea:** Corrección del mismo caso de SIG-BUG-01.1; debe usar su evidencia.

La cobertura encontrada es documental y local; no se consultó un tablero externo ni se afirma que esas historias estén terminadas.

### Qué es explícito y qué se estaba suponiendo

**Explícito en las fuentes:** La captura evidencia una franja negra y la fuente pide revisar contenedores, alturas y fondos; no exige nuevas funciones médicas.

**Supuesto o propuesta del primer plan:** El origen en flex/min-h-full/fondo oscuro es hipótesis técnica. Los tres tamaños de prueba y ambos temas fueron elegidos por el plan; no son dispositivos ni soporte de tema aprobados.

Las etiquetas de los criterios separan obligación explícita, interpretación pendiente y verificación técnica. Proponer tests, un helper o atributos accesibles no crea una regla de negocio nueva ni exige un acuerdo funcional sobre cada detalle técnico.

### Datos faltantes o contradictorios

Falta la causa reproducida. No imponer altura fija ni eliminar un tema como supuesto de solución.

**Dudas abiertas relacionadas:** [DU-01](../REVISION.md#du-01), [DU-12](../REVISION.md#du-12). No hay respuestas registradas; no se adopta una opción como regla por defecto.

### Tratamiento de la duda y alcance seguro

Mantener consistencia de la pantalla según la fuente; considerar móvil y distintos temas como verificaciones técnicas propuestas.

Los criterios condicionados se cierran solo cuando se documenta la definición que falta. Pueden continuar diagnóstico y revisión del comportamiento explícito; las expectativas dudosas no se implementan ni se convierten en pruebas que fijen una regla inventada.

Al completar, registrar evidencia y resultado en este ticket. Para código, indicar commit y comprobaciones realizadas; para definiciones, registrar el acuerdo. No marcar como terminado únicamente por existir código relacionado.

