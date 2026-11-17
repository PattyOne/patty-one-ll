export type Situacao = 'Recebido' | 'Cancelado' | 'Vencido' | 'A vencer';
export function situacaoConta(status: string, vencimento: string, hoje: string): Situacao {
  if (status === 'Recebido' || status === 'Cancelado') return status;
  return vencimento < hoje ? 'Vencido' : 'A vencer';
}
const MESES: Record<string, number> = { Mensal: 1, Bimestral: 2, Trimestral: 3, Semestral: 6, Anual: 12 };
/** Valor equivalente por mês; contratos sem recorrência não entram no custo mensal. */
export function aluguelMensal(valor: number, periodicidade: string | null): number {
  const m = periodicidade ? MESES[periodicidade] : undefined;
  return m ? valor / m : 0;
}
export const hojeISO = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
