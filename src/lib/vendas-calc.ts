export type ItemCalc = { quantidade: number; valor_unitario: number; desconto: number };
const round = (n: number) => Math.round(n * 100) / 100;
export function totalItem(i: ItemCalc) { return round(Math.max(0, (i.quantidade || 0) * (i.valor_unitario || 0) - (i.desconto || 0))); }
export function totaisVenda(itens: ItemCalc[], descontoGeral: number) {
  const subtotal = round(itens.reduce((s, i) => s + totalItem(i), 0));
  const desconto = round(Math.min(subtotal, Math.max(0, descontoGeral || 0)));
  return { subtotal, desconto, total: round(subtotal - desconto) };
}
export const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const dataBR = (iso: string | null | undefined) => iso ? iso.slice(0, 10).split('-').reverse().join('/') : '';
export const parseNum = (v: string) => { const n = Number(v.replace(/\./g, '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };
export const CATEGORIAS = ['Mídia OOH', 'Produção', 'Serviço', 'Item livre'] as const;
export const STATUS = { proposta: ['Rascunho', 'Enviada', 'Aprovada', 'Recusada'], pedido: ['Aberto', 'Em andamento', 'Concluído', 'Cancelado'] } as const;
