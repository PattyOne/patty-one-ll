import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { zodValidator } from '@tanstack/zod-adapter';
import { Plus, ChevronLeft, ChevronRight, FileText, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { vendasFiltersSchema, type VendasFilters } from '@/lib/vendas.functions';
import { vendasListOptions } from '@/lib/vendas-queries';
import { totaisVenda, brl, dataBR, STATUS } from '@/lib/vendas-calc';
import { StatusBadge } from '@/components/VendaStatus';
import { CadastroError } from '@/components/CadastroErrors';
import { pageMeta } from '@/lib/page-meta';

export const Route = createFileRoute('/_authenticated/comercial')({
  validateSearch: zodValidator(vendasFiltersSchema),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => { await context.queryClient.ensureQueryData(vendasListOptions(deps)); },
  head: () => pageMeta('Comercial', 'Propostas comerciais e pedidos de venda das empresas do grupo.'),
  errorComponent: CadastroError,
  component: ComercialPage,
});

function ComercialPage() {
  const f = Route.useSearch(); const navigate = Route.useNavigate();
  const { data } = useSuspenseQuery(vendasListOptions(f));
  const set = (p: Partial<VendasFilters>) => navigate({ search: prev => ({ ...prev, pagina: 1, ...p }) });
  const pages = Math.max(1, Math.ceil(data.total / 50));
  const proposta = f.tipo === 'proposta';
  return <div className="space-y-5 p-4 md:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-semibold">Comercial</h1><p className="text-sm text-text-secondary">Propostas e pedidos de venda</p></div>
      <div className="flex gap-2">
         <Button variant="outline" asChild><Link to="/comercial/historico"><FileText />Histórico SIGE</Link></Button>
        <Button variant="outline" asChild><Link to="/comercial/$id" params={{ id: 'novo-pedido' }}><ShoppingCart />Novo pedido</Link></Button>
        <Button asChild><Link to="/comercial/$id" params={{ id: 'nova-proposta' }}><Plus />Nova proposta</Link></Button>
      </div>
    </div>
    <div className="inline-flex rounded-lg border bg-surface p-1">
      {(['proposta', 'pedido'] as const).map(t => <button key={t} onClick={() => set({ tipo: t, status: '' })} className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${f.tipo === t ? 'bg-primary text-primary-foreground' : 'text-text-secondary hover:text-text-primary'}`}>{t === 'proposta' ? 'Propostas' : 'Pedidos'}</button>)}
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      <Input aria-label="Buscar" placeholder="Buscar por cliente ou número…" value={f.busca} onChange={e => set({ busca: e.target.value })} className="sm:col-span-2" />
      <select aria-label="Filtrar situação" className="h-10 rounded-md border bg-surface px-3 text-sm" value={f.status} onChange={e => set({ status: e.target.value })}><option value="">Todas as situações</option>{STATUS[f.tipo].map(s => <option key={s}>{s}</option>)}</select>
    </div>
    <p className="text-sm text-text-secondary">{data.total.toLocaleString('pt-BR')} {proposta ? 'propostas' : 'pedidos'}</p>
    <div className="overflow-x-auto rounded-md border bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-elevated"><tr><th className="p-3">Nº</th><th className="p-3">Cliente</th><th className="p-3">Empresa</th><th className="p-3">Vendedor</th><th className="p-3">{proposta ? 'Validade' : 'Data'}</th><th className="p-3">Situação</th><th className="p-3 text-right">Total</th></tr></thead>
        <tbody>
          {data.linhas.map(r => <tr key={r.id} className="border-t hover:bg-surface-elevated">
            <td className="p-3 font-medium"><Link to="/comercial/$id" params={{ id: r.id }} className="text-primary hover:underline">{r.numero}</Link></td>
            <td className="p-3"><Link to="/comercial/$id" params={{ id: r.id }} className="hover:underline">{r.cadastros?.nome}</Link>{r.proposta_id && <Badge variant="outline" className="ml-2">da proposta</Badge>}</td>
            <td className="p-3 text-text-secondary">{r.empresas?.nome}</td>
            <td className="p-3">{r.vendedor ?? '—'}</td>
            <td className="p-3">{dataBR(proposta ? r.validade : r.created_at) || '—'}</td>
            <td className="p-3"><StatusBadge status={r.status} /></td>
            <td className="p-3 text-right font-medium">{brl(totaisVenda(r.vendas_itens, r.desconto).total)}</td>
          </tr>)}
          {!data.linhas.length && <tr><td colSpan={7} className="p-10 text-center text-text-secondary"><FileText className="mx-auto mb-2 size-8 opacity-50" />Nenhum{proposta ? 'a proposta' : ' pedido'} encontrad{proposta ? 'a' : 'o'}.</td></tr>}
        </tbody>
      </table>
    </div>
    {pages > 1 && <div className="flex items-center justify-end gap-2"><Button variant="outline" size="icon" aria-label="Página anterior" disabled={f.pagina <= 1} onClick={() => navigate({ search: p => ({ ...p, pagina: f.pagina - 1 }) })}><ChevronLeft /></Button><span className="text-sm">{f.pagina} de {pages}</span><Button variant="outline" size="icon" aria-label="Próxima página" disabled={f.pagina >= pages} onClick={() => navigate({ search: p => ({ ...p, pagina: f.pagina + 1 }) })}><ChevronRight /></Button></div>}
  </div>;
}
