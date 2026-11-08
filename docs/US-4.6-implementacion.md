# US 4.6 — Descarga de facturas y comprobantes digitales (implementación)

## Resumen
Paciente autenticado (`PACIENTE`) puede listar y descargar sus propias facturas/comprobantes (RF-16). El acceso se valida por propiedad (`invoice.patientId === actor.id`).

## Modelo de datos
- `Invoice` (`prisma/schema.prisma`, tabla `factura`, migración `20261108152146_add_invoice_table`): `patientId`, `date`, `type`, `number` (único), `amount`, `status` (`PENDIENTE|PAGADA|ANULADA`), `filePath` (nombre/ruta relativa dentro de `public/invoices/`).
- Nota: difiere del ticket de planificación original (`fileUrl/createdAt`); la implementación usa `filePath` y campos de comprobante.

## APIs (protegidas por actor)
- `GET /api/patient/invoices?page=&size=&from=&to=` — `src/app/api/patient/invoices/route.ts`. Requiere `getCurrentActor()` con rol `PACIENTE`; devuelve `{ data, total, page, size }` solo del paciente.
- `GET /api/patient/invoices/:id/download` — `src/app/api/patient/invoices/[id]/download/route.ts`. Requiere paciente; resuelve archivo vía service (ownership); responde `404` si no existe/no pertenece; lee desde `public/invoices/<basename(filePath)>`; headers `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="..."`.

## Servicio
- `src/services/invoiceService.ts`: `listInvoices(patientId, {page,size,from,to})`, `getInvoiceFile(patientId, invoiceId)` (retorna `filePath` solo si es dueño).

## UI
- `src/app/(portal)/paciente/facturas/page.tsx` + `invoice-list.tsx`: lista con fecha/tipo/número/monto/estado y botón Descargar; estado vacío cuando no hay facturas. Enlace agregado en `src/app/(portal)/paciente/page.tsx`.

## Almacenamiento y seguridad
- Archivos servidos solo por API desde `public/invoices/` (no exponer rutas directas sensibles fuera del flujo). Download usa `basename` para evitar path traversal. Autorización por paciente en service y rutas; no se filtra existencia de facturas ajenas (404).

## Pruebas / CI
- Unit: `src/services/invoiceService.test.ts` (mock Prisma).
- Integración: `tests/integration/us-4-6.test.ts` (DB real aislada, crea facturas/archivos temporales, verifica listado propio, descarga con attachment, acceso ajeno 404, sin sesión 401).
- Script: `npm run test:us4.6`.
