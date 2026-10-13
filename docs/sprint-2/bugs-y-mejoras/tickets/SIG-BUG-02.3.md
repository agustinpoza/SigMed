# SIG-BUG-02.3 — Agregar regresiones de normalización y combinación de filtros del historial

| Campo | Valor |
| --- | --- |
| Sprint | 2 |
| Responsable | Usuario — Bugs y Mejoras |
| Tema padre | SIG-BUG-02 |
| Tipo de tarea | Pruebas de regresión |
| Prioridad propuesta | P1 |
| Estado inicial | Pendiente de corrección |
| Esfuerzo orientativo | 2 h |
| Predecesoras del plan de integración | [SIG-BUG-02.2](SIG-BUG-02.2.md) |

## Disponibilidad para arrancar

**Clasificación:** Arranque parcial sin consulta externa.

**Alcance que puede avanzar:** Preparar fixtures y cubrir la insensibilidad a mayúsculas explícita, además de preservación técnica de filtros/paginación existentes.

**Dependencia o definición relevante:** Los resultados esperados de tildes, ñ/n y campos nuevos siguen pendientes de SIG-BUG-02.1/02.2 y DU-04/DU-05.

**Límite de esta clasificación:** No cerrar la regresión del bug completo ni inventar resultados para las pruebas pendientes.

[Ver la clasificación de todos los tickets](../ARRANQUE.md). Esta sección no resuelve las dudas registradas ni modifica reglas de negocio; delimita el trabajo que puede empezar con lo ya definido.

## Precedencia y coordinación con otras US

**Predecesora o contrato:** SIG-BUG-02.2 para probar la corrección integrada; pruebas explícitas pueden prepararse antes.

**US/tareas relacionadas:** SIG-MEJ-02.2/02.3 y US-5.1.

**Coordinación y cierre:** Reutilizar la suite de resultados; aislamiento de datos del servidor pertenece a SIG-MEJ-02.3. No fijar expectativas aún dudosas.

[Ver el orden del sprint y la matriz de integración](../../ORDEN-E-INTEGRACION.md). Compartir archivo no implica dependencia funcional; las pruebas base pueden empezar antes de repetirlas con las US nuevas.

## Fuente y situación actual

[Documento de análisis — sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md).

El repositorio tiene scripts de verificación de base de datos y vacunación; no hay un runner de pruebas de UI declarado en package.json.

La evidencia de código corresponde a una revisión estática. Las verificaciones indicadas abajo están planificadas, no ejecutadas.

## Objetivo

Detectar futuras regresiones en la búsqueda sin duplicar literalmente su implementación.

## Trabajo y entregable

- Elegir el mecanismo mínimo adecuado para probar resultados con fixtures ficticios; documentar el comando.
- Cubrir acentos y mayúsculas definidos; para Unicode, vacío, coincidencia parcial y campos nulos separar preservación técnica de expectativas funcionales aún pendientes.
- Verificar resultados por profesional, tratamiento y diagnóstico junto con filtros y reinicio de paginación; reutilizar esta cobertura en SIG-MEJ-02.

## Criterios de aceptación

- [ ] **[Criterio técnico de pruebas]** Las pruebas se basan en resultados esperados, no en repetir el algoritmo.
- [ ] **[Condicionado a DU-03]** Al menos un caso de fallo confirmado en SIG-BUG-02.1 falla antes y pasa después; no usar una expectativa no definida para demostrar el bug.
- [ ] **[Propuesta técnica]** La suite corre con un comando documentado y sin credenciales ni datos clínicos reales.
- [ ] **[Solo casos definidos; DU-04 pendiente]** Se comprueban exclusión de resultados no coincidentes y el comportamiento definido de ñ.

## Validación prevista

Ejecutar la suite implementada y registrar salida/comando. Usar una prueba del componente o flujo cuando sea necesario para comprobar paginación; una prueba de helper no demuestra comportamiento de UI.

## Archivos a revisar

- [src/app/(portal)/paciente/historial/clinical-history-table.tsx](../../../../src/app/%28portal%29/paciente/historial/clinical-history-table.tsx)
- [package.json](../../../../package.json)

## Límite de alcance

No crear otro framework completo si basta un mecanismo ya disponible; no cubrir autenticación completa de US-7.2.

## Revisión de requisitos, cobertura y dudas

Fecha: 13/10/2026. Esta revisión distingue reglas documentadas, propuestas de la fuente, implementación existente y supuestos del plan. Un dato observado en código no valida una regla de negocio.

### Requisito o regla correspondiente

RF-18 aporta el contexto, pero no especifica reglas de búsqueda por acentos. La normalización y mayúsculas provienen de SIG-BUG-02 en [Documento de sprint 2, sección 02](../../../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md); hay un ejemplo ambiguo entre descripción y CA1. [Requerimientos funcionales](../../../../docs/requerimientos_funcionales.md).

### Historia o ticket que ya lo cubre

US-5.2 ya cubre consulta del historial y contiene un buscador en el diseño sin política de equivalencia. SIG-MEJ-02 define campos/ayuda; no duplicar esa mejora aquí. [Historias de sprint 1](../../../../docs/user_stories_sprint_1.md).

**Para esta tarea:** Pruebas solicitadas en la fuente, con cobertura compartida con SIG-MEJ-02.

La cobertura encontrada es documental y local; no se consultó un tablero externo ni se afirma que esas historias estén terminadas.

### Qué es explícito y qué se estaba suponiendo

**Explícito en las fuentes:** La fuente pide reproducir el posible fallo con tildes, normalizar acentos y agregar regresiones; exige insensibilidad a mayúsculas. El bug todavía requiere reproducción.

**Supuesto o propuesta del primer plan:** Se interpretó el caso como infeccion → Infección, aunque la fuente escribe «infección» al describir una búsqueda sin tilde. El comportamiento de ñ/n, diéresis, nombres completos, coincidencia parcial y vacío no queda especificado por ese CA.

Las etiquetas de los criterios separan obligación explícita, interpretación pendiente y verificación técnica. Proponer tests, un helper o atributos accesibles no crea una regla de negocio nueva ni exige un acuerdo funcional sobre cada detalle técnico.

### Datos faltantes o contradictorios

No hay una suite de UI ya acordada; la herramienta es una elección técnica, no requisito de negocio. No fijar resultados de ñ ni campos dudosos en tests.

**Dudas abiertas relacionadas:** [DU-03](../REVISION.md#du-03), [DU-04](../REVISION.md#du-04), [DU-05](../REVISION.md#du-05), [DU-12](../REVISION.md#du-12). No hay respuestas registradas; no se adopta una opción como regla por defecto.

### Tratamiento de la duda y alcance seguro

Los casos definidos se verifican; los casos sin decisión se listan pendientes, sin inventar expectativas ni marcarlos como aprobados.

Los criterios condicionados se cierran solo cuando se documenta la definición que falta. Pueden continuar diagnóstico y revisión del comportamiento explícito; las expectativas dudosas no se implementan ni se convierten en pruebas que fijen una regla inventada.

Al completar, registrar evidencia y resultado en este ticket. Para código, indicar commit y comprobaciones realizadas; para definiciones, registrar el acuerdo. No marcar como terminado únicamente por existir código relacionado.

