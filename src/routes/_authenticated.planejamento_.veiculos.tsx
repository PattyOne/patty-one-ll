import { createFileRoute, Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Pencil, Plus, Trash2, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CadastroError } from '@/components/CadastroErrors';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { veiculosPlanejamentoOptions } from '@/lib/veiculos-queries';
import type { getVeiculosPlanejamento } from '@/lib/veiculos.functions';
import { normalizarPlaca, rotuloVeiculo, validarVeiculo } from '@/lib/veiculos';
import { pageMeta } from '@/lib/page-meta';

export const Route = createFileRoute('/_authenticated/planejamento_/veiculos')({
  loader: ({ context }) => context.queryClient.ensureQueryData(veiculosPlanejamentoOptions()),
  head: () => pageMeta('Veículos do Planejamento', 'Cadastro de veículos, equipes padrão e disponibilidade para programação e agendamentos.'),
  errorComponent: CadastroError,
  component: VeiculosPage,
});

type Dados = Awaited<ReturnType<typeof getVeiculosPlanejamento>>;
type Veiculo = Dados['veiculos'][number];

function VeiculosPage() {
  const { data } = useSuspenseQuery(veiculosPlanejamentoOptions());
  const { admin } = useAdmin();
  const [busca, setBusca] = useState('');
  const [editor, setEditor] = useState<{ veiculo?: Veiculo } | null>(null);
  const veiculos = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    return data.veiculos.filter(v => !termo || [v.placa, v.modelo, v.marca, v.apelido, v.producao_equipes?.nome].some(valor => valor?.toLocaleLowerCase('pt-BR').includes(termo)));
  }, [data.veiculos, busca]);

  return <div className="space-y-5 p-4 md:p-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div><Button variant="ghost" size="sm" asChild className="-ml-2 mb-2"><Link to="/planejamento"><ArrowLeft />Voltar ao cronograma</Link></Button><h1 className="text-2xl font-semibold">Veículos</h1><p className="text-sm text-text-secondary">Cadastro usado nas listas da programação, dos agendamentos e das equipes.</p></div>
      {admin && <Button onClick={() => setEditor({})}><Plus />Novo veículo</Button>}
    </div>
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border bg-surface p-4 shadow-sm"><p className="text-xs uppercase text-text-secondary">Veículos ativos</p><p className="mt-1 text-2xl font-semibold">{data.veiculos.filter(v => v.status === 'ATIVO').length}</p></div>
      <div className="rounded-2xl border bg-surface p-4 shadow-sm"><p className="text-xs uppercase text-text-secondary">Com equipe padrão</p><p className="mt-1 text-2xl font-semibold">{data.veiculos.filter(v => v.equipe_id).length}</p></div>
      <div className="rounded-2xl border bg-surface p-4 shadow-sm"><p className="text-xs uppercase text-text-secondary">Total cadastrado</p><p className="mt-1 text-2xl font-semibold">{data.veiculos.length}</p></div>
    </div>
    <Input aria-label="Buscar veículos" placeholder="Buscar por placa, apelido, modelo ou equipe…" value={busca} onChange={e => setBusca(e.target.value)} className="max-w-xl" />
    {!admin && <p className="rounded-xl border bg-surface px-4 py-3 text-sm text-text-secondary">Somente administradores podem alterar o cadastro de veículos.</p>}
    <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{veiculos.map(veiculo => <article key={veiculo.id} className="rounded-2xl border bg-surface p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Truck /></span><div className="min-w-0"><h2 className="font-semibold">{veiculo.apelido || veiculo.modelo || 'Veículo'}</h2><p className="text-sm text-text-secondary">{veiculo.placa}{veiculo.modelo && veiculo.apelido ? ` · ${veiculo.modelo}` : ''}</p></div></div>{admin && <Button variant="ghost" size="icon" aria-label={`Editar veículo ${rotuloVeiculo(veiculo)}`} onClick={() => setEditor({ veiculo })}><Pencil /></Button>}</div>
      <div className="mt-4 flex flex-wrap gap-2"><Badge variant={veiculo.status === 'ATIVO' ? 'outline' : 'secondary'}>{veiculo.status === 'ATIVO' ? 'Ativo' : veiculo.status}</Badge>{veiculo.producao_equipes && <Badge variant="outline">Equipe: {veiculo.producao_equipes.nome}</Badge>}</div>
      {veiculo.observacao && <p className="mt-3 whitespace-pre-wrap text-sm text-text-secondary">{veiculo.observacao}</p>}
    </article>)}</div>
    {!veiculos.length && <p className="rounded-2xl border border-dashed bg-surface p-10 text-center text-sm text-text-secondary">Nenhum veículo encontrado.</p>}
    {editor && <VeiculoDialog key={editor.veiculo?.id ?? 'novo'} {...(editor.veiculo ? { veiculo: editor.veiculo } : {})} equipes={data.equipes} onClose={() => setEditor(null)} />}
  </div>;
}

function VeiculoDialog({ veiculo, equipes, onClose }: { veiculo?: Veiculo; equipes: Dados['equipes']; onClose: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({
    placa: veiculo?.placa ?? '', apelido: veiculo?.apelido ?? '', modelo: veiculo?.modelo ?? '', marca: veiculo?.marca ?? '',
    equipe_id: veiculo?.equipe_id ?? '', observacao: veiculo?.observacao ?? '', ativo: veiculo?.status === 'ATIVO' || !veiculo,
  });
  const set = (parte: Partial<typeof f>) => setF(atual => ({ ...atual, ...parte }));
  const atualizarListas = async () => {
    await Promise.all(['veiculos-planejamento', 'programacao', 'planejamento', 'equipes-producao'].map(chave => qc.invalidateQueries({ queryKey: [chave] })));
  };
  const salvar = useMutation({
    mutationFn: async () => {
      const erro = validarVeiculo(f);
      if (erro) throw new Error(erro);
      const dados = {
        placa: normalizarPlaca(f.placa), apelido: f.apelido.trim() || null, modelo: f.modelo.trim() || null, marca: f.marca.trim() || null,
        equipe_id: f.equipe_id || null, observacao: f.observacao.trim() || null, status: f.ativo ? 'ATIVO' : 'INATIVO',
      };
      const r = veiculo ? await supabase.from('producao_veiculos').update(dados).eq('id', veiculo.id) : await supabase.from('producao_veiculos').insert(dados);
      if (r.error) throw new Error(r.error.code === '23505' ? 'Já existe um veículo com esta placa.' : r.error.message);
    },
    onSuccess: async () => { toast.success(veiculo ? 'Veículo atualizado.' : 'Veículo cadastrado.'); await atualizarListas(); onClose(); },
    onError: e => toast.error(e.message),
  });
  const excluir = useMutation({
    mutationFn: async () => {
      if (!veiculo) return null;
      const r = await supabase.rpc('excluir_veiculo', { p_id: veiculo.id });
      if (r.error) throw new Error(r.error.message);
      return r.data;
    },
    onSuccess: async resultado => {
      toast.success(resultado === 'desativado' ? 'O veículo já possui histórico e foi desativado para preservar os lançamentos.' : 'Veículo excluído.');
      await atualizarListas(); onClose();
    },
    onError: e => toast.error(e.message),
  });
  const ocupado = salvar.isPending || excluir.isPending;

  return <Dialog open onOpenChange={aberto => !aberto && !ocupado && onClose()}><DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto bg-surface">
    <DialogHeader><DialogTitle>{veiculo ? 'Editar veículo' : 'Novo veículo'}</DialogTitle><DialogDescription>Desmarque “Ativo” para ocultar o veículo das novas programações sem apagar o histórico.</DialogDescription></DialogHeader>
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-1.5"><Label htmlFor="vei-placa">Placa *</Label><Input id="vei-placa" autoFocus value={f.placa} onChange={e => set({ placa: e.target.value })} placeholder="ABC1D23" /></div>
      <div className="space-y-1.5"><Label htmlFor="vei-apelido">Nome / apelido</Label><Input id="vei-apelido" value={f.apelido} onChange={e => set({ apelido: e.target.value })} placeholder="Ex.: Caminhão da externa" /></div>
      <div className="space-y-1.5"><Label htmlFor="vei-modelo">Modelo</Label><Input id="vei-modelo" value={f.modelo} onChange={e => set({ modelo: e.target.value })} /></div>
      <div className="space-y-1.5"><Label htmlFor="vei-marca">Marca</Label><Input id="vei-marca" value={f.marca} onChange={e => set({ marca: e.target.value })} /></div>
      <div className="space-y-1.5 md:col-span-2"><Label htmlFor="vei-equipe">Equipe padrão (opcional)</Label><select id="vei-equipe" className="h-10 w-full rounded-md border bg-surface px-3 text-sm" value={f.equipe_id} onChange={e => set({ equipe_id: e.target.value })}><option value="">Sem equipe padrão</option>{equipes.map(equipe => <option key={equipe.id} value={equipe.id}>{equipe.nome} — {equipe.setor}</option>)}</select><p className="text-xs text-text-secondary">Ao escolher este veículo, a equipe padrão será preenchida automaticamente.</p></div>
      <div className="space-y-1.5 md:col-span-2"><Label htmlFor="vei-observacao">Observações</Label><Textarea id="vei-observacao" rows={3} value={f.observacao} onChange={e => set({ observacao: e.target.value })} /></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-[hsl(var(--primary))]" checked={f.ativo} onChange={e => set({ ativo: e.target.checked })} />Ativo para novos lançamentos</label>
    </div>
    <DialogFooter className="gap-2">
      {veiculo && <Button type="button" variant="destructive" className="mr-auto" disabled={ocupado} onClick={() => { if (window.confirm(`Excluir ${rotuloVeiculo(veiculo)}? Se houver histórico, ele será apenas desativado.`)) excluir.mutate(); }}>{excluir.isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}Excluir</Button>}
      <Button type="button" variant="outline" onClick={onClose} disabled={ocupado}>Cancelar</Button>
      <Button type="button" onClick={() => salvar.mutate()} disabled={ocupado}>{salvar.isPending && <Loader2 className="animate-spin" />}Salvar veículo</Button>
    </DialogFooter>
  </DialogContent></Dialog>;
}
