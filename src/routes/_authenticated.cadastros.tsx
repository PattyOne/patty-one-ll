import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { filtersSchema, type Filters } from '@/lib/cadastros.functions';
import { listOptions } from '@/lib/cadastros-queries';
import { CadastroError, CadastroNotFound } from '@/components/CadastroErrors';
import { pageMeta } from '@/lib/page-meta';
import { zodValidator } from '@tanstack/zod-adapter';

export const Route = createFileRoute('/_authenticated/cadastros')({
  validateSearch: zodValidator(filtersSchema),
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => { await context.queryClient.ensureQueryData(listOptions(deps)); },
  head: () => pageMeta('Cadastros', 'Clientes, fornecedores e prestadores do grupo no PattyOne.'),
  errorComponent: CadastroError, notFoundComponent: CadastroNotFound, component: CadastrosPage,
});
function CadastrosPage() {
  const filters = Route.useSearch(); const navigate = Route.useNavigate();
  const { data } = useSuspenseQuery(listOptions(filters));
  return <CadastrosList filters={filters} data={data} change={patch => navigate({ search: prev => ({ ...prev, ...patch }) })} />;
}
function CadastrosList({ filters, data, change }: { filters: Filters; data: Awaited<ReturnType<typeof import('@/lib/cadastros.functions').getCadastros>>; change: (patch: Partial<Filters>) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [all, setAll] = useState(false); const [dialog, setDialog] = useState(false); const [vendedor, setVendedor] = useState('');
  useEffect(() => { setSelected(new Set()); setAll(false); }, [filters.busca, filters.vendedor, filters.estado, filters.tipo, filters.sem_vendedor]);
  const queryClient = useQueryClient(); const amount = all ? data.total : selected.size;
  const assign = useMutation({ mutationFn: async () => {
    const result = await supabase.rpc('atribuir_vendedor', { vendedor_novo: vendedor, ...(all ? { filtros: filters } : { ids: Array.from(selected) }) });
    if (result.error) throw new Error(result.error.message); return result.data;
  }, onSuccess: count => { toast.success(`${count} cadastros alterados`); setDialog(false); setAll(false); setSelected(new Set()); queryClient.invalidateQueries({ queryKey: ['cadastros'] }); }, onError: e => toast.error(e.message) });
  const pages = Math.max(1, Math.ceil(data.total / 50));
  const updateFilter = (patch: Partial<Filters>) => change({ ...patch, pagina: 1 });
  return <div className="space-y-5 p-4 md:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold">Cadastros</h1><Button asChild><Link to="/cadastros/$id" params={{ id: 'novo' }}><Plus />Novo cadastro</Link></Button></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Input aria-label="Buscar cadastros" placeholder="Buscar cadastros…" value={filters.busca} onChange={e => updateFilter({ busca: e.target.value })} className="sm:col-span-2 lg:col-span-4" />
      <select aria-label="Filtrar vendedor" className="h-10 rounded-md border bg-surface px-3 text-sm" value={filters.vendedor} disabled={filters.sem_vendedor} onChange={e => updateFilter({ vendedor: e.target.value })}><option value="">Todos os vendedores</option>{data.vendedores.map(v => <option key={v}>{v}</option>)}</select>
      <select aria-label="Filtrar estado" className="h-10 rounded-md border bg-surface px-3 text-sm" value={filters.estado} onChange={e => updateFilter({ estado: e.target.value })}><option value="">Todos os estados</option>{data.estados.map(v => <option key={v}>{v}</option>)}</select>
      <select aria-label="Filtrar tipo" className="h-10 rounded-md border bg-surface px-3 text-sm" value={filters.tipo} onChange={e => updateFilter({ tipo: e.target.value as Filters['tipo'] })}><option value="">Todos os tipos</option><option value="cliente">Cliente</option><option value="fornecedor">Fornecedor</option><option value="prestador">Prestador</option></select>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={filters.sem_vendedor} onChange={e => updateFilter({ sem_vendedor: e.target.checked, vendedor: '' })} className="size-4 accent-primary" />Sem vendedor</label>
    </div>
    <div className="flex flex-wrap items-center gap-3"><span className="text-sm text-text-secondary">{data.total.toLocaleString('pt-BR')} resultados</span>{amount > 0 && <><span className="text-sm">{amount} selecionados</span><Button variant="outline" size="sm" onClick={() => setDialog(true)}><UserRound />Atribuir vendedor</Button><Button variant="ghost" size="sm" onClick={() => { setAll(false); setSelected(new Set()); }}>Limpar seleção</Button></>}<Button variant="link" size="sm" disabled={!data.total} onClick={() => setAll(true)}>Selecionar todos os resultados do filtro</Button></div>
    <div className="overflow-x-auto rounded-md border bg-surface"><table className="w-full text-left text-sm"><thead className="bg-surface-elevated"><tr><th className="p-3"><input aria-label="Selecionar página" type="checkbox" checked={data.linhas.length > 0 && (all || data.linhas.every(r => selected.has(r.id)))} onChange={e => { const checked = e.target.checked; setAll(false); setSelected(current => { const next = new Set(current); for (const row of data.linhas) { if (checked) next.add(row.id); else next.delete(row.id); } return next; }); }} className="size-4 accent-primary" /></th>{['Nome', 'CPF/CNPJ', 'Cidade/UF', 'Vendedor', 'Tipo', 'Telefone'].map(h => <th key={h} className="whitespace-nowrap p-3">{h}</th>)}</tr></thead><tbody>{data.linhas.map(row => <tr key={row.id} className="border-t hover:bg-surface-elevated"><td className="p-3"><input type="checkbox" aria-label={`Selecionar ${row.nome}`} checked={all || selected.has(row.id)} onChange={e => {
      setAll(false); setSelected(current => { const next = all ? new Set(data.linhas.map(r => r.id)) : new Set(current); if (e.target.checked) next.add(row.id); else next.delete(row.id); return next; });
    }} className="size-4 accent-primary" /></td><td className="min-w-48 p-3"><Link className="font-medium text-primary hover:underline" to="/cadastros/$id" params={{ id: row.id }}>{row.nome}</Link>{row.restricao_sige && <Badge variant="outline" className="ml-2 border-warning/40 text-warning" title={row.restricao_observacao ?? undefined}>Restrição SIGE</Badge>}</td><td className="whitespace-nowrap p-3">{row.cpf_cnpj || '—'}</td><td className="min-w-32 p-3">{[row.cidade, row.estado].filter(Boolean).join('/') || '—'}</td><td className="p-3">{row.vendedor || '—'}</td><td className="p-3"><div className="flex gap-1">{row.is_cliente && <Badge variant="secondary">Cliente</Badge>}{row.is_fornecedor && <Badge variant="outline">Fornecedor</Badge>}{row.is_prestador && <Badge variant="outline">Prestador</Badge>}</div></td><td className="whitespace-nowrap p-3">{row.telefone || '—'}</td></tr>)}{!data.linhas.length && <tr><td colSpan={7} className="p-10 text-center text-text-secondary">Nenhum cadastro encontrado.</td></tr>}</tbody></table></div>
    <div className="flex items-center justify-end gap-3"><Button size="icon" variant="outline" aria-label="Página anterior" disabled={filters.pagina <= 1} onClick={() => change({ pagina: filters.pagina - 1 })}><ChevronLeft /></Button><span className="text-sm">Página {filters.pagina} de {pages}</span><Button size="icon" variant="outline" aria-label="Próxima página" disabled={filters.pagina >= pages} onClick={() => change({ pagina: filters.pagina + 1 })}><ChevronRight /></Button></div>
    <Dialog open={dialog} onOpenChange={setDialog}><DialogContent><DialogTitle>Atribuir vendedor</DialogTitle><DialogDescription>{amount} cadastros serão alterados.</DialogDescription><label className="space-y-2 text-sm">Vendedor<Input aria-label="Vendedor para atribuição" list="vendedores" value={vendedor} onChange={e => setVendedor(e.target.value)} /></label><datalist id="vendedores">{data.vendedores.map(v => <option key={v} value={v} />)}</datalist><Button disabled={!vendedor.trim() || assign.isPending} onClick={() => assign.mutate()}>Confirmar atribuição</Button></DialogContent></Dialog>
  </div>;
}
