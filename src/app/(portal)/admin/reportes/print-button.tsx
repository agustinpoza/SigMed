"use client";

// El PDF se genera con el diálogo de impresión del navegador ("Guardar como PDF").
export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
    >
      Exportar a PDF
    </button>
  );
}
