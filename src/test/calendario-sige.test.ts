import { describe, expect, it } from 'vitest';
import { bissemanasDoAno, bissemanaAtual, type PeriodoOficial } from '@/lib/bissemanas';
const calendario: PeriodoOficial[] = [
  { ano: 2026, numero: 1, codigo_sige: 2, inicio: '2025-12-29', fim: '2026-01-11' },
  { ano: 2026, numero: 23, codigo_sige: 46, inicio: '2026-11-02', fim: '2026-11-15' },
  { ano: 2027, numero: 1, codigo_sige: 2, inicio: '2026-12-28', fim: '2027-01-10' },
];
describe('Calendário oficial SIGE', () => {
  it('preserva B46 em 02/11 a 15/11/2026 e usa ordinal 23 para ocupação', () => {
    const periodo = bissemanasDoAno(2026, calendario).find(b => b.codigo_sige === 46);
    expect(periodo?.numero).toBe(23);
    expect(periodo?.inicio.toISOString().slice(0, 10)).toBe('2026-11-02');
    expect(periodo?.fim.toISOString().slice(0, 10)).toBe('2026-11-15');
    expect(bissemanaAtual(new Date(2026, 10, 14), calendario)).toEqual({ ano: 2026, numero: 23 });
  });
  it('usa o ciclo seguinte em 28/12/2026 conforme o arquivo', () => {
    expect(bissemanaAtual(new Date(2026, 11, 28), calendario)).toEqual({ ano: 2027, numero: 1 });
  });
  it('não inventa períodos ausentes', () => expect(bissemanasDoAno(2028, calendario)).toEqual([]));
});