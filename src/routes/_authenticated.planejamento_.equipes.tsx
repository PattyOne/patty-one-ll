import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock3, Pencil, Plus, Truck, UsersRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EquipeDialog } from '@/components/planejamento/EquipeDialog';
import { CadastroError } from '@/components/CadastroErrors';
import { useAdmin } from '@/hooks/useAdmin';
import { equipesProducaoOptions } from '@/lib/equipes-queries';
import type { getEquipesProducao } from '@/lib/equipes.functions';
import { pageMeta } from '@/lib/page-meta';
import { abreviarNome } from '@/lib/nomes';

export const Route = createFileRoute('/_authenticated/planejamento_/equipes')({
  loader: ({ context }) => context.queryClient.ensureQueryData(equipesProducaoOptions()),
  head: () => pageMeta('Equipes do Planejamento', 'Cadastro de equipes por setor, colaboradores, veículos e capacidade diária.'),
  errorComponent: CadastroError,
  component: EquipesPage,
});

type Dados = Awaited<ReturnType<typeof getEquipesProducao>>;
type Equipe = Dados['equipes'][number];

function EquipesPage() {
  const { data } = useSuspenseQuery(equipesProducaoOptions());
  const { admin } = useAdmin();
  const [busca, setBusca] = useState('');
  const [setor, setSetor] = useState('');
  const [editor, setEditor] = useState<{ equipe?: Equipe } | null>(null);
  const setores = useMemo(() => [...new Set(data.equipes.map(equipe => equipe.setor))].sort(), [data.equipes]);
  const equipes = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    return data.equipes.filter(equipe => (!setor || equipe.setor === setor) && (!termo || [equipe.nome, equipe.setor, ...equipe.producao_equipe_colaboradores.map(item => item.producao_colaboradores.nome), ...equipe.producao_equipe_veiculos.map(item => item.producao_veiculos.placa)].some(valor => valor.toLocaleLowerCase('pt-BR').includes(termo))));
  }, [data.equipes, busca, setor]);
  const ativas = data.equipes.filter(equipe => equipe.ativo);
  const capacidade = ativas.reduce((total, equipe) => total + Number(equipe.capacidade_horas_dia), 0);

  return <div className="space-y-5 p-4 md:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><Button variant="ghost" size="sm" asChild className="-ml-2 mb-2"><Link to="/planejamento"><ArrowLeft />Voltar ao cronograma</Link></Button><h1 className="text-2xl font-semibold">Equipes</h1><p className="text-sm text-text-secondary">Recursos por setor disponíveis no Planejamento</p></div>
      {admin && <Button onClick={() => setEditor({})}><Plus />Nova equipe</Button>}
    </div>
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border bg-surface p-4 shadow-sm"><p className="text-xs uppercase text-text-secondary">Equipes ativas</p><p className="mt-1 text-2xl font-semibold">{ativas.length}</p></div>
      <div className="rounded-2xl border bg-surface p-4 shadow-sm"><p className="text-xs uppercase text-text-secondary">Capacidade por dia</p><p className="mt-1 text-2xl font-semibold">{capacidade.toLocaleString('pt-BR')} h</p></div>
      <div className="rounded-2xl border bg-surface p-4 shadow-sm"><p className="text-xs uppercase text-text-secondary">Setores</p><p className="mt-1 text-2xl font-semibold">{new Set(ativas.map(equipe => equipe.setor)).size}</p></div>
    </div>
    <div className="grid gap-3 md:grid-cols-[1fr_240px]"><Input aria-label="Buscar equipes" placeholder="Buscar equipe, pessoa ou veículo…" value={busca} onChange={e => setBusca(e.target.value)} /><select aria-label="Filtrar setor" className="h-10 rounded-md border bg-surface px-3 text-sm" value={setor} onChange={e => setSetor(e.target.value)}><option value="">Todos os setores</option>{setores.map(item => <option key={item}>{item}</option>)}</select></div>
    {!equipes.length ? <div className="rounded-2xl border border-dashed bg-surface p-12 text-center"><UsersRound className="mx-auto mb-3 size-10 text-text-secondary opacity-50" /><h2 className="font-semibold">Nenhuma equipe encontrada</h2><p className="mt-1 text-sm text-text-secondary">{data.equipes.length ? 'Ajuste a busca ou o setor selecionado.' : admin ? 'Crie a primeira equipe para agilizar os agendamentos.' : 'Aguarde o administrador cadastrar as equipes.'}</p></div> : <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{equipes.map(equipe => <article key={equipe.id} className="rounded-2xl border bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{equipe.nome}</h2><Badge variant="outline">{equipe.setor}</Badge>{!equipe.ativo && <Badge variant="secondary">Inativa</Badge>}</div><p className="mt-2 flex items-center gap-1.5 text-sm text-text-secondary"><Clock3 className="size-4" />{Number(equipe.capacidade_horas_dia).toLocaleString('pt-BR')} horas por dia</p></div>{admin && <Button variant="outline" size="icon" aria-label={`Editar ${equipe.nome}`} onClick={() => setEditor({ equipe })}><Pencil /></Button>}</div>
      <div className="mt-4 space-y-3 border-t pt-4 text-sm"><div><p className="mb-2 flex items-center gap-1.5 font-medium"><UsersRound className="size-4 text-primary" />{equipe.producao_equipe_colaboradores.length} colaborador(es)</p><p title={equipe.producao_equipe_colaboradores.map(item => item.producao_colaboradores.nome).join(', ')} className="text-text-secondary">{equipe.producao_equipe_colaboradores.map(item => abreviarNome(item.producao_colaboradores.nome)).join(', ') || 'Nenhum colaborador'}</p></div><div><p className="mb-2 flex items-center gap-1.5 font-medium"><Truck className="size-4 text-primary" />{equipe.producao_equipe_veiculos.length} veículo(s)</p><p className="text-text-secondary">{equipe.producao_equipe_veiculos.map(item => `${item.producao_veiculos.placa} — ${item.producao_veiculos.modelo ?? ''}`).join(', ') || 'Nenhum veículo'}</p></div></div>
    </article>)}</div>}
    {editor && <EquipeDialog key={editor.equipe?.id ?? 'nova'} dados={data} {...(editor.equipe ? { equipe: editor.equipe } : {})} onClose={() => setEditor(null)} />}
  </div>;
}
