const PREPOSICOES = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);

/** Abrevia somente para exibição; o nome cadastrado permanece intacto. */
export function abreviarNome(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length <= 2) return partes.join(' ');
  const segundo = partes.slice(1).find(parte => !PREPOSICOES.has(parte.toLocaleLowerCase('pt-BR')));
  return segundo ? `${partes[0]} ${segundo}` : partes[0]!;
}
