import { describe, it, expect } from 'vitest';
import { situacaoConta, aluguelMensal } from '@/lib/financeiro';
describe('financeiro', () => {
  it('conta aberta com vencimento passado está vencida', () => expect(situacaoConta('Aberto', '2026-11-10', '2026-11-14')).toBe('Vencido'));
  it('conta aberta vencendo hoje ainda está a vencer', () => expect(situacaoConta('Aberto', '2026-11-14', '2026-11-14')).toBe('A vencer'));
  it('conta recebida não fica vencida', () => expect(situacaoConta('Recebido', '2020-01-01', '2026-11-14')).toBe('Recebido'));
  it('aluguel trimestral de 720 equivale a 240 por mês', () => expect(aluguelMensal(720, 'Trimestral')).toBe(240));
  it('aluguel anual de 1200 equivale a 100 por mês', () => expect(aluguelMensal(1200, 'Anual')).toBe(100));
  it('sem recorrência não soma no mensal', () => expect(aluguelMensal(1400, 'Sem recorrência')).toBe(0));
});
