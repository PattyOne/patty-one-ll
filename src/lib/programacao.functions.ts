import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import { hojeISO } from './planejamento';

const dataSchema = z.object({ data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

export const programacaoSearchSchema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(() => hojeISO()),
  aba: z.enum(['lancamento', 'resumo', 'pendencias']).default('lancamento'),
});

export const SELECT_SERVICO = 'id, data, data_original, setor, cadastro_id, cliente, produto, servico, detalhamento, ponto_id, local, quantidade, equipe_id, lider_id, veiculo_id, ordem_id, hora_inicio, hora_fim, status, observacao, posicao, reagendamentos, conflito_confirmado, cadastros(nome), pontos_midia(codigo, nome), producao_equipes(nome, setor), lider:producao_colaboradores!programacao_servicos_lider_id_fkey(id, nome), producao_veiculos(placa, modelo, apelido), ordens_producao(numero), programacao_servicos_ajudantes(colaborador_id, producao_colaboradores(id, nome)), planejamento_imagens(id, nome)';

export const getProgramacao = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { data: string }) => dataSchema.parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const [itens, pendencias, agendamentos, equipes, colaboradores, veiculos, pontos, ordens, produtos, servicos] = await Promise.all([
      sb.from('programacao_servicos').select(SELECT_SERVICO).eq('data', data.data).order('setor').order('posicao'),
      sb.from('programacao_servicos').select(SELECT_SERVICO).in('status', ['Não realizado', 'Aguardando equipe']).order('data').limit(500),
      sb.from('planejamento_agendamentos').select('id, titulo, tipo, observacao, equipe_id, data_inicio, data_fim, hora_inicio, hora_fim, veiculo_id, producao_equipes(nome, setor), producao_veiculos(placa, modelo, apelido), ordens_producao(numero, local_instalacao, cadastros(nome)), planejamento_agendamento_equipe(colaborador_id, producao_colaboradores(id, nome)), planejamento_imagens(id, nome)').lte('data_inicio', data.data).gte('data_fim', data.data),
      sb.from('producao_equipes').select('id, nome, setor, producao_equipe_colaboradores(colaborador_id), producao_equipe_veiculos(veiculo_id)').eq('ativo', true).order('setor').order('nome'),
      sb.from('producao_colaboradores').select('id, nome').eq('ativo', true).order('nome'),
      sb.from('producao_veiculos').select('id, placa, modelo, apelido, equipe_id').eq('status', 'ATIVO').order('placa'),
      sb.from('pontos_midia').select('id, codigo, nome, endereco, cidade').neq('status', 'Inativo').order('codigo').limit(1000),
      sb.from('ordens_producao').select('id, numero, descricao').not('status', 'in', '("Concluída","Cancelada")').order('numero', { ascending: false }).limit(300),
      sb.from('programacao_produtos').select('id, nome').eq('ativo', true).order('nome'),
      sb.from('producao_servicos').select('id, nome').eq('ativo', true).order('nome'),
    ]);
    for (const r of [itens, pendencias, agendamentos, equipes, colaboradores, veiculos, pontos, ordens, produtos, servicos]) if (r.error) throw new Error(r.error.message);
    return {
      itens: itens.data ?? [], pendencias: pendencias.data ?? [], agendamentos: agendamentos.data ?? [],
      equipes: equipes.data ?? [], colaboradores: colaboradores.data ?? [], veiculos: veiculos.data ?? [],
      pontos: pontos.data ?? [], ordens: ordens.data ?? [],
      produtos: produtos.data ?? [], servicos: servicos.data ?? [], hoje: hojeISO(),
    };
  });
