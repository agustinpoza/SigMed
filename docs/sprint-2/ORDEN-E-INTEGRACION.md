# Sprint 2 — Aislamiento, precedencias y orden de integración

Fecha: 13/10/2026. Revisión de las 11 US nuevas y los 16 tickets de Bugs y Mejoras. Rama del usuario: sprint-2/bugs-y-mejoras.

**Los alcances están separados, pero la implementación no está totalmente aislada:** hay dependencias funcionales, infraestructura y archivos comunes. El plan anterior distinguía responsables; faltaba formalizar el orden entre historias y diferenciar inicio, integración y cierre. Esta revisión completa ese punto sin asignar al usuario las US del resto del equipo.

Fuentes: [Documento de sprint 2](../../DocumentacionSigMed/Sistema%20SigMed/Sprint%201/US,Bugs%20y%20Mejoras%20Sprint%202.docx.md); [Requerimientos funcionales](../../docs/requerimientos_funcionales.md); [Diccionario de datos y desvíos](../../docs/BD.md); [dudas](bugs-y-mejoras/REVISION.md); [trabajo que puede arrancar](bugs-y-mejoras/ARRANQUE.md). Un orden propuesto no resuelve una regla faltante por inferencia.

## Actualización de la base antes de implementar

La [revisión e incorporación del commit bea3fd1](REVISION-COMMIT-bea3fd1.md) identificó cambios de maquetación médica y controles parciales de asistencia. Ese commit ya está incorporado en sprint-2/bugs-y-mejoras por fast-forward. Volver a comprobar SIG-BUG-01 sobre esta base. SIG-MEJ-04, stock e historial no fueron modificados por ese commit. La presencia de botones sin integración no cierra US-2.8.

## Tipos de dependencia

Actualización del 14/10/2026: SIG-BUG-02.1/02.2/02.3 tienen diagnóstico, corrección y regresiones completados. [DEC-002](../decisiones.md#dec-002--normalización-de-la-búsqueda-del-historial) define DU-03/DU-04 y el matcher común; [ver evidencia](bugs-y-mejoras/SIG-BUG-02-IMPLEMENTACION.md). SIG-MEJ-02.1/02.2 conserva matriz/ayuda y reutiliza esta política. SIG-MEJ-02.3 debe verificar el servidor y la integración con identidad real.

Actualización del 14/10/2026: SIG-BUG-01.1 tiene diagnóstico completado y SIG-BUG-01.2 está implementado y verificado visualmente con datos ficticios. [Ver evidencia](bugs-y-mejoras/SIG-BUG-01-IMPLEMENTACION.md). El criterio DU-01 está registrado en [DEC-001](../decisiones.md#dec-001--alcance-de-la-corrección-visual-sig-bug-01). La dependencia de diagnóstico se cumplió; compartir el shell conserva la necesidad de repetir la regresión tras cambios de US-7.4/2.8, sin esperar esas US para corregir la presentación.

| Tipo | Significado |
| --- | --- |
| Funcional | El flujo final consume un resultado anterior definido por fuente/modelo: publicación requiere disponibilidad, registro clínico requiere turno ATENDIDO |
| Contrato técnico | Dos partes acuerdan datos/errores y pueden desarrollarse en paralelo: selector y acción de stock |
| Cierre de integración | Puede empezarse con lo existente/fixtures y repetirse al integrar otra historia: aislamiento con sesión real |
| Coordinación por archivo | Riesgo de merge, sin dependencia funcional: rótulo y buscador del historial |
| Definición pendiente | El orden no completa el dato faltante: quién crea la reserva previa a confirmar |

## Límites entre Bugs y Mejoras y las US nuevas

| Bloque | Alcance propio | Relación con US nuevas | Trabajo que queda fuera |
| --- | --- | --- | --- |
| SIG-BUG-01 | Alturas/fondos/franja negra | US-7.4 cambia shell y US-2.8 añade acciones a la hoja | Navegación, permisos y asistencia |
| SIG-MEJ-01 | Rótulo y expansión del historial | US-5.1 produce datos; US-7.5 puede cambiar acceso | Carga clínica y selección de pacientes/permisos |
| SIG-BUG-02 / SIG-MEJ-02 | Normalización, campos/ayuda y regresión de aislamiento | US-5.1, US-7.2/7.4/7.5 | US-2.1 busca turnos, no historial; autenticación y escritura clínica son de sus US |
| SIG-MEJ-03 | Entrada positiva, signo interno y verificación del stock existente | US-7.2/7.4 para identidad/permiso | Completar inventario US-3.2, cambiar guard o modelo de saldos por inferencia |
| SIG-MEJ-04 | Mensajes y estados de disponibilidad del vacunatorio | US-7.2/7.4; US-3.6/RF-31 existentes | Agenda médica US-1.1/1.2 y confirmación médica US-2.2; ciclo de vacunación DU-09 |

**No hay duplicación necesaria de alcance**, pero sí regresiones compartidas: stock/no negativo ya están en US-3.2; aislamiento está en US-5.2. Reutilizar las verificaciones después de los ajustes; no presentarlas como funciones nuevas. La continuidad de esas historias existentes no se absorbe como responsabilidad del usuario.

## Interfaces y archivos compartidos

| Interfaz actual | Trabajo que converge | Coordinación |
| --- | --- | --- |
| [getCurrentActor / dev-actor.ts](../../src/lib/dev-actor.ts) | US-7.2 y todos los módulos con actor | Acordar identidad/perfil/rol; el actor actual es de desarrollo, no sesión real |
| [actor-guard.ts](../../src/lib/actor-guard.ts) | US-7.2/7.4 y SIG-MEJ-03.3 | Actor real y autorización; el fallback no demuestra responsable |
| [Layout del portal](../../src/app/%28portal%29/layout.tsx) y [RoleShell](../../src/app/%28portal%29/role-shell.tsx) | SIG-BUG-01 y US-7.4/7.5 | Separar CSS de permisos/navegación; repetir prueba visual después de integrar |
| [Hoja médica](../../src/app/ui/medico/tabla-trabajo.tsx) | US-2.8 y US-7.5 | Acciones/estados y profesional seleccionado; no resolver permisos dentro del bug visual |
| [Tabla del historial](../../src/app/%28portal%29/paciente/historial/clinical-history-table.tsx) | SIG-MEJ-01.2, SIG-BUG-02.2 y SIG-MEJ-02.2 | Una sola búsqueda; coordinar commits del mismo archivo sin dependencia funcional artificial |
| [Consulta del historial](../../src/app/%28portal%29/paciente/historial/page.tsx) | US-5.1 y US-7.2/7.5; SIG-MEJ-02.3 verifica | Contrato de datos y filtro por paciente; no quitar aislamiento al dar funciones al administrador |
| [Esquema](../../prisma/schema.prisma) y migraciones | Usuarios, agenda, estados, clínica y permisos | Coordinar cambios del modelo antes de integrar; la existencia de tablas no completa el flujo |

Compartir archivo no exige una sola rama ni esperar todos los cambios. Mantener cambios pequeños y commits referenciados por ID. Se conserva la rama solicitada para Bugs y Mejoras; no se crearon ramas ni tickets nuevos para los demás responsables.

## Fronteras que deben tener un único responsable

- **US-7.2:** identidad y sesión válida, acceso cuando no hay sesión, navegación de entrada/salida. **US-7.4:** autorización por rol y menú de ese rol. Ambos CA hablan de rutas protegidas; deben usar una misma protección con comprobaciones de sesión y permiso, no dos implementaciones incompatibles. **US-7.5:** extensión administrativa autorizada y auditoría sobre esa misma matriz.
- **US-7.1 y US-7.3:** usan la misma provisión de cuenta/perfil, con distinto rol permitido y distinto actor autorizado. No duplicar el sistema de identidad ni trasladar alta de personal al registro público de pacientes.
- **US-1.1 y US-1.5 existente:** comparten persistencia de horarios; DU-13 decide la frontera de carga/edición. La publicación de US-1.2 consume esa disponibilidad; no crea un segundo modelo de agenda.
- **US-2.1 y US-2.2:** el responsable de crear la reserva previa no está definido. DU-14 es un hueco que debe resolverse antes del circuito integrado, no una tarea que Bugs y Mejoras deba absorber.
- **US-2.8 y US-5.1:** asistencia cambia el estado a ATENDIDO; registro clínico guarda contenido sobre un turno válido. No duplicar el cambio de asistencia dentro de la carga clínica ni omitirlo porque el formulario permite escribir.
- **SIG-BUG-02 y SIG-MEJ-02:** equivalencias del texto en el bug; campos y ayuda en la mejora; regresión de aislamiento en SIG-MEJ-02.3. Comparten un filtro y se integran sin dos soluciones distintas.

## Precedencias de las 11 US nuevas

| US | Requisito para integrar el flujo | Qué puede avanzar antes | Observación |
| --- | --- | --- | --- |
| US-7.2 Inicio de sesión | Perfil/cuenta válida y contrato de identidad/rol | Sesión y formulario con identidades de prueba acordadas | Se integra con 7.1/7.3; evitar dependencia circular registro→login→registro. DU-15 |
| US-7.1 Registro de pacientes | Provisión de cuenta y vínculo con perfil PACIENTE | Formulario/validaciones tras acordar contrato con 7.2 | No necesita esperar toda 7.2 para programarse. DU-15 |
| US-7.4 Interfaz por rol | Identidad/rol de 7.2 para protección real | Matriz, rutas y navegación con contrato | Definir permisos base y excepciones de 7.5 conjuntamente; cierre exige sesión real |
| US-7.3 Registro del personal | Admin autenticado/autorizado de 7.2/7.4 y provisión de cuenta | Formulario/validaciones y contrato de alta | Primer admin real no se resuelve solo con seed. DU-15 |
| US-1.1 Disponibilidad mensual | Médico identificado, vigencia y permisos definidos | Diseño y validaciones no controvertidas | RF-27/US-1.5 limita modificación a admin; modelo actual es semanal. DU-13 |
| US-1.2 Publicación automática | Disponibilidad persistida de 1.1 y estados de ocupación | Servicio con contrato/modelo acordado | No decidir por inferencia vigencia o estados ocupados. DU-13/DU-14 |
| US-2.1 Búsqueda de turnos | Oferta de 1.2, filtros y disponibilidad | Panel/consultas con fixtures | No está asignada claramente la creación de reserva antes de confirmar. DU-14 |
| US-2.2 Confirmación | Reserva válida del paciente y protección concurrente | Resumen/acción con una reserva ficticia válida | No confirmar solo un slot sin aclarar reserva y responsable. DU-14 |
| US-2.8 Asistencia | Turno propio y cambio de estado autorizado | Acciones sobre turnos existentes de US-1.4 | No espera toda agenda nueva para empezar; se prueba tras reservar/confirmar en el circuito nuevo |
| US-5.1 Registro clínico | Turno ATENDIDO y médico autorizado, según modelo | Formulario/persistencia con turno atendido existente | 2.8 habilita estado en el circuito nuevo. Admin se coordina con 7.5/DU-06 |
| US-7.5 Funciones administrativas | Autorización base y funciones médico/paciente que se delegan | Definir matriz, contexto y auditoría desde el inicio | Cierre tras funciones objetivo; no conceder permiso universal ni esperar al final para definir matriz |

Las precedencias del flujo no imponen una única secuencia de programación. Se pueden desarrollar UI/servicios/pruebas con contratos y fixtures sin que sus proveedores estén completamente terminados.

## Cadena funcional del circuito nuevo

~~~mermaid
flowchart LR
  A["US-1.1 Disponibilidad"] --> B["US-1.2 Publicación"]
  B --> C["US-2.1 Búsqueda"]
  C -. "DU-14: transición y responsable pendiente" .-> R["Reserva previa válida"]
  R --> D["US-2.2 Confirmación"]
  D --> E["US-2.8 Asistencia"]
  E --> F["US-5.1 Registro sobre ATENDIDO"]
  F --> G["US-5.2 Historial existente: integrar"]
~~~

La línea punteada es un hueco de definición, no una US nueva inventada. Asistencia y registro clínico también avanzan con turnos existentes válidos, sin esperar toda la cadena nueva.

~~~mermaid
flowchart TD
  I["Contrato de identidad/cuenta/rol DU-15"] --> L["US-7.2 Sesión"]
  I --> P["US-7.1 Alta paciente"]
  L --> K["US-7.4 Autorización base"]
  K --> N["US-7.3 Alta personal con admin válido"]
  I --> N
  K --> M["US-7.5 Cierre de funciones administrativas"]
  F["Funciones médico/paciente integradas"] --> M
~~~

La matriz de 7.5 se define temprano con 7.4; el nodo final expresa su cierre. Registro y sesión comparten contrato; no se exige uno terminado para iniciar el otro.

## Orden propuesto para el equipo

1. **Contratos y dudas:** identidad/cuenta/rol, matriz base y administrativa, disponibilidad y estados. Registrar DU-13/14/15 sin inventar respuestas. Preparar diagnósticos y acuerdos de rótulos/campos.
2. **Base de acceso:** US-7.2 y US-7.1 con contrato común; integrar US-7.4, la matriz de US-7.5 y US-7.3 con admin válido. No implementar dos sistemas de permisos.
3. **Trabajo independiente:** Bugs y Mejoras puede avanzar vacunación SIG-MEJ-04.1/04.2, stock SIG-MEJ-03.1/03.2 y visual tras diagnóstico. Preparar regresiones base; repetirlas con identidad real.
4. **Agenda y reservas:** aclaradas DU-13/14, integrar US-1.1 → US-1.2 → US-2.1 → reserva previa con responsable definido → US-2.2. Componentes pueden programarse en paralelo con contratos estables.
5. **Asistencia y clínica:** integrar US-2.8 → US-5.1 en el nuevo circuito. Ambas pueden avanzar antes con turnos existentes. Verificar llegada a US-5.2.
6. **Cierre por rol:** completar US-7.5 con funciones objetivo y permisos definidos; repetir aislamiento, trazabilidad y verificaciones visuales/operativas tras merges. Ninguna integración resuelve por sí sola una duda de negocio.

Son etapas de integración, no semanas fijas ni reasignación de responsables.

## Precedencias internas de Bugs y Mejoras

| Cadena | Precedencia para integración | Qué no bloquea el inicio |
| --- | --- | --- |
| Visual | SIG-BUG-01.1 → SIG-BUG-01.2 | 7.4/2.8 requieren coordinación y repetición de prueba, no esperar para corregir CSS |
| Texto | Acuerdo SIG-MEJ-01.1 → SIG-MEJ-01.2 | Búsqueda y rótulo comparten archivo, pero son funcionalmente independientes |
| Búsqueda | SIG-BUG-02.1 → definiciones aplicables → SIG-BUG-02.2 → SIG-BUG-02.3 | Se pueden preparar fixtures/tests de lo explícito antes |
| Campos/ayuda | SIG-MEJ-02.1 → SIG-MEJ-02.2; normalización compartida cuando se requiera | US-5.1 no bloquea ajustar historial con datos existentes |
| Aislamiento | SIG-MEJ-02.3 base ahora; repetir tras buscador y 7.2/7.4 | No inventar matriz administrativa para poder probar pacientes A/B |
| Stock | Contrato UI/acción → SIG-MEJ-03.1 + 03.2 → 03.3 integrada | UI/backend pueden avanzar en paralelo; identidad ausente impide cierre de atribución completa |
| Vacunación | Contrato estados/mensajes → SIG-MEJ-04.1 + 04.2 → 04.3 integrada | No depende de agenda médica; botón pendiente no impide validación de servidor |

Para una sola persona se conserva el orden práctico de [ARRANQUE.md](bugs-y-mejoras/ARRANQUE.md): vacunación, stock, visual y regresiones. No es obligación de terminar frontend antes de empezar backend.

## Matriz individual de los tickets

| Ticket | Predecesora o contrato | Relación con otras US/tareas | Coordinación y cierre |
| --- | --- | --- | --- |
| [SIG-BUG-01.1](bugs-y-mejoras/tickets/SIG-BUG-01.1.md) | Ninguna para diagnosticar. | US-7.4 y US-2.8 | Diagnosticar alturas/fondos, sin editar navegación, permisos o asistencia. No esperar esas US para reproducir. |
| [SIG-BUG-01.2](bugs-y-mejoras/tickets/SIG-BUG-01.2.md) | SIG-BUG-01.1: causa reproducida. | US-7.4 y US-2.8 | Corregir CSS existente; coordinar si cambia el shell y repetir prueba visual tras integración. No agregar acciones médicas. |
| [SIG-BUG-02.1](bugs-y-mejoras/tickets/SIG-BUG-02.1.md) | Ninguna para reproducir variantes. | SIG-MEJ-02.1, US-5.1 y US-5.2 existente | Distinguir acentos de campos buscables. Investigar con datos ficticios existentes sin esperar la nueva carga clínica. |
| [SIG-BUG-02.2](bugs-y-mejoras/tickets/SIG-BUG-02.2.md) | SIG-BUG-02.1 y definiciones aplicables DU-03/DU-04. | SIG-MEJ-02.1/02.2 y US-5.1 | Una sola normalización; campos/ayuda pertenecen a SIG-MEJ-02. Coordinar el archivo, no absorber búsqueda de turnos de US-2.1. |
| [SIG-BUG-02.3](bugs-y-mejoras/tickets/SIG-BUG-02.3.md) | SIG-BUG-02.2 para probar la corrección integrada; pruebas explícitas pueden prepararse antes. | SIG-MEJ-02.2/02.3 y US-5.1 | Reutilizar la suite de resultados; aislamiento de datos del servidor pertenece a SIG-MEJ-02.3. No fijar expectativas aún dudosas. |
| [SIG-MEJ-01.1](bugs-y-mejoras/tickets/SIG-MEJ-01.1.md) | Ninguna para preparar alternativas; acuerdo DU-02 para cerrar. | SIG-MEJ-01.2 y US-5.1/5.2 | Definir texto del detalle existente; no prometer o agregar datos clínicos. |
| [SIG-MEJ-01.2](bugs-y-mejoras/tickets/SIG-MEJ-01.2.md) | Acuerdo de SIG-MEJ-01.1. | SIG-BUG-02.2, SIG-MEJ-02.2 y US-5.1 | Comparte clinical-history-table.tsx con búsqueda, pero no depende funcionalmente de ella. Coordinar merges y verificar expansión con datos integrados. |
| [SIG-MEJ-02.1](bugs-y-mejoras/tickets/SIG-MEJ-02.1.md) | Ninguna para preparar matriz; DU-04/DU-05 para cerrar. | SIG-BUG-02.1, SIG-MEJ-02.2 y US-5.2 | Definir campos/ayuda una sola vez; el buscador de turnos de US-2.1 es otro caso. |
| [SIG-MEJ-02.2](bugs-y-mejoras/tickets/SIG-MEJ-02.2.md) | SIG-MEJ-02.1; SIG-BUG-02.2 para integrar equivalencias acordadas. | SIG-MEJ-01.2, SIG-BUG-02.3 y US-5.1 | Ayuda/campos aquí, equivalencias en el bug. Rótulos comparten archivo pero no bloquean la función. Verificar con contrato de datos del historial. |
| [SIG-MEJ-02.3](bugs-y-mejoras/tickets/SIG-MEJ-02.3.md) | Ninguna para regresión base; repetir tras SIG-MEJ-02.2. | US-7.2/7.4/7.5 y US-5.1 | Arrancar pruebas A/B sobre lo existente. Para cerrar permisos reales repetir con sesión de US-7.2/7.4; acceso administrativo requiere DU-06 y US-7.5, sin inventar su matriz. |
| [SIG-MEJ-03.1](bugs-y-mejoras/tickets/SIG-MEJ-03.1.md) | Contrato operación/cantidad con SIG-MEJ-03.2. | US-3.2 existente y US-7.4 | UI y backend pueden avanzar en paralelo tras acordar contrato. Integrar selector y acción; no decidir indicador DU-07 ni cambiar guard/saldo. |
| [SIG-MEJ-03.2](bugs-y-mejoras/tickets/SIG-MEJ-03.2.md) | Contrato de la nueva entrada; SIG-MEJ-03.1 para probar UI integrada. | SIG-MEJ-03.3, US-3.2 existente y US-7.2/7.4 | Validar y aplicar signo una vez; no prohibir negativos en todo el dominio ni implementar identidad desde el formulario. |
| [SIG-MEJ-03.3](bugs-y-mejoras/tickets/SIG-MEJ-03.3.md) | SIG-MEJ-03.2 para entrada integrada; stock existente puede probarse antes. | US-7.2/7.4 y US-3.2 existente | Verificar stock por separado. Cierre completo de atribución necesita actor real y DU-08 resuelta; coordinar actor-guard sin validar automáticamente su fallback. |
| [SIG-MEJ-04.1](bugs-y-mejoras/tickets/SIG-MEJ-04.1.md) | Contrato de estados del servicio de slots existente. | US-3.6 existente, SIG-MEJ-04.2/04.3 y US-7.4 | Mensaje de vacío de vacunación; no depende de agenda médica US-1.1/1.2. Coordinar cliente/servidor y preservar ciclo, duración e interacción pendiente. |
| [SIG-MEJ-04.2](bugs-y-mejoras/tickets/SIG-MEJ-04.2.md) | Contrato de mensajes con SIG-MEJ-04.1; ambas capas pueden programarse en paralelo. | US-3.6/RF-31 existentes y US-7.2/7.4 | Corregir error sin cupos vs selección, sin crear otro ciclo/dosis. DU-09 se coordina con vacunación; no se transfiere a US-2.2 de turnos médicos. |
| [SIG-MEJ-04.3](bugs-y-mejoras/tickets/SIG-MEJ-04.3.md) | SIG-MEJ-04.1/04.2 para regresión integrada; carga actual puede revisarse antes. | US-3.6 existente y US-7.2/7.4 | Verificar última fecha y errores vigentes. No redefinir duración, cupos o franjas; repetir si cambia externamente identidad/flujo de vacunación. |

## Dudas nuevas sobre límites entre US

- **[DU-13](bugs-y-mejoras/REVISION.md#du-13):** disponibilidad mensual, carga inicial/edición exclusiva de admin y vigencia mensual frente al modelo semanal.
- **[DU-14](bugs-y-mejoras/REVISION.md#du-14):** quién crea reserva antes de confirmar y qué estados ocupan horario. No fijar caducidad, estados nuevos ni dueño del trabajo por inferencia.
- **[DU-15](bugs-y-mejoras/REVISION.md#du-15):** contrato cuenta/perfil/rol/sesión y primer administrador real. El seed no prueba cuenta autenticable.

DU-06/08/09 siguen afectando cierre de permisos, trazabilidad y vacunación. Las dudas no son respuestas ni nuevas tareas asignadas al usuario.

## Validación de la planificación

Cobertura: 11 US y 16 tickets. Se verifica consistencia de enlaces, IDs y cadenas sin ciclos artificiales. No se ejecutaron pruebas funcionales, no se cambiaron reglas ni se implementaron las US.
