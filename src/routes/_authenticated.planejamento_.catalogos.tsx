import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Package, Pencil, Plus, Trash2, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CadastroError } from '@/components/CadastroErrors';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { catalogosProgramacaoOptions } from '@/lib/catalogos-programacao-queries';
import type { getCatalogosProgramacao } from '@/lib/catalogos-programacao.functions';
import { pageMeta } from '@/lib/page-meta';

export const Route = createFileRoute('/_authenticated/planejamento_/catalogos')({
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogosProgramacaoOptions()),
  head: () => pageMeta('Produtos e serviços', 'Catálogos selecionáveis na programação de serviços e nas ordens de produção.'),
  errorComponent: CadastroError,
  component: CatalogosPage,
});

type Dados = Awaited<ReturnType<typeof getCatalogosProgramacao>>;
type Produto = Dados['produtos'][number];
type Servico = Dados['servicos'][number];

function CatalogosPage() {
  const { data } = useSuspenseQuery(catalogosProgramacaoOptions());
  const { admin } = useAdmin();
  const [busca, setBusca] = useState('');
  const [produto, setProduto] = useState<Produto | 'novo' | null>(null);
  const [servico, setServico] = useState<Servico | 'novo' | null>(null);
  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  const produtos = useMemo(() => data.produtos.filter(p => !termo || p.nome.toLocaleLowerCase('pt-BR').includes(termo)), [data.produtos, termo]);
  const servicos = useMemo(() => data.servicos.filter(s => !termo || [s.nome, s.produto].some(v => v?.toLocaleLowerCase('pt-BR').includes(termo))), [data.servicos, termo]);

  return <div className="space-y-5 p-4 md:p-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><Button variant="ghost" size="sm" asChild className="-ml-2 mb-2"><Link to="/planejamento/programacao" search={{ data: new Date().toISOString().slice(0, 10), aba: 'lancamento' }}><ArrowLeft />Voltar à programação</Link></Button><h1 className="text-2xl font-semibold">Produtos e serviços</h1><p className="text-sm text-text-secondary">Cadastre aqui as opções que aparecem no lançamento da programação.</p></div>
      <div className="flex gap-2">{admin && <><Button variant="outline" onClick={() => setProduto('novo')}><Plus />Novo produto</Button><Button onClick={() => setServico('novo')}><Plus />Novo serviço</Button></>}</div>
    </div>
    {!admin && <p className="rounded-xl border bg-surface px-4 py-3 text-sm text-text-secondary">Você pode consultar as opções. Somente administradores podem incluir ou alterar os catálogos.</p>}
    <Input aria-label="Buscar produtos e serviços" placeholder="Buscar por nome ou produto…" value={busca} onChange={e => setBusca(e.target.value)} className="max-w-xl" />
    <div className="grid items-start gap-5 xl:grid-cols-2">
      <section className="overflow-hidden rounded-2xl border bg-surface shadow-sm"><div className="flex items-center justify-between border-b p-4"><div><h2 className="flex items-center gap-2 font-semibold"><Package className="size-4 text-primary" />Produtos</h2><p className="text-xs text-text-secondary">{data.produtos.filter(p => p.ativo).length} ativos · {data.produtos.length} no total</p></div>{admin && <Button size="sm" variant="ghost" onClick={() => setProduto('novo')}><Plus />Adicionar</Button>}</div><div className="max-h-[65vh] divide-y overflow-y-auto">{produtos.map(p => <div key={p.id} className="flex items-center gap-3 px-4 py-3"><div className="min-w-0 flex-1"><p className="font-medium">{p.nome}</p>{!p.ativo && <Badge variant="secondary" className="mt-1">Inativo</Badge>}</div>{admin && <Button variant="ghost" size="icon" aria-label={`Editar produto ${p.nome}`} onClick={() => setProduto(p)}><Pencil /></Button>}</div>)}{!produtos.length && <p className="p-8 text-center text-sm text-text-secondary">Nenhum produto encontrado.</p>}</div></section>
      <section className="overflow-hidden rounded-2xl border bg-surface shadow-sm"><div className="flex items-center justify-between border-b p-4"><div><h2 className="flex items-center gap-2 font-semibold"><Wrench className="size-4 text-primary" />Serviços</h2><p className="text-xs text-text-secondary">{data.servicos.filter(s => s.ativo).length} ativos · inclui os serviços importados do SIGE</p></div>{admin && <Button size="sm" variant="ghost" onClick={() => setServico('novo')}><Plus />Adicionar</Button>}</div><div className="max-h-[65vh] divide-y overflow-y-auto">{servicos.map(s => <div key={s.id} className="flex items-center gap-3 px-4 py-3"><div className="min-w-0 flex-1"><p className="font-medium">{s.nome}</p><p className="text-xs text-text-secondary">{s.produto || 'Sem produto associado'}{!s.ativo && ' · Inativo'}</p></div>{admin && <Button variant="ghost" size="icon" aria-label={`Editar serviço ${s.nome}`} onClick={() => setServico(s)}><Pencil /></Button>}</div>)}{!servicos.length && <p className="p-8 text-center text-sm text-text-secondary">Nenhum serviço encontrado.</p>}</div></section>
    </div>
    {produto && <ProdutoDialog {...(produto !== 'novo' ? { item: produto } : {})} onClose={() => setProduto(null)} />}
    {servico && <ServicoDialog {...(servico !== 'novo' ? { item: servico } : {})} produtos={data.produtos} onClose={() => setServico(null)} />}
  </div>;
}

function useAtualizarCatalogos() {
  const qc = useQueryClient();
  return async () => { await qc.invalidateQueries({ queryKey: ['catalogos-programacao'] }); await qc.invalidateQueries({ queryKey: ['programacao'] }); await qc.invalidateQueries({ queryKey: ['producao'] }); };
}

function BotaoExcluirCatalogo({ tipo, id, nome, onClose }: { tipo: 'produto' | 'servico'; id: string; nome: string; onClose: () => void }) {
  const atualizar = useAtualizarCatalogos();
  const excluir = useMutation({
    mutationFn: async () => {
      const r = await supabase.rpc('excluir_item_catalogo_programacao', { p_tipo: tipo, p_id: id });
      if (r.error) throw new Error(r.error.message);
      return r.data;
    },
    onSuccess: async resultado => {
      toast.success(resultado === 'desativado' ? 'O item já foi usado e foi desativado para preservar o histórico.' : 'Item excluído.');
      await atualizar(); onClose();
    },
    onError: e => toast.error(e.message),
  });
  return <Button type="button" variant="destructive" className="mr-auto" disabled={excluir.isPending} onClick={() => { if (window.confirm(`Excluir “${nome}”? Se o item já tiver sido usado, ele será apenas desativado e sairá das listas de seleção.`)) excluir.mutate(); }}>{excluir.isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}Excluir</Button>;
}

function ProdutoDialog({ item, onClose }: { item?: Produto; onClose: () => void }) {
  const [nome, setNome] = useState(item?.nome ?? '');
  const [ativo, setAtivo] = useState(item?.ativo ?? true);
  const atualizar = useAtualizarCatalogos();
  const salvar = useMutation({
    mutationFn: async () => {
      if (!nome.trim()) throw new Error('Informe o nome do produto.');
      const r = item ? await supabase.from('programacao_produtos').update({ nome: nome.trim(), ativo }).eq('id', item.id) : await supabase.from('programacao_produtos').insert({ nome: nome.trim(), ativo });
      if (r.error) throw new Error(r.error.message);
    },
    onSuccess: async () => { toast.success(item ? 'Produto atualizado.' : 'Produto cadastrado.'); await atualizar(); onClose(); },
    onError: e => toast.error(e.message),
  });
  return <Dialog open onOpenChange={v => !v && !salvar.isPending && onClose()}><DialogContent className="bg-surface"><DialogHeader><DialogTitle>{item ? 'Editar produto' : 'Novo produto'}</DialogTitle><DialogDescription>O produto ficará disponível para seleção na programação.</DialogDescription></DialogHeader><div className="space-y-2"><Label htmlFor="produto-nome">Nome do produto</Label><Input id="produto-nome" autoFocus value={nome} onChange={e => setNome(e.target.value)} /></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-[hsl(var(--primary))]" checked={ativo} onChange={e => setAtivo(e.target.checked)} />Ativo para novos lançamentos (desmarque para desativar)</label><DialogFooter>{item && <BotaoExcluirCatalogo tipo="produto" id={item.id} nome={item.nome} onClose={onClose} />}<Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>{salvar.isPending && <Loader2 className="animate-spin" />}Salvar</Button></DialogFooter></DialogContent></Dialog>;
}

function ServicoDialog({ item, produtos, onClose }: { item?: Servico; produtos: Produto[]; onClose: () => void }) {
  const [nome, setNome] = useState(item?.nome ?? '');
  const [produto, setProduto] = useState(item?.produto ?? '');
  const [ativo, setAtivo] = useState(item?.ativo ?? true);
  const atualizar = useAtualizarCatalogos();
  const salvar = useMutation({
    mutationFn: async () => {
      if (!nome.trim()) throw new Error('Informe o nome do serviço.');
      if (item) {
        const r = await supabase.from('producao_servicos').update({ nome: nome.trim(), produto: produto.trim() || null, ativo }).eq('id', item.id);
        if (r.error) throw new Error(r.error.message);
      } else {
        const r = await supabase.rpc('criar_servico_producao', { p_nome: nome.trim(), ...(produto.trim() ? { p_produto: produto.trim() } : {}) });
        if (r.error) throw new Error(r.error.message);
      }
    },
    onSuccess: async () => { toast.success(item ? 'Serviço atualizado.' : 'Serviço cadastrado.'); await atualizar(); onClose(); },
    onError: e => toast.error(e.message),
  });
  return <Dialog open onOpenChange={v => !v && !salvar.isPending && onClose()}><DialogContent className="bg-surface"><DialogHeader><DialogTitle>{item ? 'Editar serviço' : 'Novo serviço'}</DialogTitle><DialogDescription>O serviço ficará disponível na programação e nas ordens de produção.</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label htmlFor="servico-nome">Nome do serviço</Label><Input id="servico-nome" autoFocus value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex.: Aplicação de adesivo" /></div><div className="space-y-2"><Label htmlFor="servico-produto">Produto associado (opcional)</Label><Input id="servico-produto" list="catalogo-produtos" value={produto} onChange={e => setProduto(e.target.value)} /><datalist id="catalogo-produtos">{produtos.filter(p => p.ativo).map(p => <option key={p.id} value={p.nome} />)}</datalist></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-[hsl(var(--primary))]" checked={ativo} onChange={e => setAtivo(e.target.checked)} />Ativo para novos lançamentos (desmarque para desativar)</label></div><DialogFooter>{item && <BotaoExcluirCatalogo tipo="servico" id={item.id} nome={item.nome} onClose={onClose} />}<Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={() => salvar.mutate()} disabled={salvar.isPending}>{salvar.isPending && <Loader2 className="animate-spin" />}Salvar</Button></DialogFooter></DialogContent></Dialog>;
}
