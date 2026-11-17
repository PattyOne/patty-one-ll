import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';

export const vendasFiltersSchema = z.object({ tipo: z.enum(['proposta', 'pedido']).default('proposta'), busca: z.string().default(''), status: z.string().default(''), pagina: z.number().int().min(1).default(1) });
export type VendasFilters = z.infer<typeof vendasFiltersSchema>;
const SELECT_LISTA = 'id, tipo, numero, status, validade, vendedor, desconto, created_at, proposta_id, empresas(nome), cadastros!inner(nome, cpf_cnpj), vendas_itens(quantidade, valor_unitario, desconto)';

export const getVendas = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((i: VendasFilters) => vendasFiltersSchema.parse(i)).handler(async ({ data, context }) => {
  let q = context.supabase.from('vendas').select(SELECT_LISTA, { count: 'exact' }).eq('tipo', data.tipo).order('numero', { ascending: false }).range((data.pagina - 1) * 50, data.pagina * 50 - 1);
  if (data.status) q = q.eq('status', data.status);
  const busca = data.busca.trim().replace(/[%,()]/g, '');
  if (busca) q = /^\d+$/.test(busca) ? q.eq('numero', Number(busca)) : q.ilike('cadastros.nome', `%${busca}%`);
  const r = await q;
  if (r.error) throw new Error(r.error.message);
  return { total: r.count ?? 0, linhas: r.data };
});

export const getVenda = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((i: { id: string }) => z.object({ id: z.string().uuid() }).parse(i)).handler(async ({ data, context }) => {
  const r = await context.supabase.from('vendas').select('*, empresas(nome, cnpj), cadastros(id, nome, razao_social, cpf_cnpj, contato, email, telefone, celular, endereco, numero, bairro, cidade, estado), vendas_itens(*)').eq('id', data.id).order('ordem', { referencedTable: 'vendas_itens' }).single();
  if (r.error) throw new Error('Documento não encontrado');
  const [pedido, proposta] = await Promise.all([
    context.supabase.from('vendas').select('id, numero').eq('proposta_id', data.id).maybeSingle(),
    r.data.proposta_id ? context.supabase.from('vendas').select('id, numero').eq('id', r.data.proposta_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  return { venda: r.data, pedidoGerado: pedido.data, propostaOrigem: proposta.data };
});

export const getEmpresas = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const r = await context.supabase.from('empresas').select('id, nome, cnpj').order('nome');
  if (r.error) throw new Error(r.error.message);
  return r.data;
});
