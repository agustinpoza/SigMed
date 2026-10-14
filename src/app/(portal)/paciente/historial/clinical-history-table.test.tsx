// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import ClinicalHistoryTable, { type ClinicalHistoryEntry } from "./clinical-history-table";

const records: ClinicalHistoryEntry[] = [
  { id: "respiratoria", date: "2026-10-14T12:00:00Z", doctor: "Gómez, Martín", specialty: "Clínica médica", diagnosis: "Infección respiratoria alta", treatment: "Reposo", indications: "Control en 72 horas" },
  { id: "dermatitis", date: "2026-10-13T12:00:00Z", doctor: "Pérez, Ana", specialty: "Dermatología", diagnosis: "Dermatitis", treatment: "Crema húmeda", indications: "Aplicar ungüento" },
  { id: "alergia", date: "2026-10-12T12:00:00Z", doctor: "Muñoz, Lucía", specialty: "Pediatría", diagnosis: "Niño con alergia", treatment: null, indications: "Evitar exposición" },
  { id: "localizada", date: "2026-10-11T12:00:00Z", doctor: "Ferrer, Álvaro", specialty: "Traumatología", diagnosis: "Infeccio\u0301n localizada", treatment: null, indications: null },
];
const infections = [records[0].diagnosis, records[3].diagnosis];

afterEach(cleanup);

function setup(entries: ClinicalHistoryEntry[] = records) {
  return render(<ClinicalHistoryTable records={entries} />);
}
function search(query: string) {
  fireEvent.change(screen.getByRole("searchbox"), { target: { value: query } });
  fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
}
function diagnoses() {
  return within(screen.getByRole("table")).getAllByRole("row")
    .filter((row) => row.querySelectorAll("td").length === 5)
    .map((row) => row.querySelectorAll("td")[2].textContent);
}
function paginatedRecords(): ClinicalHistoryEntry[] {
  return Array.from({ length: 7 }, (_, index) => ({
    ...records[0], id: `atencion-${index + 1}`,
    date: `2026-10-${String(index + 1).padStart(2, "0")}T12:00:00Z`,
    diagnosis: `Infección de prueba ${index + 1}`,
  }));
}

describe("SIG-BUG-02: resultados de búsqueda del historial", () => {
  it.each(["infeccion", "infección", "INFECCIÓN", "INFECCION", "infeccio\u0301n"])(
    "encuentra las mismas atenciones con %s, incluidos datos Unicode descompuestos", (query) => {
      setup(); search(query); expect(diagnoses()).toEqual(infections);
    },
  );

  it.each(["alta", "ALTA"])("conserva el control que ya funciona: %s", (query) => {
    setup(); search(query); expect(diagnoses()).toEqual([records[0].diagnosis]);
  });

  it.each(["Martin", "Martín", "MARTÍN", "Martin Gomez", "Gómez, Martín", "Gomez Martin", "Martin, Gomez"])(
    "encuentra al profesional existente con %s", (query) => {
      setup(); search(query); expect(diagnoses()).toEqual([records[0].diagnosis]);
    },
  );

  it.each(["nino", "NIÑO", "munoz", "MUÑOZ"])("aplica la equivalencia definida de ñ/n en %s", (query) => {
    setup(); search(query); expect(diagnoses()).toEqual([records[2].diagnosis]);
  });

  it.each(["unguento", "UNGÜENTO"])("encuentra texto con diéresis mediante %s", (query) => {
    setup(); search(query); expect(diagnoses()).toEqual([records[1].diagnosis]);
  });

  it.each(["gomez", "clinica", "respiratoria", "reposo", "72", "14/10/2026"])(
    "conserva los campos y el formato de fecha existentes: %s", (query) => {
      setup(); search(query); expect(diagnoses()).toEqual([records[0].diagnosis]);
    },
  );

  it("admite términos en distintos campos de una misma atención, en cualquier orden", () => {
    setup(); search("reposo martin alta"); expect(diagnoses()).toEqual([records[0].diagnosis]);
  });

  it("ignora espacios repetidos y tabulaciones entre términos", () => {
    setup(); search("  alta\t INFECCION  "); expect(diagnoses()).toEqual([records[0].diagnosis]);
  });

  it.each(["infeccion inexistente", "respiratoria dermatitis"])(
    "exige todos los términos dentro de la misma atención: %s", (query) => {
      setup(); search(query); expect(diagnoses()).toEqual([]);
      expect(screen.getByText("0 resultados")).toBeTruthy();
      expect(screen.getByText("No se encontraron atenciones con esos filtros.")).toBeTruthy();
    },
  );

  it("conserva coincidencias parciales sin exigir palabras completas", () => {
    setup(); search("respirat"); expect(diagnoses()).toEqual([records[0].diagnosis]);
  });

  it("una consulta vacía o solo con separadores recupera el filtro activo", () => {
    setup(); fireEvent.click(screen.getByRole("radio", { name: "Con tratamiento" }));
    search("alta"); expect(diagnoses()).toEqual([records[0].diagnosis]);
    for (const query of ["", "   ", ", ,"]) {
      search(query); expect(diagnoses()).toEqual([records[0].diagnosis, records[1].diagnosis]);
    }
  });

  it("combina búsqueda con filtros de tratamiento e indicaciones", () => {
    setup(); search("infeccion"); expect(diagnoses()).toEqual(infections);
    fireEvent.click(screen.getByRole("radio", { name: "Con tratamiento" }));
    expect(diagnoses()).toEqual([records[0].diagnosis]);
    fireEvent.click(screen.getByRole("radio", { name: "Con indicaciones" }));
    expect(diagnoses()).toEqual([records[0].diagnosis]);
    search("localizada"); expect(diagnoses()).toEqual([]);
    fireEvent.click(screen.getByRole("radio", { name: "Todas" }));
    expect(diagnoses()).toEqual([records[3].diagnosis]);
  });

  it("conserva orden y paginación sobre resultados normalizados", () => {
    const entries = paginatedRecords(); setup(entries); search("infeccion");
    expect(diagnoses()).toEqual(entries.slice(2).reverse().map((entry) => entry.diagnosis));
    expect(screen.getByText("1-5 de 7 resultados")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(diagnoses()).toEqual([entries[1].diagnosis, entries[0].diagnosis]);
    expect(screen.getByText("6-7 de 7 resultados")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Ordenar por"), { target: { value: "oldest" } });
    expect(diagnoses()).toEqual(entries.slice(0, 5).map((entry) => entry.diagnosis));
    expect(screen.getByText("1-5 de 7 resultados")).toBeTruthy();
  });

  it("una búsqueda nueva vuelve a página 1 aunque solo quede un resultado", () => {
    const entries = paginatedRecords(); entries[6].diagnosis = "Infección específica";
    setup(entries); fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    search("infeccion especifica"); expect(diagnoses()).toEqual(["Infección específica"]);
    expect(screen.getByText("1 / 1")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Anterior" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Siguiente" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("cambiar filtro también vuelve a página 1", () => {
    setup(paginatedRecords()); fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    fireEvent.click(screen.getByRole("radio", { name: "Con tratamiento" }));
    expect(screen.getByText("1 / 2")).toBeTruthy();
    expect(screen.getByText("1-5 de 7 resultados")).toBeTruthy();
  });

  it("conserva textos originales, registros de entrada y detalle de indicaciones", () => {
    const entries = structuredClone(records); const original = structuredClone(entries);
    setup(entries); search("infeccion respiratoria");
    expect(screen.getByText("Gómez, Martín")).toBeTruthy();
    expect(screen.getByText("Infección respiratoria alta")).toBeTruthy();
    expect(screen.queryByText("Control en 72 horas")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Detalle" }));
    expect(screen.getByText("Control en 72 horas")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(screen.queryByText("Control en 72 horas")).toBeNull();
    expect(entries).toEqual(original);
  });

  it("maneja campos opcionales nulos sin buscar la palabra null", () => {
    setup(); search("localizada"); expect(diagnoses()).toEqual([records[3].diagnosis]);
    fireEvent.click(screen.getByRole("button", { name: "Detalle" }));
    expect(screen.getByText("No se registraron indicaciones.")).toBeTruthy();
    search("null"); expect(diagnoses()).toEqual([]);
  });

  it("conserva el mensaje de historial vacío", () => {
    setup([]); search("infeccion"); expect(diagnoses()).toEqual([]);
    expect(screen.getByText("Todavía no hay atenciones registradas.")).toBeTruthy();
  });
});
