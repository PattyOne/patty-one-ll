import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import { hojeISO, type Periodo } from './planejamento';

const periodoSchema = z.object({
  inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const planejamentoSearchSchema = z.object({
  visao: z.enum(['diario', 'semanal', 'mensal']).default('semanal'),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(() => hojeISO()),
});
export type PlanejamentoSearch = z.infer<typeof planejamentoSearchSchema>;

export const getPlanejamento = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Periodo) => periodoSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (data.fim < data.inicio) throw new Error('Período inválido');
    const [agendamentos, colaboradores, veiculos, ordens, vinculados, equipes, programacao] = await Promise.all([
      context.supabase.from('planejamento_agendamentos').select('*, producao_veiculos(id, placa, modelo, apelido, equipe_id), producao_equipes(id, nome, setor, capacidade_horas_dia), ordens_producao(id, numero, tipo, descricao, status, cadastros(nome)), planejamento_agendamento_equipe(colaborador_id, producao_colaboradores(id, nome, empresa)), planejamento_imagens(id, nome)').lte('data_inicio', data.fim).gte('data_fim', data.inicio).order('data_inicio').order('hora_inicio', { nullsFirst: true }),
      context.supabase.from('producao_colaboradores').select('id, nome, empresa').eq('ativo', true).order('nome'),
      context.supabase.from('producao_veiculos').select('id, placa, modelo, marca, apelido, equipe_id').eq('status', 'ATIVO').order('placa'),
      context.supabase.from('ordens_producao').select('id, numero, tipo, status, prioridade, descricao, data_prevista, local_instalacao, veiculo_id, cadastros(id, nome), producao_veiculos(id, placa, modelo), ordens_producao_equipe(producao_colaboradores(id, nome, empresa))').neq('status', 'Concluída').neq('status', 'Cancelada').gte('data_prevista', data.inicio).lte('data_prevista', data.fim).order('data_prevista'),
      context.supabase.from('planejamento_agendamentos').select('ordem_id').not('ordem_id', 'is', null),
      context.supabase.from('producao_equipes').select('id, nome, setor, capacidade_horas_dia, producao_equipe_colaboradores(producao_colaboradores(id, nome, empresa)), producao_equipe_veiculos(producao_veiculos(id, placa, modelo, marca, apelido, equipe_id))').eq('ativo', true).order('setor').order('nome'),
      context.supabase.from('programacao_servicos').select('id, data, setor, servico, cliente, status, equipe_id, lider_id, veiculo_id, hora_inicio, hora_fim, conflito_confirmado, producao_equipes(nome), lider:producao_colaboradores!programacao_servicos_lider_id_fkey(id, nome), producao_veiculos(id, placa, modelo), programacao_servicos_ajudantes(producao_colaboradores(id, nome))').gte('data', data.inicio).lte('data', data.fim).order('data').order('posicao').limit(2000),
    ]);
    for (const resultado of [agendamentos, colaboradores, veiculos, ordens, vinculados, equipes, programacao]) {
      if (resultado.error) throw new Error(resultado.error.message);
    }
    const ordensAgendadas = new Set((vinculados.data ?? []).map(item => item.ordem_id));
    return {
      agendamentos: agendamentos.data ?? [],
      colaboradores: colaboradores.data ?? [],
      veiculos: veiculos.data ?? [],
      equipes: equipes.data ?? [],
      programacao: programacao.data ?? [],
      ordens: (ordens.data ?? []).filter(ordem => !ordensAgendadas.has(ordem.id)),
      hoje: new Date().toISOString().slice(0, 10),
    };
  });
