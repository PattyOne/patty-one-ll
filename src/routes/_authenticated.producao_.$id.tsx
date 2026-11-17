import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowLeft, Check, CheckCircle2, Clock3, History, Loader2, Save, Search, Truck, UsersRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ordemProducaoOptions, recursosProducaoOptions } from '@/lib/producao-queries';
import { alertaPrazo, etapasDaOrdem, podeConcluirOrdem, PRIORIDADES_ORDEM, progressoOrdem, STATUS_ORDEM, textoAlertaPrazo, TIPOS_ORDEM, validarOrdem, type StatusOrdem, type TipoOrdem } from '@/lib/producao';
import { OrdemStatus } from '@/components/OrdemStatus';
import { CadastroError } from '@/components/CadastroErrors';
import { pageMeta } from '@/lib/page-meta';
import { dataBR } from '@/lib/vendas-calc';

export const Route = createFileRoute('/_authenticated/producao_/$id')({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(recursosProducaoOptions());
    if (params.id !== 'nova') await context.queryClient.ensureQueryData(ordemProducaoOptions(params.id));
  },
  head: () => pageMeta('Ordem de produção', 'Criação e acompanhamento de ordem de instalação ou impressão.'),
  errorComponent: CadastroError,
  component: OrdemPage,
});

type Cliente = { id: string; nome: string };
type Form = {
  tipo: TipoOrdem; status: StatusOrdem; prioridade: string; venda_id: string; cliente: Cliente | null;
  servico_id: string; descricao: string; data_prevista: string; local_instalacao: string;
  veiculo_id: string; observacao: string; equipe: string[]; etapas: string[];
};
type Doc = Awaited<ReturnType<typeof import('@/lib/producao.functions').getOrdemProducao>>;
const selecionar = 'h-10 w-full rounded-md border bg-surface px-3 text-sm';
function listaEtapas(valor: unknown): string[] { return Array.isArray(valor) ? valor.filter((v): v is string => typeof v === 'string') : []; }

function OrdemPage() {
  const { id } = Route.useParams();
  return id === 'nova' ? <Editor key="nova" /> : <Existente id={id} />;
}
function Existente({ id }: { id: string }) {
  const { data } = useSuspenseQuery(ordemProducaoOptions(id));
  return <Editor key={`${id}-${data.updated_at}`} doc={data} />;
}

function Editor({ doc }: { doc?: Doc }) {
  const { data: recursos } = useSuspenseQuery(recursosProducaoOptions());
  const navigate = useNavigate(); const qc = useQueryClient();
  const [f, setF] = useState<Form>(() => doc ? {
    tipo: doc.tipo as TipoOrdem, status: doc.status as StatusOrdem, prioridade: doc.prioridade,
    venda_id: doc.venda_id ?? '', cliente: doc.cadastros ? { id: doc.cadastros.id, nome: doc.cadastros.nome } : null,
    servico_id: doc.servico_id ?? '', descricao: doc.descricao, data_prevista: doc.data_prevista ?? '',
    local_instalacao: doc.local_instalacao ?? '', veiculo_id: doc.veiculo_id ?? '', observacao: doc.observacao ?? '',
    equipe: doc.ordens_producao_equipe.map(e => e.producao_colaboradores.id),
    etapas: doc.ordens_producao_etapas.map(e => e.nome),
  } : { tipo: 'Instalação', status: 'Aguardando', prioridade: 'Normal', venda_id: '', cliente: null, servico_id: '', descricao: '', data_prevista: '', local_instalacao: '', veiculo_id: '', observacao: '', equipe: [], etapas: etapasDaOrdem('Instalação') });
  const set = (p: Partial<Form>) => setF(atual => ({ ...atual, ...p }));
  const servico = recursos.servicos.find(s => s.id === f.servico_id);
  const etapasAtuais = doc?.ordens_producao_etapas ?? [];
  const progresso = progressoOrdem(etapasAtuais);
  const alerta = doc ? alertaPrazo(doc.data_prevista, f.status, new Date().toISOString().slice(0, 10)) : null;

  function escolherServico(id: string) {
    const escolhido = recursos.servicos.find(s => s.id === id);
    set({ servico_id: id, descricao: !f.descricao.trim() && escolhido ? escolhido.nome : f.descricao, etapas: etapasDaOrdem(f.tipo, listaEtapas(escolhido?.etapas)) });
  }
  function escolherTipo(tipo: TipoOrdem) {
    set({ tipo, status: doc ? f.status : 'Aguardando', etapas: etapasDaOrdem(tipo, listaEtapas(servico?.etapas)) });
  }
  function escolherPedido(id: string) {
    const pedido = recursos.pedidos.find(p => p.id === id);
    const item = pedido?.vendas_itens[0];
    set({ venda_id: id, cliente: pedido?.cadastros ? { id: pedido.cadastros.id, nome: pedido.cadastros.nome } : null,
      descricao: item?.descricao || f.descricao, local_instalacao: f.tipo === 'Instalação' ? (item?.ponto || f.local_instalacao) : f.local_instalacao });
  }

  const salvar = useMutation({
    mutationFn: async () => {
      const erro = validarOrdem({ tipo: f.tipo, descricao: f.descricao, local_instalacao: f.local_instalacao, etapas: f.etapas });
      if (erro) throw new Error(erro);
      if (f.status === 'Concluída' && doc && !podeConcluirOrdem(doc.ordens_producao_etapas)) throw new Error('Conclua todas as etapas antes de concluir a ordem.');
      const dados = { ...f, cadastro_id: f.cliente?.id ?? '', equipe: f.equipe, etapas: f.etapas };
      const r = await supabase.rpc('salvar_ordem_producao', { dados, ...(doc ? { ordem_uuid: doc.id } : {}) });
      if (r.error) throw new Error(r.error.message);
      return r.data;
    },
    onSuccess: async id => {
      toast.success(doc ? 'Ordem atualizada' : 'Ordem de produção criada');
      await qc.invalidateQueries({ queryKey: ['producao'] });
      if (!doc) navigate({ to: '/producao/$id', params: { id }, replace: true });
    },
    onError: e => toast.error(e.message),
  });
  const etapa = useMutation({
    mutationFn: async ({ id, concluida }: { id: string; concluida: boolean }) => {
      const r = await supabase.rpc('atualizar_etapa_producao', { etapa_uuid: id, concluida });
      if (r.error) throw new Error(r.error.message);
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ['producao'] }); },
    onError: e => toast.error(e.message),
  });

  return <div className="space-y-5 p-4 md:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild aria-label="Voltar"><Link to="/producao" search={{ tipo: '', status: '', busca: '', pagina: 1 }}><ArrowLeft /></Link></Button>
        <div><div className="flex items-center gap-2"><h1 className="text-2xl font-semibold">{doc ? `Ordem nº ${doc.numero}` : 'Nova ordem de produção'}</h1>{doc && <OrdemStatus status={doc.status} />}</div><p className="text-sm text-text-secondary">{doc ? `Criada em ${dataBR(doc.created_at)}` : 'Instalação ou impressão'}</p></div>
      </div>
      <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>{salvar.isPending ? <Loader2 className="animate-spin" /> : <Save />}Salvar ordem</Button>
    </div>

    {alerta && <div role="alert" className={`flex items-start gap-3 rounded-2xl border p-4 ${alerta.tipo === 'atrasada' ? 'border-danger/40 bg-danger/5 text-danger' : 'border-warning/40 bg-warning/5 text-warning'}`}>
      <AlertTriangle className="mt-0.5 size-5 shrink-0" /><div><p className="font-semibold">{textoAlertaPrazo(alerta)}</p><p className="mt-0.5 text-sm text-text-secondary">Data prevista: {dataBR(doc!.data_prevista!)}. Revise as etapas e a prioridade desta ordem.</p></div>
    </div>}

    <section className="grid gap-4 rounded-2xl border bg-surface p-5 shadow-sm md:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1.5"><Label htmlFor="tipo">Tipo de ordem</Label><select id="tipo" className={selecionar} value={f.tipo} onChange={e => escolherTipo(e.target.value as TipoOrdem)}>{TIPOS_ORDEM.map(t => <option key={t}>{t}</option>)}</select></div>
      <div className="space-y-1.5"><Label htmlFor="prioridade">Prioridade</Label><select id="prioridade" className={selecionar} value={f.prioridade} onChange={e => set({ prioridade: e.target.value })}>{PRIORIDADES_ORDEM.map(p => <option key={p}>{p}</option>)}</select></div>
      <div className="space-y-1.5"><Label htmlFor="previsao">Data prevista</Label><Input id="previsao" type="date" value={f.data_prevista} onChange={e => set({ data_prevista: e.target.value })} /></div>
      <div className="space-y-1.5"><Label htmlFor="status">Situação</Label><select id="status" className={selecionar} value={f.status} disabled={!doc} onChange={e => set({ status: e.target.value as StatusOrdem })}>{STATUS_ORDEM.map(s => <option key={s} disabled={s === 'Concluída' && !!doc && !podeConcluirOrdem(doc.ordens_producao_etapas)}>{s}</option>)}</select></div>
      <div className="space-y-1.5 lg:col-span-2"><Label htmlFor="pedido">Pedido de venda (opcional)</Label><select id="pedido" className={selecionar} value={f.venda_id} onChange={e => escolherPedido(e.target.value)}><option value="">Sem vínculo com pedido</option>{recursos.pedidos.map(p => <option key={p.id} value={p.id}>Pedido {p.numero} — {p.cadastros?.nome ?? 'Sem cliente'}</option>)}</select></div>
      <div className="space-y-1.5 lg:col-span-2"><Label>Cliente</Label><ClientePicker value={f.cliente} onChange={cliente => set({ cliente })} /></div>
      <div className="space-y-1.5 md:col-span-2"><Label htmlFor="servico">Serviço</Label><select id="servico" className={selecionar} value={f.servico_id} onChange={e => escolherServico(e.target.value)}><option value="">Fluxo padrão do tipo</option>{recursos.servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}</select></div>
      <div className="space-y-1.5 md:col-span-2"><Label htmlFor="descricao">Descrição</Label><Input id="descricao" placeholder="O que precisa ser produzido ou instalado?" value={f.descricao} onChange={e => set({ descricao: e.target.value })} /></div>
      {f.tipo === 'Instalação' && <>
        <div className="space-y-1.5 md:col-span-2"><Label htmlFor="local">Local da instalação</Label><Input id="local" placeholder="Endereço ou ponto de mídia" value={f.local_instalacao} onChange={e => set({ local_instalacao: e.target.value })} /></div>
        <div className="space-y-1.5 md:col-span-2"><Label htmlFor="veiculo">Veículo</Label><div className="relative"><Truck className="pointer-events-none absolute left-3 top-3 size-4 text-text-secondary" /><select id="veiculo" className={`${selecionar} pl-9`} value={f.veiculo_id} onChange={e => set({ veiculo_id: e.target.value })}><option value="">Nenhum veículo</option>{recursos.veiculos.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.modelo}</option>)}</select></div></div>
      </>}
    </section>

    <div className="grid gap-5 lg:grid-cols-2">
      <section className="space-y-4 rounded-2xl border bg-surface p-5 shadow-sm">
        <div className="flex items-center justify-between"><div><h2 className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-5 text-primary" />Etapas</h2><p className="text-sm text-text-secondary">{doc ? `${etapasAtuais.filter(e => e.concluido).length} de ${etapasAtuais.length} concluídas` : 'O fluxo será criado junto com a ordem'}</p></div>{doc && <span className="text-lg font-semibold">{progresso}%</span>}</div>
        {doc && <div className="h-2 overflow-hidden rounded-full bg-surface-elevated"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progresso}%` }} /></div>}
        <div className="space-y-2">{(doc ? etapasAtuais : f.etapas.map((nome, i) => ({ id: String(i), nome, concluido: false }))).map((e, i) => <label key={e.id} className={`flex items-center gap-3 rounded-xl border p-3 ${doc && !['Concluída', 'Cancelada'].includes(f.status) ? 'cursor-pointer hover:bg-surface-elevated' : ''}`}>
          <input type="checkbox" className="size-4 accent-[hsl(var(--primary))]" checked={e.concluido} disabled={!doc || etapa.isPending || ['Concluída', 'Cancelada'].includes(f.status)} onChange={ev => doc && etapa.mutate({ id: e.id, concluida: ev.target.checked })} />
          <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">{e.concluido ? <Check className="size-4" /> : i + 1}</span>
          <span className={e.concluido ? 'text-text-secondary line-through' : ''}>{e.nome}</span>
        </label>)}</div>
        {doc && <p className="text-xs text-text-secondary">Para concluir a ordem, marque todas as etapas e depois altere a situação para “Concluída”.</p>}
      </section>

      <section className="space-y-4 rounded-2xl border bg-surface p-5 shadow-sm">
        <div><h2 className="flex items-center gap-2 font-semibold"><UsersRound className="size-5 text-primary" />Equipe</h2><p className="text-sm text-text-secondary">{f.equipe.length ? `${f.equipe.length} colaborador(es) selecionado(s)` : 'Selecione os colaboradores da ordem'}</p></div>
        <details className="rounded-xl border" open={!doc}><summary className="cursor-pointer px-4 py-3 text-sm font-medium">Escolher colaboradores</summary><div className="grid max-h-80 gap-1 overflow-y-auto border-t p-2 sm:grid-cols-2">{recursos.colaboradores.map(c => <label key={c.id} className="flex cursor-pointer items-start gap-2 rounded-lg p-2 text-sm hover:bg-surface-elevated"><input type="checkbox" className="mt-0.5 size-4 accent-[hsl(var(--primary))]" checked={f.equipe.includes(c.id)} onChange={e => set({ equipe: e.target.checked ? [...f.equipe, c.id] : f.equipe.filter(id => id !== c.id) })} /><span>{c.nome}<span className="block text-xs text-text-secondary">{c.empresa}</span></span></label>)}</div></details>
        <div className="space-y-1.5"><Label htmlFor="observacao">Observações</Label><Textarea id="observacao" rows={5} placeholder="Materiais, medidas, orientações para a equipe…" value={f.observacao} onChange={e => set({ observacao: e.target.value })} /></div>
      </section>
    </div>

    {doc && <section className="space-y-4 rounded-2xl border bg-surface p-5 shadow-sm"><h2 className="flex items-center gap-2 font-semibold"><History className="size-5 text-primary" />Histórico da ordem</h2><div className="space-y-0">{doc.ordens_producao_eventos.map(e => <div key={e.id} className="relative flex gap-3 border-l pb-5 pl-5 last:pb-0"><Clock3 className="absolute -left-2 top-0 size-4 rounded-full bg-surface text-primary" /><div><p className="text-sm font-medium">{e.descricao}</p><p className="text-xs text-text-secondary">{new Date(e.created_at).toLocaleString('pt-BR')} · {e.profiles?.full_name || 'Equipe'}</p></div></div>)}</div></section>}
  </div>;
}

function ClientePicker({ value, onChange }: { value: Cliente | null; onChange: (c: Cliente | null) => void }) {
  const [busca, setBusca] = useState(''); const [termo, setTermo] = useState('');
  useEffect(() => { const t = setTimeout(() => setTermo(busca.trim()), 300); return () => clearTimeout(t); }, [busca]);
  const r = useQuery({ queryKey: ['producao', 'clientes', termo], enabled: termo.length >= 2 && !value, queryFn: async () => {
    const res = await supabase.rpc('listar_cadastros', { filtros: { busca: termo, vendedor: '', estado: '', tipo: '', sem_vendedor: false }, pagina: 1 });
    if (res.error) throw new Error(res.error.message);
    return (res.data as unknown as { linhas: Cliente[] }).linhas.slice(0, 8);
  } });
  if (value) return <div className="flex h-10 items-center justify-between rounded-md border bg-surface px-3 text-sm"><span className="truncate">{value.nome}</span><button type="button" className="text-primary hover:underline" onClick={() => onChange(null)}>Trocar</button></div>;
  return <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-text-secondary" /><Input aria-label="Buscar cliente" className="pl-9" placeholder="Buscar cliente (opcional)…" value={busca} onChange={e => setBusca(e.target.value)} />
    {termo.length >= 2 && !value && <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-surface shadow-floating">
      {r.data?.map(c => <button type="button" key={c.id} className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-elevated" onClick={() => { onChange(c); setBusca(''); }}>{c.nome}</button>)}
      {r.data?.length === 0 && <p className="px-3 py-2 text-sm text-text-secondary">Nenhum cadastro encontrado.</p>}
      {r.isLoading && <p className="px-3 py-2 text-sm text-text-secondary">Buscando…</p>}
    </div>}
  </div>;
}
