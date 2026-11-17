import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { zodValidator } from '@tanstack/zod-adapter';
import { ArrowLeft, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { historicoFiltersSchema, type HistoricoFilters } from '@/lib/historico-comercial.functions';
import { historicoComercialOptions } from '@/lib/historico-comercial-queries';
import { pageMeta } from '@/lib/page-meta';
import { brl, dataBR } from '@/lib/vendas-calc';
import { CadastroError } from '@/components/CadastroErrors';

export const Route = createFileRoute('/_authenticated/comercial_/historico')({
  validateSearch: zodValidator(historicoFiltersSchema),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(historicoComercialOptions(deps)),
  head: () => pageMeta('Histórico comercial SIGE', 'Propostas, contratos e reservas comerciais originais do SIGE no PattyOne.'),
  errorComponent: CadastroError,
  component: HistoricoComercialPage,
});

function HistoricoComercialPage() {
  const filters = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data } = useSuspenseQuery(historicoComercialOptions(filters));
  const set = (patch: Partial<HistoricoFilters>) => navigate({ search: previous => ({ ...previous, pagina: 1, ...patch }) });
  const pages = Math.max(1, Math.ceil(data.total / 50));
  return <div className="space-y-5 p-4 md:p-6">
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="icon" asChild aria-label="Voltar ao Comercial"><Link to="/comercial"><ArrowLeft /></Link></Button>
      <h1 className="text-2xl font-semibold">Histórico comercial SIGE</h1>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      <Input aria-label="Buscar no histórico" placeholder="Cliente, número, contrato ou vendedor…" value={filters.busca} onChange={e => set({ busca: e.target.value })} className="sm:col-span-2" />
      <select aria-label="Tipo de documento" className="h-10 rounded-md border bg-surface px-3 text-sm" value={filters.tipo} onChange={e => set({ tipo: e.target.value as HistoricoFilters['tipo'] })}><option value="">Todos os documentos</option><option value="proposta">Propostas</option><option value="contrato">Contratos</option><option value="reserva">Reservas</option></select>
    </div>
    <p className="text-sm text-text-secondary">{data.total.toLocaleString('pt-BR')} registros</p>
    <div className="overflow-x-auto rounded-md border bg-surface">
      <table className="w-full text-left text-sm"><thead className="bg-surface-elevated"><tr>{['Nº SIGE', 'Tipo', 'Cliente', 'Empresa', 'Data', 'Vendedor', 'Situação SIGE', 'Valor', 'Valor líquido'].map(label => <th className="whitespace-nowrap p-3" key={label}>{label}</th>)}</tr></thead>
        <tbody>{data.linhas.map(row => <tr className="border-t hover:bg-surface-elevated" key={row.id}>
          <td className="p-3 font-medium">{row.numero_sige}{row.contrato_sige && <p className="whitespace-nowrap text-xs text-text-secondary">Contrato {row.contrato_sige}</p>}{row.proposta_numero_sige && <p className="whitespace-nowrap text-xs text-text-secondary">Proposta {row.proposta_numero_sige}</p>}{row.tipo === 'proposta' && row.autorizacao_sige && <p className="whitespace-nowrap text-xs text-text-secondary">Autorização {row.autorizacao_sige}</p>}</td>
          <td className="p-3"><Badge variant="outline">{row.tipo === 'proposta' ? 'Proposta' : row.tipo === 'contrato' ? 'Contrato' : 'Reserva'}</Badge></td>
          <td className="min-w-44 p-3">{row.cadastro_id ? <Link to="/cadastros/$id" params={{ id: row.cadastro_id }} className="hover:underline">{row.cliente_nome}</Link> : <>{row.cliente_nome}<p className="text-xs text-warning">Sem vínculo cadastral único</p></>}{row.tipo_servico && <p className="text-xs text-text-secondary">{row.tipo_servico}</p>}</td>
          <td className="min-w-36 p-3 text-text-secondary">{row.empresa_nome ?? 'Não informada'}{row.empresa_origem === 'proposta' && <p className="text-xs">Da proposta vinculada</p>}{row.empresa_nome && !row.empresa_id && <p className="text-xs text-warning">Sem vínculo com empresa do grupo</p>}</td>
          <td className="whitespace-nowrap p-3">{dataBR(row.data_documento)}</td><td className="p-3">{row.vendedor ?? '—'}</td><td className="p-3">{row.status_sige}</td>
          <td className="whitespace-nowrap p-3 text-right font-medium">{brl(row.valor)}</td><td className="whitespace-nowrap p-3 text-right">{row.valor_liquido === null ? '—' : brl(row.valor_liquido)}</td>
        </tr>)}{!data.linhas.length && <tr><td colSpan={9} className="p-10 text-center text-text-secondary"><FileText className="mx-auto mb-2 size-8" />Nenhum registro encontrado.</td></tr>}</tbody>
      </table>
    </div>
    {pages > 1 && <div className="flex items-center justify-end gap-2"><Button variant="outline" size="icon" aria-label="Página anterior" disabled={filters.pagina <= 1} onClick={() => set({ pagina: filters.pagina - 1 })}><ChevronLeft /></Button><span className="text-sm">{filters.pagina} de {pages}</span><Button variant="outline" size="icon" aria-label="Próxima página" disabled={filters.pagina >= pages} onClick={() => set({ pagina: filters.pagina + 1 })}><ChevronRight /></Button></div>}
  </div>;
}