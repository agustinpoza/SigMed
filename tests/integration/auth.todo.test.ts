import { describe, it } from "vitest";

// Marco de integración del responsable de US-7.2/7.4. Este archivo no simula
// getCurrentActor: los casos deben implementarse con HTTP y el proveedor real
// cuando estén disponibles. No cuentan como pruebas aprobadas de esta entrega.
describe("Integración pendiente de sesión real (US-7.2/7.4)", () => {
  it.todo("Repetir aislamiento por HTTP con sesión real y cookie/sesión inválida o vencida");
  it.todo("Sin sesión real de stock, rechazar escritura sin atribuirla al fallback de desarrollo");
  it.todo("Con sesión real, comprobar responsable persistido y rechazo de suplantación desde la petición");
});
