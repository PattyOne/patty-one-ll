import { linkPublicoImagem } from './planejamento-imagens';

export const SETORES_PROGRAMACAO = ['Externa', 'Projetos especiais', 'Serralheria', 'Acabamento e montagem', 'Produção', 'Corte', 'Pintura'] as const;
export type SetorProgramacao = typeof SETORES_PROGRAMACAO[number];
export const STATUS_PROGRAMACAO = ['Programado', 'Em andamento', 'Concluído', 'Não realizado', 'Aguardando equipe'] as const;
export type StatusProgramacao = typeof STATUS_PROGRAMACAO[number];
export const STATUS_PENDENTES: StatusProgramacao[] = ['Não realizado', 'Aguardando equipe'];
export const PRODUTOS_SUGERIDOS = ['Adesivo', 'Outdoor', 'Front', 'Estrutura', 'Totem', 'Lona', 'Placa', 'Painel', 'Empena', 'Letra caixa'];
export const SERVICOS_SUGERIDOS = ['Montagem', 'Instalação', 'Colagem', 'Retirada', 'Manutenção', 'Soldar', 'Pintar', 'Cortar', 'Imprimir', 'Acabamento', 'Vistoria'];

export type LinhaProgramacao = {
  chave: string;
  id?: string;
  data: string;
  setor: SetorProgramacao | '';
  cadastro_id: string;
  cliente: string;
  produto: string;
  servico: string;
  detalhamento: string;
  ponto_id: string;
  local: string;
  quantidade: string;
  equipe_id: string;
  lider_id: string;
  ajudantes: string[];
  veiculo_id: string;
  ordem_id: string;
  hora_inicio: string;
  hora_fim: string;
  status: StatusProgramacao;
  observacao: string;
  conflito_confirmado: boolean;
};

let contador = 0;
export const novaChave = () => `nova-${Date.now()}-${++contador}`;

export function linhaVazia(data: string): LinhaProgramacao {
  return { chave: novaChave(), data, setor: '', cadastro_id: '', cliente: '', produto: '', servico: '', detalhamento: '', ponto_id: '', local: '', quantidade: '', equipe_id: '', lider_id: '', ajudantes: [], veiculo_id: '', ordem_id: '', hora_inicio: '', hora_fim: '', status: 'Programado', observacao: '', conflito_confirmado: false };
}

export function validarLinha(l: Pick<LinhaProgramacao, 'data' | 'setor' | 'servico' | 'quantidade' | 'hora_inicio' | 'hora_fim'>) {
  if (!l.data) return 'Informe a data.';
  if (!l.setor) return 'Informe o setor.';
  if (!l.servico.trim()) return 'Informe o serviço.';
  const q = Number(l.quantidade.replace(',', '.'));
  if (!Number.isFinite(q) || q <= 0) return 'A quantidade deve ser maior que zero.';
  if (!l.hora_inicio !== !l.hora_fim) return 'Preencha início e fim, ou deixe ambos vazios.';
  if (l.hora_inicio && l.hora_fim <= l.hora_inicio) return 'O horário final deve ser posterior ao inicial.';
  return null;
}

export function diasEmAberto(data: string, hoje: string) {
  const ms = Date.parse(`${hoje}T00:00:00Z`) - Date.parse(`${data}T00:00:00Z`);
  return Math.max(0, Math.round(ms / 86_400_000));
}

/* ---------- Conflitos de recursos ---------- */
export type Alocacao = {
  id: string;
  /** Agrupamento: mesma equipe/líder não conflita consigo mesma. */
  grupo: string;
  descricao: string;
  data_inicio: string;
  data_fim: string;
  hora_inicio?: string | null;
  hora_fim?: string | null;
  colaboradores: string[];
  veiculo_id?: string | null;
  confirmado?: boolean;
};
export type Conflito = { recurso: 'colaborador' | 'veiculo'; recursoId: string; alocacoes: [string, string] };

export function grupoDaLinha(l: { id?: string; chave?: string; equipe_id?: string | null; lider_id?: string | null }) {
  if (l.equipe_id) return `equipe:${l.equipe_id}`;
  if (l.lider_id) return `lider:${l.lider_id}`;
  return `linha:${l.id ?? l.chave}`;
}

function mesmoDia(a: Alocacao, b: Alocacao) {
  return !(a.data_inicio > b.data_fim || a.data_fim < b.data_inicio);
}

/** Repetição no mesmo dia é somente um aviso informativo, inclusive na mesma equipe. */
export function detectarConflitos(alocacoes: Alocacao[]): Conflito[] {
  const conflitos: Conflito[] = [];
  for (let i = 0; i < alocacoes.length; i++) for (let j = i + 1; j < alocacoes.length; j++) {
    const a = alocacoes[i]!, b = alocacoes[j]!;
    if (!mesmoDia(a, b)) continue;
    for (const c of a.colaboradores) if (b.colaboradores.includes(c)) conflitos.push({ recurso: 'colaborador', recursoId: c, alocacoes: [a.id, b.id] });
    if (a.veiculo_id && a.veiculo_id === b.veiculo_id) conflitos.push({ recurso: 'veiculo', recursoId: a.veiculo_id, alocacoes: [a.id, b.id] });
  }
  return conflitos;
}

/** Somente alocações ainda não confirmadas aparecem como aviso pendente. */
export function idsComAlertaPendente(conflitos: Conflito[], alocacoes: Alocacao[]) {
  const confirmadas = new Map(alocacoes.map(a => [a.id, Boolean(a.confirmado)]));
  return new Set(conflitos.flatMap(c => c.alocacoes.filter(id => !confirmadas.get(id))));
}

export function quantidadeServicosNoDia(id: string, conflitos: Conflito[]) {
  const relacionadas = conflitos.filter(c => c.alocacoes.includes(id));
  return new Set([id, ...relacionadas.flatMap(c => c.alocacoes)]).size;
}

/* ---------- Resumo do dia & WhatsApp ---------- */
export type ItemResumo = {
  id: string; origem?: 'programacao' | 'agendamento'; equipe_id?: string | null; lider_id?: string | null; liderNome?: string | null; equipeNome?: string | null;
  ajudantesNomes: string[]; veiculo_id?: string | null; veiculoNome?: string | null;
  cliente?: string | null; servico: string; produto?: string | null; detalhamento?: string | null; observacao?: string | null; local?: string | null;
  quantidade?: number | null; status: StatusProgramacao; setor: string; hora_inicio?: string | null;
  imagens?: { id: string; nome: string }[];
  conflito_confirmado?: boolean;
};
export type GrupoResumo = { chave: string; titulo: string; ajudantes: string[]; veiculo: string | null; itens: ItemResumo[]; programados: number; concluidos: number; pendentes: number };

export function agruparResumo(itens: ItemResumo[]): GrupoResumo[] {
  const mapa = new Map<string, GrupoResumo>();
  for (const it of itens) {
    const chave = `${it.equipe_id ?? it.lider_id ?? 'sem'}|${it.veiculo_id ?? ''}`;
    let g = mapa.get(chave);
    if (!g) {
      const titulo = [it.equipeNome, it.liderNome].filter(Boolean).join(' / ') || 'Sem equipe definida';
      g = { chave, titulo, ajudantes: [], veiculo: it.veiculoNome ?? null, itens: [], programados: 0, concluidos: 0, pendentes: 0 };
      mapa.set(chave, g);
    }
    g.itens.push(it);
    for (const a of it.ajudantesNomes) if (!g.ajudantes.includes(a)) g.ajudantes.push(a);
    if (it.status === 'Concluído') g.concluidos++;
    else if (STATUS_PENDENTES.includes(it.status)) g.pendentes++;
    else g.programados++;
  }
  for (const grupo of mapa.values()) {
    grupo.itens.sort((a, b) => (a.hora_inicio ?? '23:59:59').localeCompare(b.hora_inicio ?? '23:59:59') || (a.cliente ?? '').localeCompare(b.cliente ?? '', 'pt-BR'));
  }
  return [...mapa.values()].sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'));
}

export function dataCurtaBR(iso: string) {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

export function textoWhatsApp(data: string, grupos: GrupoResumo[], origem?: string) {
  const linhas = [`📅 *PROGRAMAÇÃO ${dataCurtaBR(data)}*`];
  for (const g of grupos) {
    linhas.push('');
    const equipe = [g.titulo, g.ajudantes.length ? g.ajudantes.join(', ') : null].filter(Boolean).join(' / ');
    linhas.push(`👥 *${equipe}*${g.veiculo ? ` · 🚚 ${g.veiculo}` : ''}`);
    g.itens.forEach((it, i) => {
      const titulo = [it.cliente, [it.servico, it.produto].filter(Boolean).join(' ')].filter(Boolean).join(' — ');
      const qtd = it.quantidade && it.quantidade !== 1 ? ` (${it.quantidade.toLocaleString('pt-BR')}x)` : '';
      linhas.push(`${i + 1}. ${it.hora_inicio ? `${it.hora_inicio.slice(0, 5)} ` : ''}${titulo}${qtd}`);
      if (it.origem === 'agendamento') linhas.push('   📌 Agendamento do cronograma');
      if (it.setor) linhas.push(`   🏭 Setor: ${it.setor}`);
      if (it.detalhamento) linhas.push(`   📝 ${it.detalhamento}`);
      if (it.observacao && it.observacao !== it.detalhamento) linhas.push(`   💬 ${it.observacao}`);
      if (it.local) linhas.push(`   📍 ${it.local}`);
      if (origem && it.imagens?.length) {
        linhas.push('   🖼️ Imagens:');
        for (const imagem of it.imagens) linhas.push(`   ${linkPublicoImagem(origem, imagem.id)}`);
      }
    });
  }
  if (!grupos.length) linhas.push('', 'Nenhum serviço programado.');
  return linhas.join('\n');
}
