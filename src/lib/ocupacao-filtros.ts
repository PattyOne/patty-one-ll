import type { StatusOcupacao } from '@/lib/bissemanas';

/** Linha mínima de pontos_ocupacao usada pelos filtros (ausência de linha = Livre). */
export type OcupacaoRow = { ponto_id: string; bissemana: number; status: string; cliente?: string | null };
export type MapaOcupacao = Map<string, OcupacaoRow>;

export const TODOS_STATUS: StatusOcupacao[] = ['Livre', 'Reservado', 'Ocupado'];
export const chave = (ponto_id: string, bissemana: number) => `${ponto_id}:${bissemana}`;

export function criarMapaOcupacao(rows: readonly OcupacaoRow[]): MapaOcupacao {
  return new Map(rows.map(r => [chave(r.ponto_id, r.bissemana), r]));
}

/** Situação do ponto na bi-semana; sem registro (ou registro "Livre") é Livre. */
export function statusDoPonto(mapa: MapaOcupacao, ponto_id: string, bissemana: number): StatusOcupacao {
  const s = mapa.get(chave(ponto_id, bissemana))?.status;
  return s === 'Reservado' || s === 'Ocupado' ? s : 'Livre';
}

/** Lista de pontos cuja situação na bi-semana está entre os status escolhidos; sem escolha = todos. */
export function filtrarPontos<T extends { id: string }>(
  pontos: readonly T[],
  mapa: MapaOcupacao,
  bissemana: number,
  statuses: readonly StatusOcupacao[],
): T[] {
  if (!statuses.length) return [...pontos];
  const q = new Set(statuses);
  return pontos.filter(p => q.has(statusDoPonto(mapa, p.id, bissemana)));
}

export function contarPorStatus(
  pontos: readonly { id: string }[],
  mapa: MapaOcupacao,
  bissemana: number,
): Record<StatusOcupacao, number> {
  const t: Record<StatusOcupacao, number> = { Livre: 0, Reservado: 0, Ocupado: 0 };
  for (const p of pontos) t[statusDoPonto(mapa, p.id, bissemana)]++;
  return t;
}

/** Clique no chip: adiciona o status se ele estava fora, tira se estava dentro. */
export function alternarStatusFiltro(statuses: readonly StatusOcupacao[], s: StatusOcupacao): StatusOcupacao[] {
  return statuses.includes(s) ? statuses.filter(x => x !== s) : [...statuses, s];
}
