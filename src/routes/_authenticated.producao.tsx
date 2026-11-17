import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { zodValidator } from '@tanstack/zod-adapter';
import { Plus, ChevronLeft, ChevronRight, ClipboardList, Clock3, PlayCircle, AlertTriangle, CheckCircle2, Wrench, Printer, BellRing, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { producaoFiltersSchema, type ProducaoFilters } from '@/lib/producao.functions';
import { ordensProducaoOptions } from '@/lib/producao-queries';
import { alertaPrazo, progressoOrdem, STATUS_ORDEM, textoAlertaPrazo, TIPOS_ORDEM } from '@/lib/producao';
import { dataBR } from '@/lib/vendas-calc';
import { CadastroError } from '@/components/CadastroErrors';
import { OrdemStatus } from '@/components/OrdemStatus';
import { pageMeta } from '@/lib/page-meta';

export const Route = createFileRoute('/_authenticated/producao')({
  validateSearch: zodValidator(producaoFiltersSchema),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => { await context.queryClient.ensureQueryData(ordensProducaoOptions(deps)); },
  head: () => pageMeta('Produção', 'Criação e acompanhamento de ordens de instalação e impressão.'),
  errorComponent: CadastroError,
  component: ProducaoPage,
});

function Kpi({ icon: Icon, label, value, tone = 'primary' }: { icon: typeof Clock3; label: string; value: number; tone?: 'primary' | 'warning' | 'danger' | 'success' }) {
  return <div className="flex items-center justify-between rounded-2xl border bg-surface p-5 shadow-sm">
    <div><p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>
    <div className="flex size-10 items-center justify-center rounded-full" style={{ background: `hsl(var(--${tone}) / 0.12)`, color: `hsl(var(--${tone}))` }}><Icon className="size-5" /></div>
  </div>;
}

function ProducaoPage() {
  const filtros = Route.useSearch(); const navigate = Route.useNavigate();
  const { data } = useSuspenseQuery(ordensProducaoOptions(filtros));
  const set = (p: Partial<ProducaoFilters>) => navigate({ search: anterior => ({ ...anterior, pagina: 1, ...p }) });
  const paginas = Math.max(1, Math.ceil(data.total / 50));
  const alertas = data.alertas.filter(ordem => !filtros.tipo || ordem.tipo === filtros.tipo);
  return <div className="space-y-5 p-4 md:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-semibold">Produção</h1><p className="text-sm text-text-secondary">Ordens de instalação e impressão</p></div>
      <Button asChild><Link to="/producao/$id" params={{ id: 'nova' }}><Plus />Nova ordem</Link></Button>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi icon={Clock3} label="Aguardando" value={data.resumo.aguardando} />
      <Kpi icon={PlayCircle} label="Em andamento" value={data.resumo.andamento} tone="warning" />
      <Kpi icon={AlertTriangle} label="Atrasadas" value={data.resumo.atrasadas} tone="danger" />
      <Kpi icon={CheckCircle2} label="Concluídas" value={data.resumo.concluidas} tone="success" />
    </div>
    {alertas.length > 0 && <section aria-labelledby="alertas-prazo" className="rounded-2xl border border-warning/40 bg-warning/5 p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-full bg-warning/15 text-warning"><BellRing className="size-5" /></span><div><h2 id="alertas-prazo" className="font-semibold">Alertas de prazo</h2><p className="text-sm text-text-secondary">Ordens ativas que vencem em até 3 dias ou estão atrasadas</p></div></div>
        <Badge variant="outline" className="border-warning/40 bg-surface text-text-primary">{alertas.length} {alertas.length === 1 ? 'alerta' : 'alertas'}</Badge>
      </div>
      <div className="grid max-h-96 gap-3 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
        {alertas.map(ordem => <Link key={ordem.id} to="/producao/$id" params={{ id: ordem.id }} className={`group rounded-xl border bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${ordem.alerta.tipo === 'atrasada' ? 'border-danger/40' : 'border-warning/40'}`}>
          <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2 text-sm font-semibold"><span>Ordem nº {ordem.numero}</span><Badge variant="outline">{ordem.tipo}</Badge></div><ArrowRight className="size-4 shrink-0 text-text-secondary transition group-hover:translate-x-0.5 group-hover:text-primary" /></div>
          <p className="mt-3 line-clamp-2 text-sm font-medium">{ordem.descricao}</p>
          <p className="mt-1 truncate text-xs text-text-secondary">{ordem.cadastros?.nome ?? 'Sem cliente'}</p>
          <div className={`mt-3 flex items-center gap-1.5 text-xs font-semibold ${ordem.alerta.tipo === 'atrasada' ? 'text-danger' : 'text-warning'}`}><AlertTriangle className="size-3.5" />{textoAlertaPrazo(ordem.alerta)}<span className="font-normal text-text-secondary">· {dataBR(ordem.data_prevista!)}</span></div>
        </Link>)}
      </div>
    </section>}
    <div className="inline-flex rounded-lg border bg-surface p-1">
      <button onClick={() => set({ tipo: '' })} className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${!filtros.tipo ? 'bg-primary text-primary-foreground' : 'text-text-secondary hover:text-text-primary'}`}>Todas</button>
      {TIPOS_ORDEM.map(tipo => <button key={tipo} onClick={() => set({ tipo })} className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium transition ${filtros.tipo === tipo ? 'bg-primary text-primary-foreground' : 'text-text-secondary hover:text-text-primary'}`}>{tipo === 'Instalação' ? <Wrench className="size-4" /> : <Printer className="size-4" />}{tipo}</button>)}
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      <Input aria-label="Buscar ordens" placeholder="Buscar por número, descrição ou cliente…" value={filtros.busca} onChange={e => set({ busca: e.target.value })} className="sm:col-span-2" />
      <select aria-label="Filtrar situação" className="h-10 rounded-md border bg-surface px-3 text-sm" value={filtros.status} onChange={e => set({ status: e.target.value as ProducaoFilters['status'] })}><option value="">Todas as situações</option>{STATUS_ORDEM.map(s => <option key={s}>{s}</option>)}</select>
    </div>
    <p className="text-sm text-text-secondary">{data.total.toLocaleString('pt-BR')} {data.total === 1 ? 'ordem' : 'ordens'}</p>
    <div className="overflow-x-auto rounded-md border bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-elevated"><tr><th className="p-3">Nº</th><th className="p-3">Tipo</th><th className="p-3">Ordem / cliente</th><th className="p-3">Previsão</th><th className="p-3">Progresso</th><th className="p-3">Situação</th></tr></thead>
        <tbody>{data.linhas.map(ordem => {
          const progresso = progressoOrdem(ordem.ordens_producao_etapas);
          const alerta = alertaPrazo(ordem.data_prevista, ordem.status, data.hoje);
          return <tr key={ordem.id} className="border-t hover:bg-surface-elevated">
            <td className="p-3 font-medium"><Link to="/producao/$id" params={{ id: ordem.id }} className="text-primary hover:underline">{ordem.numero}</Link>{ordem.prioridade === 'Urgente' && <Badge variant="destructive" className="ml-2">Urgente</Badge>}</td>
            <td className="p-3"><span className="inline-flex items-center gap-1.5">{ordem.tipo === 'Instalação' ? <Wrench className="size-4 text-text-secondary" /> : <Printer className="size-4 text-text-secondary" />}{ordem.tipo}</span></td>
            <td className="max-w-80 p-3"><Link to="/producao/$id" params={{ id: ordem.id }} className="font-medium hover:underline">{ordem.descricao}</Link><p className="mt-0.5 truncate text-xs text-text-secondary">{ordem.cadastros?.nome ?? 'Sem cliente'}{ordem.vendas ? ` · Pedido ${ordem.vendas.numero}` : ''}</p></td>
            <td className="p-3">{ordem.data_prevista ? <span className={alerta ? alerta.tipo === 'atrasada' ? 'text-danger' : 'text-warning' : undefined}>{dataBR(ordem.data_prevista)}{alerta && <span className="mt-0.5 block text-xs font-medium">{textoAlertaPrazo(alerta)}</span>}</span> : '—'}</td>
            <td className="min-w-32 p-3"><div className="flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-elevated"><div className="h-full rounded-full bg-primary" style={{ width: `${progresso}%` }} /></div><span className="text-xs text-text-secondary">{progresso}%</span></div></td>
            <td className="p-3"><OrdemStatus status={ordem.status} /></td>
          </tr>;
        })}{!data.linhas.length && <tr><td colSpan={6} className="p-10 text-center text-text-secondary"><ClipboardList className="mx-auto mb-2 size-8 opacity-50" />Nenhuma ordem encontrada.</td></tr>}</tbody>
      </table>
    </div>
    {paginas > 1 && <div className="flex items-center justify-end gap-2"><Button variant="outline" size="icon" aria-label="Página anterior" disabled={filtros.pagina <= 1} onClick={() => navigate({ search: p => ({ ...p, pagina: filtros.pagina - 1 }) })}><ChevronLeft /></Button><span className="text-sm">{filtros.pagina} de {paginas}</span><Button variant="outline" size="icon" aria-label="Próxima página" disabled={filtros.pagina >= paginas} onClick={() => navigate({ search: p => ({ ...p, pagina: filtros.pagina + 1 }) })}><ChevronRight /></Button></div>}
  </div>;
}
