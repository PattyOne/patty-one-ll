export type StatusOcupacao = 'Livre' | 'Reservado' | 'Ocupado';
export const PROXIMO: Record<StatusOcupacao, StatusOcupacao> = { Livre: 'Reservado', Reservado: 'Ocupado', Ocupado: 'Livre' };
export type PeriodoOficial = { ano: number; numero: number; codigo_sige: number; inicio: string; fim: string };
export type Bissemana = { numero: number; codigo_sige: number; inicio: Date; fim: Date };
export function bissemanasDoAno(ano: number, calendario: PeriodoOficial[]): Bissemana[] {
  return calendario.filter(b => b.ano === ano).sort((a, b) => a.numero - b.numero).map(b => ({ numero: b.numero, codigo_sige: b.codigo_sige, inicio: new Date(`${b.inicio}T00:00:00Z`), fim: new Date(`${b.fim}T00:00:00Z`) }));
}
export function bissemanaAtual(hoje: Date, calendario: PeriodoOficial[]): { ano: number; numero: number } {
  const t = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const periodo = calendario.find(b => t >= Date.parse(`${b.inicio}T00:00:00Z`) && t <= Date.parse(`${b.fim}T00:00:00Z`));
  return periodo ? { ano: periodo.ano, numero: periodo.numero } : { ano: hoje.getFullYear(), numero: 0 };
}
export const fmtDia = (d: Date) => `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
