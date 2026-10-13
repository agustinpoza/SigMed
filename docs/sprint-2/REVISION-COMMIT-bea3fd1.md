# Revisión del commit bea3fd1 frente al sprint 2

Fecha: 13/10/2026. Revisión previa a continuar SIG-MEJ-04, a pedido del usuario.

## Incorporación completada

Por solicitud del usuario, se incorporó origin/main a sprint-2/bugs-y-mejoras mediante git merge --ff-only origin/main. La rama activa quedó en bea3fd1, sin conflictos ni commit de merge adicional. Se verificó que los 63 archivos locales de documentación conservaran exactamente su contenido durante la integración. main local permanece en a91fec5: esta actualización se hizo únicamente en la rama de trabajo solicitada.

La implementación de SIG-MEJ-04 todavía no se retomó. SIG-BUG-01 debe reproducirse sobre esta base actualizada; la integración no declara resuelta la corrección visual ni implementa asistencia.

## Estado de Git verificado antes de la incorporación

| Referencia | Commit |
| --- | --- |
| Rama activa sprint-2/bugs-y-mejoras | a91fec5 |
| main local | a91fec5 |
| origin/main | bea3fd1 |
| refs/heads/main del remoto, consultado con git ls-remote | bea3fd1 |

El reflog de origin/main registra su actualización por pull el 13/10/2026 a las 19:46:01, hora de Buenos Aires. El commit fue descargado y la referencia remota quedó actualizada; no está incorporado en main local ni en la rama activa. Ambas están exactamente un commit detrás. Esta revisión no hizo merge, rebase ni cambios funcionales. Antes de evaluar o implementar el bug visual debe integrarse ese commit y reproducirse sobre esa versión.

La solicitud de SIG-MEJ-04 se interrumpió durante lecturas. El diff de archivos rastreados estaba vacío: no había implementación local que compitiera con el nuevo commit. Documentación y tickets siguen como archivos sin seguimiento, conservados.

## Cambios revisados

Commit: bea3fd1f823c50e00ba725a902aab5b7613407bb, Actualización US-1.4, del 13/10/2026 a las 19:44:31. Tres archivos, 21 líneas agregadas y 10 eliminadas.

| Archivo | Cambio |
| --- | --- |
| src/app/(portal)/medico/agenda/page.tsx | Agrega flex-1 y min-h-0 a la sección de la hoja médica |
| src/app/ui/medico/tabla-trabajo.tsx | Contenedor flexible con scroll vertical, encabezado sticky y botones Atendido/Ausente condicionales |
| src/app/(portal)/medico/page.tsx | Reemplaza el texto de inicio por el Placeholder compartido del área médica |

## Impacto sobre tareas existentes

| Ticket o US | Cobertura aportada | Trabajo que continúa pendiente |
| --- | --- | --- |
| [SIG-BUG-01.1](bugs-y-mejoras/tickets/SIG-BUG-01.1.md) | Existe ahora un ajuste de alturas/scroll a revisar | Reproducir sobre bea3fd1 y comprobar si desapareció la franja negra; actualizar diagnóstico, no analizar únicamente a91fec5 |
| [SIG-BUG-01.2](bugs-y-mejoras/tickets/SIG-BUG-01.2.md) | Solapamiento parcial de maquetación | No repetir flex-1/min-h-0 por defecto; corregir solo lo que permanezca después de pruebas de ventana/tema/contenido |
| US-2.8.1 | Agrega código para controles Atendido/Ausente | La condición compara el enum con una etiqueta de presentación y no coincide; falta comportamiento de los controles |
| US-2.8.2 / US-2.8.3 | No hay backend ni integración en este commit | Persistencia, autorización por médico y actualización efectiva siguen pendientes |
| [SIG-MEJ-03.1](bugs-y-mejoras/tickets/SIG-MEJ-03.1.md) / [03.2](bugs-y-mejoras/tickets/SIG-MEJ-03.2.md) / [03.3](bugs-y-mejoras/tickets/SIG-MEJ-03.3.md) | Ninguna | Los cambios de stock continúan pendientes |
| [SIG-MEJ-04.1](bugs-y-mejoras/tickets/SIG-MEJ-04.1.md) / [04.2](bugs-y-mejoras/tickets/SIG-MEJ-04.2.md) / [04.3](bugs-y-mejoras/tickets/SIG-MEJ-04.3.md) | Ninguna | Mensajes, validación sin horarios y recuperación al cambiar fecha siguen pendientes |
| SIG-MEJ-01, SIG-BUG-02 y SIG-MEJ-02 | Ninguna | Rótulos, búsqueda y regresiones del historial mantienen su alcance |
| Otras US nuevas | No hay implementación de sus flujos en el diff | Un Placeholder del médico no equivale a autorización por rol ni al cierre de US-7.4 |

No se marca ningún ticket terminado por el título del commit ni por la existencia de clases CSS.

## Observación sobre los controles de asistencia

La condición nueva usa t.status === ETIQUETAS_ESTADO.CONFIRMADO. El estado persistido es CONFIRMADO, mientras que ETIQUETAS_ESTADO.CONFIRMADO vale Confirmado. La comparación es falsa; los botones no se muestran para un turno confirmado. El archivo de etiquetas no cambió entre la rama y el commit revisado.

Además, los botones no tienen acción asociada, formulario de escritura ni evento para persistir asistencia. Esto corresponde al trabajo de US-2.8, no a la corrección visual de SIG-BUG-01. La comprobación de constantes usa Node con eliminación nativa de tipos; el intento previo con tsx falló por un error del entorno uv_os_get_passwd. No se ejecutó una prueba de navegador o de escritura en base de datos.

## Próximo paso

La base de la rama de trabajo ya se actualizó con el commit remoto. SIG-MEJ-04 conserva su alcance implementable; SIG-BUG-01 requiere una nueva comprobación visual sobre la versión actualizada para evitar trabajo duplicado. La implementación continúa pendiente; la incorporación de Git está completada.
