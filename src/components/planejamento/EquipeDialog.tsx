import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, Truck, UsersRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { capacidadeNumerica, SETORES_SUGERIDOS, validarEquipe } from '@/lib/equipes';
import { abreviarNome } from '@/lib/nomes';
import type { getEquipesProducao } from '@/lib/equipes.functions';

type Dados = Awaited<ReturnType<typeof getEquipesProducao>>;
type Equipe = Dados['equipes'][number];
type Form = { nome: string; setor: string; capacidade_horas_dia: string; colaboradores: string[]; veiculos: string[]; ativo: boolean };

export function EquipeDialog({ dados, equipe, onClose }: { dados: Dados; equipe?: Equipe; onClose: () => void }) {
  const qc = useQueryClient();
  const [buscaPessoa, setBuscaPessoa] = useState('');
  const [f, setF] = useState<Form>(() => equipe ? {
    nome: equipe.nome,
    setor: equipe.setor,
    capacidade_horas_dia: String(equipe.capacidade_horas_dia),
    colaboradores: equipe.producao_equipe_colaboradores.map(item => item.producao_colaboradores.id),
    veiculos: equipe.producao_equipe_veiculos.map(item => item.producao_veiculos.id),
    ativo: equipe.ativo,
  } : { nome: '', setor: '', capacidade_horas_dia: '8', colaboradores: [], veiculos: [], ativo: true });
  const set = (parte: Partial<Form>) => setF(atual => ({ ...atual, ...parte }));
  const salvar = useMutation({
    mutationFn: async () => {
      const erro = validarEquipe(f);
      if (erro) throw new Error(erro);
      const resposta = await supabase.rpc('salvar_equipe_producao', {
        dados: { ...f, nome: f.nome.trim(), setor: f.setor.trim(), capacidade_horas_dia: capacidadeNumerica(f.capacidade_horas_dia) },
        ...(equipe ? { equipe_uuid: equipe.id } : {}),
      });
      if (resposta.error) throw new Error(resposta.error.message);
    },
    onSuccess: async () => {
      toast.success(equipe ? 'Equipe atualizada' : 'Equipe criada');
      await Promise.all([qc.invalidateQueries({ queryKey: ['equipes-producao'] }), qc.invalidateQueries({ queryKey: ['planejamento'] })]);
      onClose();
    },
    onError: erro => toast.error(erro.message),
  });
  const colaboradores = dados.colaboradores.filter(item => item.nome.toLowerCase().includes(buscaPessoa.trim().toLowerCase()));

  return <Dialog open onOpenChange={aberto => !aberto && !salvar.isPending && onClose()}>
    <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto bg-surface">
      <DialogHeader>
        <DialogTitle>{equipe ? 'Editar equipe' : 'Nova equipe'}</DialogTitle>
        <DialogDescription>Defina o setor, a capacidade diária e os recursos que poderão ser agendados.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="eq-nome">Nome da equipe</Label><Input id="eq-nome" value={f.nome} onChange={e => set({ nome: e.target.value })} placeholder="Ex.: Equipe Alfa" /></div>
        <div className="space-y-1.5"><Label htmlFor="eq-setor">Setor</Label><Input id="eq-setor" list="setores-equipe" value={f.setor} onChange={e => set({ setor: e.target.value })} placeholder="Ex.: Instalação" /><datalist id="setores-equipe">{SETORES_SUGERIDOS.map(setor => <option key={setor} value={setor} />)}</datalist></div>
        <div className="space-y-1.5"><Label htmlFor="eq-capacidade">Capacidade (horas por dia)</Label><Input id="eq-capacidade" type="number" min="0.5" step="0.5" value={f.capacidade_horas_dia} onChange={e => set({ capacidade_horas_dia: e.target.value })} /></div>
        <label className="flex items-center gap-2 self-end rounded-md border bg-surface-elevated px-3 py-2.5 text-sm"><input type="checkbox" className="size-4 accent-[hsl(var(--primary))]" checked={f.ativo} onChange={e => set({ ativo: e.target.checked })} />Equipe disponível para agendamento</label>
      </div>
      <section className="space-y-3 rounded-xl border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="flex items-center gap-2 text-sm font-semibold"><UsersRound className="size-4 text-primary" />Colaboradores</h3><p className="text-xs text-text-secondary">{f.colaboradores.length} selecionado(s)</p></div><Input aria-label="Buscar colaborador da equipe" className="h-9 max-w-56" placeholder="Buscar colaborador…" value={buscaPessoa} onChange={e => setBuscaPessoa(e.target.value)} /></div>
        <div className="grid max-h-44 gap-1 overflow-y-auto rounded-lg border bg-surface-elevated p-2 sm:grid-cols-2">{colaboradores.map(item => <label key={item.id} className="flex cursor-pointer items-start gap-2 rounded-md bg-surface p-2 text-sm"><input type="checkbox" className="mt-0.5 size-4 accent-[hsl(var(--primary))]" checked={f.colaboradores.includes(item.id)} onChange={e => set({ colaboradores: e.target.checked ? [...f.colaboradores, item.id] : f.colaboradores.filter(id => id !== item.id) })} /><span title={item.nome}>{abreviarNome(item.nome)}<span className="block text-xs text-text-secondary">{item.empresa}</span></span></label>)}</div>
      </section>
      <section className="space-y-3 rounded-xl border p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><Truck className="size-4 text-primary" />Veículos</h3>
        <div className="grid max-h-40 gap-1 overflow-y-auto rounded-lg border bg-surface-elevated p-2 sm:grid-cols-2">{dados.veiculos.map(item => <label key={item.id} className="flex cursor-pointer items-center gap-2 rounded-md bg-surface p-2 text-sm"><input type="checkbox" className="size-4 accent-[hsl(var(--primary))]" checked={f.veiculos.includes(item.id)} onChange={e => set({ veiculos: e.target.checked ? [...f.veiculos, item.id] : f.veiculos.filter(id => id !== item.id) })} /><span>{item.placa}<span className="block text-xs text-text-secondary">{item.modelo}</span></span></label>)}</div>
      </section>
      <DialogFooter className="gap-2"><Button type="button" variant="outline" onClick={onClose} disabled={salvar.isPending}>Cancelar</Button><Button type="button" onClick={() => salvar.mutate()} disabled={salvar.isPending}>{salvar.isPending ? <Loader2 className="animate-spin" /> : <Save />}Salvar equipe</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
