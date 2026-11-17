import { createFileRoute, Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { zodValidator } from '@tanstack/zod-adapter';
import { ArrowLeft, ChevronLeft, ChevronRight, Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CadastroError } from '@/components/CadastroErrors';
import { LancamentoGrid } from '@/components/programacao/LancamentoGrid';
import { ResumoDia } from '@/components/programacao/ResumoDia';
import { Pendencias } from '@/components/programacao/Pendencias';
import { AgendamentosDoDia } from '@/components/programacao/AgendamentosDoDia';
import { pageMeta } from '@/lib/page-meta';
import { adicionarDias, tituloDoPeriodo } from '@/lib/planejamento';
import { programacaoSearchSchema } from '@/lib/programacao.functions';
import { programacaoOptions } from '@/lib/programacao-queries';

export const Route = createFileRoute('/_authenticated/planejamento_/programacao')({
  validateSearch: zodValidator(programacaoSearchSchema),
  loaderDeps: ({ search }) => ({ data: search.data }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(programacaoOptions(deps.data)),
  head: () => pageMeta('Programação de serviços', 'Lançamento rápido, resumo diário para WhatsApp, pendências e conflitos dos 7 setores.'),
  errorComponent: CadastroError,
  component: ProgramacaoPage,
});

function ProgramacaoPage() {
  const search = Route.useSearch();
  const navegar = Route.useNavigate();
  const { data: dados } = useSuspenseQuery(programacaoOptions(search.data));
  const irPara = (data: string) => navegar({ search: a => ({ ...a, data }) });
  const abas = [['lancamento', 'Lançamento rápido'], ['resumo', 'Resumo do dia'], ['pendencias', `Pendências (${dados.pendencias.length})`]] as const;

  return <div className="space-y-5 p-4 md:p-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="-ml-2 mb-2 flex flex-wrap gap-1"><Button variant="ghost" size="sm" asChild><Link to="/planejamento" search={{ visao: 'diario', data: search.data }}><ArrowLeft />Voltar ao cronograma</Link></Button><Button variant="ghost" size="sm" asChild><Link to="/planejamento/catalogos"><Package />Produtos e serviços</Link></Button><Button variant="ghost" size="sm" asChild><Link to="/planejamento/veiculos"><Truck />Veículos</Link></Button></div>
        <h1 className="text-2xl font-semibold">Programação de serviços</h1>
        <p className="text-sm text-text-secondary">Externa, Projetos especiais, Serralheria, Acabamento e montagem, Produção, Corte e Pintura</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" aria-label="Dia anterior" onClick={() => irPara(adicionarDias(search.data, -1))}><ChevronLeft /></Button>
        <Button variant="outline" size="sm" onClick={() => irPara(dados.hoje)}>Hoje</Button>
        <Input aria-label="Data da programação" type="date" className="h-9 w-40" value={search.data} onChange={e => e.target.value && irPara(e.target.value)} />
        <Button variant="outline" size="icon" aria-label="Próximo dia" onClick={() => irPara(adicionarDias(search.data, 1))}><ChevronRight /></Button>
      </div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="inline-flex rounded-lg border bg-surface-elevated p-1">
        {abas.map(([aba, label]) => <button key={aba} type="button" aria-pressed={search.aba === aba} onClick={() => navegar({ search: a => ({ ...a, aba }) })} className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${search.aba === aba ? 'bg-primary text-primary-foreground shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>{label}</button>)}
      </div>
      <h2 className="text-lg font-semibold">{tituloDoPeriodo(search.data, 'diario')}</h2>
    </div>
    {search.aba === 'lancamento' && <><AgendamentosDoDia dados={dados} data={search.data} /><LancamentoGrid dados={dados} data={search.data} /></>}
    {search.aba === 'resumo' && <ResumoDia dados={dados} data={search.data} />}
    {search.aba === 'pendencias' && <Pendencias dados={dados} />}
  </div>;
}
