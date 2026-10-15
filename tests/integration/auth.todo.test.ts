import { describe, it } from "vitest";

// Marco de integración del responsable de US-7.2/7.4. Este archivo no simula
// getCurrentActor: los casos deben implementarse con HTTP y Clerk real cuando el
// entorno de pruebas lo permita. No cuentan como pruebas aprobadas de esta entrega.
describe("Integración pendiente de sesión real (US-7.2/7.4)", () => {
  it.todo("Repetir aislamiento por HTTP con sesión real y cookie/sesión inválida o vencida");
  it.todo("Sin sesión real, rechazar la escritura de stock sin atribuirla a ningún actor");
  it.todo("Con sesión real, comprobar responsable persistido y rechazo de suplantación desde la petición");
});
