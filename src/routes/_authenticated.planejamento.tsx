import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { zodValidator } from '@tanstack/zod-adapter';
import { AlarmClock, AlertTriangle, CalendarDays, ListChecks, ChevronLeft, ChevronRight, ClipboardList, Package, Plus, ShieldAlert, Truck, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AgendamentoDialog } from '@/components/planejamento/AgendamentoDialog';
import { pageMeta } from '@/lib/page-meta';
import { planejamentoSearchSchema, type getPlanejamento } from '@/lib/planejamento.functions';
import { planejamentoOptions } from '@/lib/planejamento-queries';
import { adicionarDias, adicionarMeses, DIAS_SEMANA_CURTOS, diasDoPeriodo, eventoNoDia, horarioCurto, periodoDaVisao, tituloDoPeriodo, type TipoAgendamento, type VisaoPlanejamento } from '@/lib/planejamento';
import { dataBR } from '@/lib/vendas-calc';
import { detectarConflitos, idsComAlertaPendente, type Alocacao } from '@/lib/programacao';
import { abreviarNome } from '@/lib/nomes';

export const Route = createFileRoute('/_authenticated/planejamento')({
  validateSearch: zodValidator(planejamentoSearchSchema),
  loaderDeps: ({ search }) => ({ periodo: periodoDaVisao(search.data, search.visao) }),
  loader: async ({ context, deps }) => { await context.queryClient.ensureQueryData(planejamentoOptions(deps.periodo)); },
  head: () => pageMeta('Planejamento', 'Cronograma diário, semanal e mensal de equipes, veículos e reservas para urgências.'),
  component: PlanejamentoPage,
});

type Dados = Awaited<ReturnType<typeof getPlanejamento>>;
type Agendamento = Dados['agendamentos'][number];
type RecursoPessoa = { id: string; nome: string };
type RecursoVeiculo = { id: string; placa: string; modelo: string | null };
type Evento = {
  chave: string;
  id: string;
  origem: 'planejamento' | 'ordem' | 'programacao';
  titulo: string;
  tipo: TipoAgendamento | 'Ordem de produção' | 'Programação';
  data_inicio: string;
  data_fim: string;
  hora_inicio: string | null;
  hora_fim: string | null;
  equipe: RecursoPessoa[];
  equipeId: string | null;
  equipeNome: string | null;
  setor: string | null;
  capacidade: number | null;
  veiculo: RecursoVeiculo | null;
  cliente: string | null;
  ordemId: string | null;
  ordemNumero: number | null;
  agendamento?: Agendamento;
  grupo: string;
  servicos?: number;
  conflito?: boolean;
  confirmado?: boolean;
};

function converterEventos(dados: Dados): Evento[] {
  const agendamentos = dados.agendamentos.map(agendamento => ({
    chave: `ag-${agendamento.id}`,
    id: agendamento.id,
    origem: 'planejamento' as const,
    titulo: agendamento.titulo,
    tipo: agendamento.tipo as TipoAgendamento,
    data_inicio: agendamento.data_inicio,
    data_fim: agendamento.data_fim,
    hora_inicio: agendamento.hora_inicio,
    hora_fim: agendamento.hora_fim,
    equipe: agendamento.planejamento_agendamento_equipe.map(item => ({ id: item.producao_colaboradores.id, nome: item.producao_colaboradores.nome })),
    equipeId: agendamento.equipe_id,
    equipeNome: agendamento.producao_equipes?.nome ?? null,
    setor: agendamento.producao_equipes?.setor ?? null,
    capacidade: agendamento.producao_equipes ? Number(agendamento.producao_equipes.capacidade_horas_dia) : null,
    veiculo: agendamento.producao_veiculos,
    cliente: agendamento.ordens_producao?.cadastros?.nome ?? null,
    ordemId: agendamento.ordem_id,
    ordemNumero: agendamento.ordens_producao?.numero ?? null,
    agendamento,
    grupo: agendamento.equipe_id ? `equipe:${agendamento.equipe_id}` : `ag:${agendamento.id}`,
  }));
  const ordens = dados.ordens.map(ordem => ({
    chave: `ordem-${ordem.id}`,
    id: ordem.id,
    origem: 'ordem' as const,
    titulo: ordem.descricao,
    tipo: 'Ordem de produção' as const,
    data_inicio: ordem.data_prevista!,
    data_fim: ordem.data_prevista!,
    hora_inicio: null,
    hora_fim: null,
    equipe: ordem.ordens_producao_equipe.map(item => ({ id: item.producao_colaboradores.id, nome: item.producao_colaboradores.nome })),
    equipeId: null,
    equipeNome: null,
    setor: null,
    capacidade: null,
    veiculo: ordem.producao_veiculos,
    cliente: ordem.cadastros?.nome ?? null,
    ordemId: ordem.id,
    ordemNumero: ordem.numero,
    grupo: `ordem:${ordem.id}`,
  }));
  // Programação: um bloco por dia + equipe/líder + veículo.
  const blocos = new Map<string, Evento>();
  for (const s of dados.programacao) {
    const grupo = s.equipe_id ? `equipe:${s.equipe_id}` : s.lider_id ? `lider:${s.lider_id}` : `linha:${s.id}`;
    const chave = `prog-${s.data}-${grupo}-${s.veiculo_id ?? ''}`;
    let b = blocos.get(chave);
    if (!b) {
      b = { chave, id: chave, origem: 'programacao', titulo: '', tipo: 'Programação', data_inicio: s.data, data_fim: s.data, hora_inicio: null, hora_fim: null, equipe: [], equipeId: s.equipe_id, equipeNome: s.producao_equipes?.nome ?? s.lider?.nome ?? null, setor: null, capacidade: null, veiculo: s.producao_veiculos, cliente: null, ordemId: null, ordemNumero: null, grupo, servicos: 0, confirmado: true };
      blocos.set(chave, b);
    }
    b.servicos = (b.servicos ?? 0) + 1;
    b.confirmado = Boolean(b.confirmado && s.conflito_confirmado);
    const setores = new Set((b.setor ?? '').split(', ').filter(Boolean)); setores.add(s.setor); b.setor = [...setores].join(', ');
    for (const p of [s.lider, ...s.programacao_servicos_ajudantes.map(a => a.producao_colaboradores)]) if (p && !b.equipe.some(x => x.id === p.id)) b.equipe.push({ id: p.id, nome: p.nome });
    b.titulo = `${b.servicos} serviço(s) programado(s)${b.equipeNome ? ` — ${b.equipeNome}` : ''}`;
    b.cliente = [b.cliente, s.cliente].filter(Boolean).slice(0, 3).join(', ') || null;
  }
  const todos = [...agendamentos, ...ordens, ...blocos.values()];
  const alocs: Alocacao[] = todos.filter(e => e.origem !== 'ordem').map(e => ({ id: e.chave, grupo: e.grupo, descricao: e.titulo, data_inicio: e.data_inicio, data_fim: e.data_fim, hora_inicio: e.hora_inicio, hora_fim: e.hora_fim, colaboradores: e.equipe.map(p => p.id), veiculo_id: e.veiculo?.id ?? null, confirmado: e.origem === 'programacao' && Boolean(e.confirmado) }));
  const emConflito = idsComAlertaPendente(detectarConflitos(alocs), alocs);
  return todos.map(e => ({ ...e, conflito: emConflito.has(e.chave) }));
}

const tonsKpi = { primary: 'bg-primary/10 text-primary', warning: 'bg-warning/10 text-warning', success: 'bg-success/10 text-success' };
function Kpi({ icon: Icon, label, value, tone = 'primary' }: { icon: typeof CalendarDays; label: string; value: number; tone?: keyof typeof tonsKpi }) {
  return <div className="flex items-center justify-between rounded-2xl border bg-surface p-4 shadow-sm">
    <div><p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>
    <div className={`flex size-10 items-center justify-center rounded-full ${tonsKpi[tone]}`}><Icon className="size-5" /></div>
  </div>;
}

function PlanejamentoPage() {
  const search = Route.useSearch();
  const navegar = Route.useNavigate();
  const navigate = useNavigate();
  const periodo = useMemo(() => periodoDaVisao(search.data, search.visao), [search.data, search.visao]);
  const { data } = useSuspenseQuery(planejamentoOptions(periodo));
  const [recurso, setRecurso] = useState('');
  const [equipeFiltro, setEquipeFiltro] = useState('');
  const [busca, setBusca] = useState('');
  const [editor, setEditor] = useState<{ agendamento?: Agendamento; tipo?: TipoAgendamento; data?: string } | null>(null);
  const eventos = useMemo(() => converterEventos(data), [data]);
  const dias = useMemo(() => diasDoPeriodo(periodo), [periodo]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    return eventos.filter(evento => {
      if (recurso === 'equipes' && !evento.equipe.length) return false;
      if (recurso === 'veiculos' && !evento.veiculo) return false;
      if (equipeFiltro && evento.equipeId !== equipeFiltro) return false;
      if (!termo) return true;
      return [evento.titulo, evento.cliente, evento.equipeNome, evento.setor, evento.veiculo?.placa, evento.veiculo?.modelo, evento.ordemNumero ? `ordem ${evento.ordemNumero}` : '', ...evento.equipe.map(pessoa => pessoa.nome)].some(valor => valor?.toLocaleLowerCase('pt-BR').includes(termo));
    });
  }, [eventos, recurso, equipeFiltro, busca]);

  const resumo = useMemo(() => ({
    compromissos: data.agendamentos.length,
    pessoas: new Set(eventos.flatMap(evento => evento.equipe.map(pessoa => pessoa.id))).size,
    veiculos: new Set(eventos.flatMap(evento => evento.veiculo ? [evento.veiculo.id] : [])).size,
    reservas: data.agendamentos.filter(agendamento => agendamento.tipo === 'Reserva de urgência').length,
  }), [data.agendamentos, eventos]);

  function mudarPeriodo(direcao: number) {
    const data = search.visao === 'diario' ? adicionarDias(search.data, direcao) : search.visao === 'semanal' ? adicionarDias(search.data, direcao * 7) : adicionarMeses(search.data, direcao);
    navegar({ search: anterior => ({ ...anterior, data }) });
  }
  function mudarVisao(visao: VisaoPlanejamento) { navegar({ search: anterior => ({ ...anterior, visao }) }); }
  function abrirDia(data: string) { navegar({ search: { visao: 'diario', data } }); }
  function abrirEvento(evento: Evento) {
    if (evento.origem === 'programacao') navigate({ to: '/planejamento/programacao', search: { data: evento.data_inicio, aba: 'resumo' } });
    else if (evento.origem === 'planejamento' && evento.agendamento) setEditor({ agendamento: evento.agendamento });
    else if (evento.ordemId) navigate({ to: '/producao/$id', params: { id: evento.ordemId } });
  }

  return <div className="space-y-5 p-4 md:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-semibold">Planejamento</h1><p className="text-sm text-text-secondary">Cronograma de equipes, veículos e capacidade para urgências</p></div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild><Link to="/planejamento/programacao" search={{ data: search.data, aba: 'lancamento' }}><ListChecks />Programação de serviços</Link></Button>
        <Button variant="outline" asChild><Link to="/planejamento/catalogos"><Package />Produtos e serviços</Link></Button>
        <Button variant="outline" asChild><Link to="/planejamento/veiculos"><Truck />Veículos</Link></Button>
        <Button variant="outline" asChild><Link to="/planejamento/equipes"><UsersRound />Cadastrar equipes</Link></Button>
        <Button variant="outline" onClick={() => setEditor({ tipo: 'Reserva de urgência', data: search.data })}><ShieldAlert />Reserva para urgências</Button>
        <Button onClick={() => setEditor({ data: search.data })}><Plus />Novo agendamento</Button>
      </div>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi icon={CalendarDays} label="Compromissos no período" value={resumo.compromissos} />
      <Kpi icon={UsersRound} label="Colaboradores mobilizados" value={resumo.pessoas} tone="success" />
      <Kpi icon={Truck} label="Veículos em uso" value={resumo.veiculos} />
      <Kpi icon={ShieldAlert} label="Reservas para urgências" value={resumo.reservas} tone="warning" />
    </div>

    <section className="space-y-4 rounded-2xl border bg-surface p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Período anterior" onClick={() => mudarPeriodo(-1)}><ChevronLeft /></Button>
          <Button variant="outline" size="sm" onClick={() => navegar({ search: anterior => ({ ...anterior, data: data.hoje }) })}>Hoje</Button>
          <Button variant="outline" size="icon" aria-label="Próximo período" onClick={() => mudarPeriodo(1)}><ChevronRight /></Button>
          <h2 className="ml-1 text-lg font-semibold">{tituloDoPeriodo(search.data, search.visao)}</h2>
        </div>
        <div className="inline-flex rounded-lg border bg-surface-elevated p-1">
          {([['diario', 'Dia'], ['semanal', 'Semana'], ['mensal', 'Mês']] as const).map(([visao, label]) => <button key={visao} aria-pressed={search.visao === visao} onClick={() => mudarVisao(visao)} className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${search.visao === visao ? 'bg-primary text-primary-foreground shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>{label}</button>)}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_220px_240px]">
        <Input aria-label="Buscar no cronograma" placeholder="Buscar compromisso, ordem, pessoa ou veículo…" value={busca} onChange={evento => setBusca(evento.target.value)} />
        <select aria-label="Filtrar recursos" className="h-10 rounded-md border bg-surface px-3 text-sm" value={recurso} onChange={evento => setRecurso(evento.target.value)}>
          <option value="">Equipes e veículos</option><option value="equipes">Somente com equipe</option><option value="veiculos">Somente com veículo</option>
        </select>
        <select aria-label="Filtrar equipe" className="h-10 rounded-md border bg-surface px-3 text-sm" value={equipeFiltro} onChange={evento => setEquipeFiltro(evento.target.value)}>
          <option value="">Todas as equipes cadastradas</option>{data.equipes.map(equipe => <option key={equipe.id} value={equipe.id}>{equipe.nome} — {equipe.setor}</option>)}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-secondary">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-primary" />Agendamento</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-warning" />Reserva de urgência</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-danger" />Urgência</span>
        <span className="flex items-center gap-1.5"><ClipboardList className="size-3.5" />Ordem ainda não agendada</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-success" />Programação de serviços</span>
        <span className="flex items-center gap-1.5"><AlertTriangle className="size-3.5 text-warning" />Aviso de recurso compartilhado</span>
      </div>

      {search.visao === 'diario' && <VisaoDiaria dia={search.data} eventos={filtrados} onOpen={abrirEvento} />}
      {search.visao === 'semanal' && <VisaoSemanal dias={dias} hoje={data.hoje} eventos={filtrados} onOpen={abrirEvento} onDia={abrirDia} />}
      {search.visao === 'mensal' && <VisaoMensal dias={dias} anchor={search.data} hoje={data.hoje} eventos={filtrados} onOpen={abrirEvento} onDia={abrirDia} />}
    </section>

    {editor && <AgendamentoDialog
      key={editor.agendamento?.id ?? `${editor.tipo ?? 'Agendamento'}-${editor.data ?? search.data}`}
      dados={data}
      {...(editor.agendamento ? { agendamento: editor.agendamento } : {})}
      tipoInicial={editor.tipo ?? 'Agendamento'}
      dataInicial={editor.data ?? search.data}
      onClose={() => setEditor(null)}
    />}
  </div>;
}

const tomEvento: Record<Evento['tipo'], string> = {
  Agendamento: 'border-primary/30 bg-primary/5 hover:border-primary/60',
  'Reserva de urgência': 'border-warning/50 bg-warning/10 hover:border-warning',
  Urgência: 'border-danger/50 bg-danger/10 hover:border-danger',
  'Ordem de produção': 'border-border bg-surface-elevated hover:border-primary/40',
  Programação: 'border-success/40 bg-success/5 hover:border-success',
};

function IconeEvento({ tipo }: { tipo: Evento['tipo'] }) {
  if (tipo === 'Reserva de urgência') return <ShieldAlert className="size-4 shrink-0 text-warning" />;
  if (tipo === 'Urgência') return <AlarmClock className="size-4 shrink-0 text-danger" />;
  if (tipo === 'Programação') return <ListChecks className="size-4 shrink-0 text-success" />;
  if (tipo === 'Ordem de produção') return <ClipboardList className="size-4 shrink-0 text-text-secondary" />;
  return <CalendarDays className="size-4 shrink-0 text-primary" />;
}

function EventoCard({ evento, onOpen, compacto = false }: { evento: Evento; onOpen: (evento: Evento) => void; compacto?: boolean }) {
  const equipeNomeExibicao = evento.origem === 'programacao' && !evento.equipeId && evento.equipeNome ? abreviarNome(evento.equipeNome) : evento.equipeNome;
  return <button type="button" onClick={() => onOpen(evento)} className={`w-full rounded-xl border p-3 text-left shadow-sm transition ${tomEvento[evento.tipo]} ${evento.conflito ? 'ring-2 ring-warning/60' : ''}`}>
    <div className="flex items-start gap-2"><IconeEvento tipo={evento.tipo} /><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-semibold">{evento.titulo}</p>{evento.ordemNumero && <p className="mt-0.5 text-xs text-text-secondary">Ordem nº {evento.ordemNumero}</p>}{evento.conflito && <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-warning"><AlertTriangle className="size-3" />Recurso compartilhado</p>}</div></div>
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
      <span>{evento.hora_inicio ? `${horarioCurto(evento.hora_inicio)}–${horarioCurto(evento.hora_fim)}` : 'Dia inteiro'}</span>
      {evento.data_inicio !== evento.data_fim && <Badge variant="outline" className="bg-surface px-1.5 py-0 text-[10px]">até {dataBR(evento.data_fim)}</Badge>}
      {evento.tipo !== 'Agendamento' && evento.tipo !== 'Programação' && <Badge variant="outline" className="bg-surface px-1.5 py-0 text-[10px]">{evento.tipo}</Badge>}
    </div>
    {!compacto && <div className="mt-3 space-y-1.5 text-xs">
      {evento.equipeNome && <p title={evento.equipeNome} className="flex items-center gap-1.5 font-medium text-primary"><UsersRound className="size-3.5 shrink-0" />{[equipeNomeExibicao, evento.setor, evento.capacidade != null ? `${evento.capacidade.toLocaleString('pt-BR')} h/dia` : null].filter(Boolean).join(' · ')}</p>}
      <p className="flex items-start gap-1.5"><UsersRound className="mt-0.5 size-3.5 shrink-0 text-text-secondary" /><span title={evento.equipe.map(pessoa => pessoa.nome).join(', ')} className="line-clamp-2">{evento.equipe.length ? evento.equipe.map(pessoa => abreviarNome(pessoa.nome)).join(', ') : 'Sem equipe definida'}</span></p>
      <p className="flex items-center gap-1.5"><Truck className="size-3.5 shrink-0 text-text-secondary" /><span>{evento.veiculo ? `${evento.veiculo.placa} — ${evento.veiculo.modelo}` : 'Sem veículo'}</span></p>
      {evento.cliente && <p className="truncate text-text-secondary">{evento.cliente}</p>}
    </div>}
  </button>;
}

function Vazio({ texto }: { texto: string }) {
  return <div className="rounded-xl border border-dashed p-10 text-center"><CalendarDays className="mx-auto mb-2 size-8 text-text-secondary opacity-50" /><p className="text-sm text-text-secondary">{texto}</p></div>;
}

function VisaoDiaria({ dia, eventos, onOpen }: { dia: string; eventos: Evento[]; onOpen: (evento: Evento) => void }) {
  const doDia = eventos.filter(evento => eventoNoDia(evento, dia)).sort((a, b) => (a.hora_inicio ?? '').localeCompare(b.hora_inicio ?? '') || a.titulo.localeCompare(b.titulo));
  if (!doDia.length) return <Vazio texto="Nenhum compromisso para este dia. Use “Novo agendamento” ou crie uma reserva para urgências." />;
  return <div className="grid gap-3 lg:grid-cols-2">{doDia.map(evento => <EventoCard key={evento.chave} evento={evento} onOpen={onOpen} />)}</div>;
}

function VisaoSemanal({ dias, hoje, eventos, onOpen, onDia }: { dias: string[]; hoje: string; eventos: Evento[]; onOpen: (evento: Evento) => void; onDia: (dia: string) => void }) {
  return <div className="overflow-x-auto rounded-xl border"><div className="grid min-w-[840px] grid-cols-7 divide-x">
    {dias.map((dia, indice) => {
      const doDia = eventos.filter(evento => eventoNoDia(evento, dia));
      return <section key={dia} className={`min-h-72 ${dia === hoje ? 'bg-primary/5' : ''}`}>
        <button type="button" onClick={() => onDia(dia)} className="w-full border-b bg-surface-elevated px-2 py-3 text-center hover:bg-primary/10"><span className="block text-xs font-medium uppercase text-text-secondary">{DIAS_SEMANA_CURTOS[indice]}</span><span className={`mt-1 inline-flex size-8 items-center justify-center rounded-full text-sm font-semibold ${dia === hoje ? 'bg-primary text-primary-foreground' : ''}`}>{dia.slice(8)}</span></button>
        <div className="space-y-2 p-2">{doDia.map(evento => <EventoCard key={evento.chave} evento={evento} onOpen={onOpen} compacto />)}{!doDia.length && <p className="py-8 text-center text-xs text-text-secondary">Livre</p>}</div>
      </section>;
    })}
  </div></div>;
}

function VisaoMensal({ dias, anchor, hoje, eventos, onOpen, onDia }: { dias: string[]; anchor: string; hoje: string; eventos: Evento[]; onOpen: (evento: Evento) => void; onDia: (dia: string) => void }) {
  return <div className="overflow-x-auto rounded-xl border"><div className="min-w-[840px]">
    <div className="grid grid-cols-7 border-b bg-surface-elevated">{DIAS_SEMANA_CURTOS.map(dia => <div key={dia} className="p-2 text-center text-xs font-semibold uppercase text-text-secondary">{dia}</div>)}</div>
    <div className="grid grid-cols-7">{dias.map(dia => {
      const doDia = eventos.filter(evento => eventoNoDia(evento, dia));
      const foraDoMes = dia.slice(0, 7) !== anchor.slice(0, 7);
      return <section key={dia} className={`min-h-32 border-b border-r p-1.5 ${foraDoMes ? 'bg-surface-elevated/60' : dia === hoje ? 'bg-primary/5' : ''}`}>
        <button type="button" onClick={() => onDia(dia)} className={`mb-1 flex size-7 items-center justify-center rounded-full text-xs font-semibold hover:bg-primary/10 ${dia === hoje ? 'bg-primary text-primary-foreground' : foraDoMes ? 'text-text-secondary' : ''}`}>{dia.slice(8)}</button>
        <div className="space-y-1">{doDia.slice(0, 3).map(evento => <button type="button" key={evento.chave} title={evento.titulo} onClick={() => onOpen(evento)} className={`flex w-full items-center gap-1 rounded-md border px-1.5 py-1 text-left text-[11px] ${tomEvento[evento.tipo]} ${evento.conflito ? 'ring-1 ring-warning' : ''}`}>{evento.conflito ? <AlertTriangle className="size-4 shrink-0 text-warning" /> : <IconeEvento tipo={evento.tipo} />}<span className="truncate">{evento.hora_inicio ? `${horarioCurto(evento.hora_inicio)} ` : ''}{evento.titulo}</span></button>)}
          {doDia.length > 3 && <button type="button" onClick={() => onDia(dia)} className="w-full px-1 text-left text-[11px] font-medium text-primary hover:underline">+ {doDia.length - 3} compromisso(s)</button>}
        </div>
      </section>;
    })}</div>
  </div></div>;
}
