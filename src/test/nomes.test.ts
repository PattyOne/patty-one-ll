import { describe, expect, it } from 'vitest';
import { abreviarNome } from '@/lib/nomes';

describe('abreviação de nomes para exibição', () => {
  it('mantém primeiro e segundo nome', () => {
    expect(abreviarNome('João Carlos da Silva Pereira')).toBe('João Carlos');
  });
  it('pula preposições para encontrar o segundo nome', () => {
    expect(abreviarNome('Maria de Souza Lima')).toBe('Maria Souza');
    expect(abreviarNome('Ana dos Santos Silva')).toBe('Ana Santos');
    expect(abreviarNome('Beatriz e Silva Costa')).toBe('Beatriz Silva');
  });
  it('normaliza espaços e não inventa segundo nome', () => {
    expect(abreviarNome('  João   Carlos  ')).toBe('João Carlos');
    expect(abreviarNome('Madonna')).toBe('Madonna');
    expect(abreviarNome('Maria de')).toBe('Maria de');
    expect(abreviarNome('')).toBe('');
  });
});
