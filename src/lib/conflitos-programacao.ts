import { supabase } from '@/integrations/supabase/client';
import { grupoDaLinha, type Alocacao } from '@/lib/programacao';

/** Busca serviços e agendamentos das datas afetadas para avisar antes de salvar. */
export async function buscarAlocacoesExistentes(datas: string[], ignorarServicos: string[] = []): Promise<Alocacao[]> {
  const unicas = [...new Set(datas.filter(Boolean))].sort();
  if (!unicas.length) return [];
  const inicio = unicas[0]!;
  const fim = unicas[unicas.length - 1]!;
  const [servicos, agendamentos] = await Promise.all([
    supabase.from('programacao_servicos').select('id, data, setor, servico, cliente, equipe_id, lider_id, veiculo_id, hora_inicio, hora_fim, conflito_confirmado, programacao_servicos_ajudantes(colaborador_id)').in('data', unicas),
    supabase.from('planejamento_agendamentos').select('id, titulo, equipe_id, data_inicio, data_fim, hora_inicio, hora_fim, veiculo_id, planejamento_agendamento_equipe(colaborador_id)').lte('data_inicio', fim).gte('data_fim', inicio),
  ]);
  if (servicos.error) throw new Error(servicos.error.message);
  if (agendamentos.error) throw new Error(agendamentos.error.message);
  const ignorar = new Set(ignorarServicos);
  return [
    ...(servicos.data ?? []).filter(s => !ignorar.has(s.id)).map(s => ({
      id: s.id,
      grupo: grupoDaLinha(s),
      descricao: `${s.setor}: ${s.servico}${s.cliente ? ` — ${s.cliente}` : ''}`,
      data_inicio: s.data,
      data_fim: s.data,
      hora_inicio: s.hora_inicio,
      hora_fim: s.hora_fim,
      colaboradores: [...new Set([s.lider_id, ...s.programacao_servicos_ajudantes.map(a => a.colaborador_id)].filter((id): id is string => Boolean(id)))],
      veiculo_id: s.veiculo_id,
      confirmado: s.conflito_confirmado,
    })),
    ...(agendamentos.data ?? []).map(a => ({
      id: `ag-${a.id}`,
      grupo: a.equipe_id ? `equipe:${a.equipe_id}` : `ag:${a.id}`,
      descricao: `Cronograma: ${a.titulo}`,
      data_inicio: a.data_inicio,
      data_fim: a.data_fim,
      hora_inicio: a.hora_inicio,
      hora_fim: a.hora_fim,
      colaboradores: a.planejamento_agendamento_equipe.map(e => e.colaborador_id),
      veiculo_id: a.veiculo_id,
      confirmado: false,
    })),
  ];
}
