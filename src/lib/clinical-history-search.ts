function normalizeSearchText(text: string) {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es-AR");
}

// DEC-002: cada término debe coincidir en una misma atención, en cualquier orden.
export function createHistorySearchMatcher(query: string) {
  const terms = normalizeSearchText(query).split(/[\s,]+/u).filter(Boolean);

  return (fields: readonly (string | null | undefined)[]) => {
    const searchableText = normalizeSearchText(fields.filter(Boolean).join(" "));
    return terms.every((term) => searchableText.includes(term));
  };
}
