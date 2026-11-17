import type { getProgramacao } from '@/lib/programacao.functions';
import { grupoDaLinha, type Alocacao, type ItemResumo, type LinhaProgramacao, type SetorProgramacao, type StatusProgramacao } from '@/lib/programacao';
import { rotuloVeiculo } from '@/lib/veiculos';

export type DadosProgramacao = Awaited<ReturnType<typeof getProgramacao>>;
export type ServicoSalvo = DadosProgramacao['itens'][number];

export function rotuloPonto(p: { codigo: string | null; nome: string }) {
  return p.codigo ? `${p.codigo} — ${p.nome}` : p.nome;
}

export function linhaDoServico(s: ServicoSalvo): LinhaProgramacao {
  return {
    chave: s.id, id: s.id, data: s.data, setor: s.setor as SetorProgramacao,
    cadastro_id: s.cadastro_id ?? '', cliente: s.cliente ?? s.cadastros?.nome ?? '', produto: s.produto ?? '', servico: s.servico,
    detalhamento: s.detalhamento ?? '', ponto_id: s.ponto_id ?? '', local: s.local ?? (s.pontos_midia ? rotuloPonto(s.pontos_midia) : ''),
    quantidade: String(Number(s.quantidade)).replace('.', ','), equipe_id: s.equipe_id ?? '', lider_id: s.lider_id ?? '',
    ajudantes: s.programacao_servicos_ajudantes.map(a => a.colaborador_id), veiculo_id: s.veiculo_id ?? '', ordem_id: s.ordem_id ?? '',
    hora_inicio: s.hora_inicio?.slice(0, 5) ?? '', hora_fim: s.hora_fim?.slice(0, 5) ?? '', status: s.status as StatusProgramacao, observacao: s.observacao ?? '',
    conflito_confirmado: s.conflito_confirmado,
  };
}

export function alocacaoDaLinha(l: LinhaProgramacao): Alocacao {
  return {
    id: l.chave, grupo: grupoDaLinha(l), descricao: `${l.setor || 'Sem setor'}: ${l.servico || 'serviço sem nome'}${l.cliente ? ` — ${l.cliente}` : ''}`,
    data_inicio: l.data, data_fim: l.data, hora_inicio: l.hora_inicio || null, hora_fim: l.hora_fim || null,
    colaboradores: [...new Set([l.lider_id, ...l.ajudantes].filter(Boolean))], veiculo_id: l.veiculo_id || null,
    confirmado: l.conflito_confirmado,
  };
}

export function alocacoesDeAgendamentos(ags: DadosProgramacao['agendamentos']): Alocacao[] {
  return ags.map(a => ({
    id: `ag-${a.id}`, grupo: a.equipe_id ? `equipe:${a.equipe_id}` : `ag:${a.id}`, descricao: `Cronograma: ${a.titulo}`,
    data_inicio: a.data_inicio, data_fim: a.data_fim, hora_inicio: a.hora_inicio, hora_fim: a.hora_fim,
    colaboradores: a.planejamento_agendamento_equipe.map(e => e.colaborador_id), veiculo_id: a.veiculo_id,
  }));
}

export function itemResumo(s: ServicoSalvo): ItemResumo {
  return {
    id: s.id, origem: 'programacao', equipe_id: s.equipe_id, lider_id: s.lider_id, liderNome: s.lider?.nome ?? null, equipeNome: s.producao_equipes?.nome ?? null,
    ajudantesNomes: s.programacao_servicos_ajudantes.map(a => a.producao_colaboradores.nome), veiculo_id: s.veiculo_id,
    veiculoNome: s.producao_veiculos ? rotuloVeiculo(s.producao_veiculos) : null,
    cliente: s.cliente ?? s.cadastros?.nome ?? null, servico: s.servico, produto: s.produto, detalhamento: s.detalhamento, observacao: s.observacao,
    local: s.local ?? (s.pontos_midia ? rotuloPonto(s.pontos_midia) : null), quantidade: Number(s.quantidade), status: s.status as StatusProgramacao,
    setor: s.setor, hora_inicio: s.hora_inicio, imagens: s.planejamento_imagens, conflito_confirmado: s.conflito_confirmado,
  };
}

export function itemResumoAgendamento(a: DadosProgramacao['agendamentos'][number]): ItemResumo {
  const nomes = a.planejamento_agendamento_equipe.map(e => e.producao_colaboradores.nome);
  return {
    id: `ag-${a.id}`, origem: 'agendamento', equipe_id: a.equipe_id,
    equipeNome: a.producao_equipes?.nome ?? nomes[0] ?? null, liderNome: null,
    ajudantesNomes: a.producao_equipes?.nome ? nomes : nomes.slice(1),
    veiculo_id: a.veiculo_id, veiculoNome: a.producao_veiculos ? rotuloVeiculo(a.producao_veiculos) : null,
    cliente: a.ordens_producao?.cadastros?.nome ?? null, servico: a.titulo, produto: null,
    detalhamento: null, observacao: a.observacao, local: a.ordens_producao?.local_instalacao ?? null, quantidade: 1, status: 'Programado',
    setor: a.producao_equipes?.setor ?? 'Agendamento', hora_inicio: a.hora_inicio, imagens: a.planejamento_imagens,
  };
}

export const tomStatus: Record<StatusProgramacao, string> = {
  Programado: 'border-primary/30 bg-primary/10 text-primary',
  'Em andamento': 'border-warning/40 bg-warning/10 text-warning',
  Concluído: 'border-success/40 bg-success/10 text-success',
  'Não realizado': 'border-danger/40 bg-danger/10 text-danger',
  'Aguardando equipe': 'border-warning/40 bg-warning/15 text-warning',
};
