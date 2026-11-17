import { describe, it, expect } from 'vitest';
import { totalItem, totaisVenda, parseNum } from '@/lib/vendas-calc';
describe('cálculo de propostas e pedidos', () => {
  it('total do item = quantidade × valor − desconto do item', () => { expect(totalItem({ quantidade: 2, valor_unitario: 1500, desconto: 100 })).toBe(2900); });
  it('desconto do item nunca deixa o total negativo', () => { expect(totalItem({ quantidade: 1, valor_unitario: 50, desconto: 80 })).toBe(0); });
  it('desconto no total é aplicado sobre a soma dos itens', () => { expect(totaisVenda([{ quantidade: 1, valor_unitario: 1000, desconto: 0 }, { quantidade: 3, valor_unitario: 200, desconto: 0 }], 100)).toEqual({ subtotal: 1600, desconto: 100, total: 1500 }); });
  it('desconto no total é limitado ao subtotal', () => { expect(totaisVenda([{ quantidade: 1, valor_unitario: 100, desconto: 0 }], 500).total).toBe(0); });
  it('aceita valores no formato brasileiro', () => { expect(parseNum('1.234,50')).toBe(1234.5); });
});
