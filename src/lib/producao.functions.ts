import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import { alertaPrazo } from './producao';

export const producaoFiltersSchema = z.object({
  tipo: z.enum(['', 'Instalação', 'Impressão']).default(''),
  status: z.enum(['', 'Aguardando', 'Em andamento', 'Concluída', 'Cancelada']).default(''),
  busca: z.string().default(''),
  pagina: z.number().int().min(1).default(1),
});
export type ProducaoFilters = z.infer<typeof producaoFiltersSchema>;

const LISTA_SELECT = 'id, numero, tipo, status, prioridade, descricao, data_prevista, created_at, cadastros(nome), vendas(id, numero), producao_servicos(nome), producao_veiculos(placa, modelo), ordens_producao_etapas(id, concluido), ordens_producao_equipe(producao_colaboradores(nome))';

export const getOrdensProducao = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: ProducaoFilters) => producaoFiltersSchema.parse(input)).handler(async ({ data, context }) => {
  let query = context.supabase.from('ordens_producao').select(LISTA_SELECT, { count: 'exact' }).order('numero', { ascending: false }).range((data.pagina - 1) * 50, data.pagina * 50 - 1);
  if (data.tipo) query = query.eq('tipo', data.tipo);
  if (data.status) query = query.eq('status', data.status);
  const busca = data.busca.trim().replace(/[%,()]/g, '');
  if (busca) query = /^\d+$/.test(busca) ? query.eq('numero', Number(busca)) : query.or(`descricao.ilike.%${busca}%,cadastros.nome.ilike.%${busca}%`);
  const [resultado, resumo] = await Promise.all([
    query,
    context.supabase.from('ordens_producao').select('id, numero, tipo, status, descricao, data_prevista, cadastros(nome)'),
  ]);
  if (resultado.error) throw new Error(resultado.error.message);
  if (resumo.error) throw new Error(resumo.error.message);
  const hoje = new Date().toISOString().slice(0, 10);
  const alertas = resumo.data.flatMap(ordem => {
    const alerta = alertaPrazo(ordem.data_prevista, ordem.status, hoje);
    return alerta ? [{ ...ordem, alerta }] : [];
  }).sort((a, b) => (a.data_prevista ?? '').localeCompare(b.data_prevista ?? ''));
  return {
    total: resultado.count ?? 0,
    linhas: resultado.data,
    hoje,
    alertas,
    resumo: {
      aguardando: resumo.data.filter(o => o.status === 'Aguardando').length,
      andamento: resumo.data.filter(o => o.status === 'Em andamento').length,
      atrasadas: resumo.data.filter(o => o.data_prevista && o.data_prevista < hoje && !['Concluída', 'Cancelada'].includes(o.status)).length,
      concluidas: resumo.data.filter(o => o.status === 'Concluída').length,
    },
  };
});

export const getRecursosProducao = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const [colaboradores, veiculos, servicos, pedidos] = await Promise.all([
    context.supabase.from('producao_colaboradores').select('id, nome, empresa').eq('ativo', true).order('nome'),
    context.supabase.from('producao_veiculos').select('id, placa, modelo, marca').eq('status', 'ATIVO').order('placa'),
    context.supabase.from('producao_servicos').select('id, id_sige, nome, etapas').eq('ativo', true).order('nome'),
    context.supabase.from('vendas').select('id, numero, cadastro_id, cadastros(id, nome), vendas_itens(descricao, categoria, ponto)').eq('tipo', 'pedido').neq('status', 'Cancelado').order('numero', { ascending: false }).limit(100),
  ]);
  for (const r of [colaboradores, veiculos, servicos, pedidos]) if (r.error) throw new Error(r.error.message);
  return { colaboradores: colaboradores.data ?? [], veiculos: veiculos.data ?? [], servicos: servicos.data ?? [], pedidos: pedidos.data ?? [] };
});

export const getOrdemProducao = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
  const r = await context.supabase.from('ordens_producao').select('*, cadastros(id, nome, cpf_cnpj), vendas(id, numero), producao_servicos(id, nome, etapas), producao_veiculos(id, placa, modelo), ordens_producao_equipe(producao_colaboradores(id, nome, empresa)), ordens_producao_etapas(*), ordens_producao_eventos(*, profiles(full_name))').eq('id', data.id).order('ordem', { referencedTable: 'ordens_producao_etapas' }).order('created_at', { referencedTable: 'ordens_producao_eventos', ascending: false }).single();
  if (r.error) throw new Error('Ordem de produção não encontrada');
  return r.data;
});
