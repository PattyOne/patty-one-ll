import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, ShieldAlert, Trash2, UsersRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { TIPOS_AGENDAMENTO, validarAgendamento, type TipoAgendamento } from '@/lib/planejamento';
import { ImagensPlanejamento } from './ImagensPlanejamento';
import type { getPlanejamento } from '@/lib/planejamento.functions';
import { rotuloVeiculo } from '@/lib/veiculos';
import { abreviarNome } from '@/lib/nomes';

type Dados = Awaited<ReturnType<typeof getPlanejamento>>;
type Agendamento = Dados['agendamentos'][number];
type Form = {
  titulo: string;
  tipo: TipoAgendamento;
  data_inicio: string;
  data_fim: string;
  hora_inicio: string;
  hora_fim: string;
  veiculo_id: string;
  ordem_id: string;
  equipe_id: string;
  equipe: string[];
  observacao: string;
};

const selecionar = 'h-10 w-full rounded-md border bg-surface px-3 text-sm';

export function AgendamentoDialog({ dados, agendamento, tipoInicial = 'Agendamento', dataInicial, onClose }: {
  dados: Dados;
  agendamento?: Agendamento;
  tipoInicial?: TipoAgendamento;
  dataInicial: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [buscaEquipe, setBuscaEquipe] = useState('');
  const [f, setF] = useState<Form>(() => agendamento ? {
    titulo: agendamento.titulo,
    tipo: agendamento.tipo as TipoAgendamento,
    data_inicio: agendamento.data_inicio,
    data_fim: agendamento.data_fim,
    hora_inicio: agendamento.hora_inicio?.slice(0, 5) ?? '',
    hora_fim: agendamento.hora_fim?.slice(0, 5) ?? '',
    veiculo_id: agendamento.veiculo_id ?? '',
    ordem_id: agendamento.ordem_id ?? '',
    equipe_id: agendamento.equipe_id ?? '',
    equipe: agendamento.planejamento_agendamento_equipe.map(item => item.colaborador_id),
    observacao: agendamento.observacao ?? '',
  } : {
    titulo: tipoInicial === 'Reserva de urgência' ? 'Reserva para urgências' : '',
    tipo: tipoInicial,
    data_inicio: dataInicial,
    data_fim: dataInicial,
    hora_inicio: '',
    hora_fim: '',
    veiculo_id: '',
    ordem_id: '',
    equipe_id: '',
    equipe: [],
    observacao: '',
  });
  const set = (parte: Partial<Form>) => setF(atual => ({ ...atual, ...parte }));

  const ordens = useMemo(() => {
    const lista = dados.ordens.map(ordem => ({
      id: ordem.id,
      numero: ordem.numero,
      descricao: ordem.descricao,
      cliente: ordem.cadastros?.nome ?? null,
      veiculo_id: ordem.veiculo_id,
      equipe: ordem.ordens_producao_equipe.map(item => item.producao_colaboradores.id),
    }));
    const vinculada = agendamento?.ordens_producao;
    if (vinculada && !lista.some(ordem => ordem.id === vinculada.id)) lista.push({
      id: vinculada.id,
      numero: vinculada.numero,
      descricao: vinculada.descricao,
      cliente: vinculada.cadastros?.nome ?? null,
      veiculo_id: agendamento.veiculo_id,
      equipe: [],
    });
    return lista;
  }, [dados.ordens, agendamento]);

  const salvar = useMutation({
    mutationFn: async () => {
      const erro = validarAgendamento(f);
      if (erro) throw new Error(erro);
      const resposta = await supabase.rpc('salvar_planejamento', {
        dados: { ...f, titulo: f.titulo.trim(), observacao: f.observacao.trim() },
        ...(agendamento ? { agendamento_uuid: agendamento.id } : {}),
      });
      if (resposta.error) throw new Error(resposta.error.message);
      return resposta.data;
    },
    onSuccess: async () => {
      toast.success(agendamento ? 'Agendamento atualizado' : f.tipo === 'Reserva de urgência' ? 'Reserva para urgências criada' : 'Agendamento criado');
      await qc.invalidateQueries({ queryKey: ['planejamento'] });
      onClose();
    },
    onError: erro => toast.error(erro.message),
  });

  const excluir = useMutation({
    mutationFn: async () => {
      if (!agendamento) return;
      const resposta = await supabase.rpc('excluir_planejamento', { agendamento_uuid: agendamento.id });
      if (resposta.error) throw new Error(resposta.error.message);
    },
    onSuccess: async () => {
      toast.success('Agendamento excluído');
      await qc.invalidateQueries({ queryKey: ['planejamento'] });
      onClose();
    },
    onError: erro => toast.error(erro.message),
  });

  function escolherOrdem(id: string) {
    const ordem = ordens.find(item => item.id === id);
    set({
      ordem_id: id,
      titulo: ordem && (!f.titulo.trim() || f.titulo === 'Reserva para urgências') ? `Ordem nº ${ordem.numero} — ${ordem.descricao}` : f.titulo,
      veiculo_id: ordem?.veiculo_id ?? f.veiculo_id,
      equipe: ordem?.equipe.length ? ordem.equipe : f.equipe,
    });
  }

  function escolherEquipe(id: string) {
    const equipe = dados.equipes.find(item => item.id === id);
    set({
      equipe_id: id,
      equipe: equipe ? equipe.producao_equipe_colaboradores.map(item => item.producao_colaboradores.id) : f.equipe,
      veiculo_id: equipe?.producao_equipe_veiculos[0]?.producao_veiculos.id ?? f.veiculo_id,
    });
  }

  function escolherVeiculo(id: string) {
    const veiculo = dados.veiculos.find(item => item.id === id);
    const equipe = veiculo?.equipe_id ? dados.equipes.find(item => item.id === veiculo.equipe_id) : undefined;
    set({
      veiculo_id: id,
      ...(equipe ? { equipe_id: equipe.id, equipe: equipe.producao_equipe_colaboradores.map(item => item.producao_colaboradores.id) } : {}),
    });
  }

  function escolherTipo(tipo: TipoAgendamento) {
    set({
      tipo,
      titulo: tipo === 'Reserva de urgência' && !f.titulo.trim() ? 'Reserva para urgências' : f.titulo,
      ordem_id: tipo === 'Reserva de urgência' ? '' : f.ordem_id,
    });
  }

  const colaboradores = dados.colaboradores.filter(colaborador => colaborador.nome.toLowerCase().includes(buscaEquipe.trim().toLowerCase()));
  const equipeSelecionada = dados.equipes.find(equipe => equipe.id === f.equipe_id);
  const veiculosDisponiveis = equipeSelecionada ? equipeSelecionada.producao_equipe_veiculos.map(item => item.producao_veiculos) : dados.veiculos;
  const ocupado = salvar.isPending || excluir.isPending;

  return <Dialog open onOpenChange={aberto => !aberto && !ocupado && onClose()}>
    <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto bg-surface">
      <DialogHeader>
        <DialogTitle>{agendamento ? 'Editar agendamento' : f.tipo === 'Reserva de urgência' ? 'Reservar capacidade para urgências' : 'Novo agendamento'}</DialogTitle>
        <DialogDescription>Organize a equipe e o veículo em um período. O sistema avisa se houver conflito.</DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="ag-titulo">Título</Label>
          <Input id="ag-titulo" value={f.titulo} onChange={evento => set({ titulo: evento.target.value })} placeholder="Ex.: Instalação no ponto B46" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ag-tipo">Categoria</Label>
          <select id="ag-tipo" className={selecionar} value={f.tipo} onChange={evento => escolherTipo(evento.target.value as TipoAgendamento)}>{TIPOS_AGENDAMENTO.map(tipo => <option key={tipo}>{tipo}</option>)}</select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ag-ordem">Ordem de produção (opcional)</Label>
          <select id="ag-ordem" className={selecionar} value={f.ordem_id} disabled={f.tipo === 'Reserva de urgência'} onChange={evento => escolherOrdem(evento.target.value)}>
            <option value="">Sem vínculo com ordem</option>
            {ordens.map(ordem => <option key={ordem.id} value={ordem.id}>Ordem nº {ordem.numero} — {ordem.cliente ?? ordem.descricao}</option>)}
          </select>
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="ag-equipe">Equipe cadastrada (opcional)</Label>
          <select id="ag-equipe" className={selecionar} value={f.equipe_id} onChange={evento => escolherEquipe(evento.target.value)}>
            <option value="">Montar recursos manualmente</option>
            {dados.equipes.map(equipe => <option key={equipe.id} value={equipe.id}>{equipe.nome} — {equipe.setor} · {Number(equipe.capacidade_horas_dia).toLocaleString('pt-BR')} h/dia</option>)}
          </select>
          {equipeSelecionada && <p className="text-xs text-text-secondary">Os colaboradores e veículos desta equipe foram preenchidos automaticamente.</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ag-inicio">Data inicial</Label>
          <Input id="ag-inicio" type="date" value={f.data_inicio} onChange={evento => set({ data_inicio: evento.target.value, data_fim: f.data_fim < evento.target.value ? evento.target.value : f.data_fim })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ag-fim">Data final</Label>
          <Input id="ag-fim" type="date" min={f.data_inicio} value={f.data_fim} onChange={evento => set({ data_fim: evento.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ag-hora-inicio">Hora inicial (opcional)</Label>
          <Input id="ag-hora-inicio" type="time" value={f.hora_inicio} onChange={evento => set({ hora_inicio: evento.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ag-hora-fim">Hora final (opcional)</Label>
          <Input id="ag-hora-fim" type="time" value={f.hora_fim} onChange={evento => set({ hora_fim: evento.target.value })} />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="ag-veiculo">Veículo</Label>
          <select id="ag-veiculo" className={selecionar} value={f.veiculo_id} onChange={evento => escolherVeiculo(evento.target.value)}>
            <option value="">Nenhum veículo</option>
            {veiculosDisponiveis.map(veiculo => <option key={veiculo.id} value={veiculo.id}>{rotuloVeiculo(veiculo)}</option>)}
          </select>
        </div>
      </div>

      {(f.tipo === 'Reserva de urgência' || f.tipo === 'Urgência') && <div className="flex gap-3 rounded-xl border border-warning/40 bg-warning/5 p-3 text-sm">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning" />
        <p className="text-text-secondary">{f.tipo === 'Reserva de urgência' ? 'Os recursos selecionados ficarão bloqueados para trabalhos comuns neste período.' : 'A urgência pode utilizar uma reserva existente, mas não poderá sobrepor outro trabalho agendado.'}</p>
      </div>}

      <section className="space-y-3 rounded-xl border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><h3 className="flex items-center gap-2 text-sm font-semibold"><UsersRound className="size-4 text-primary" />Equipe</h3><p className="text-xs text-text-secondary">{f.equipe.length} colaborador(es) selecionado(s)</p></div>
          <Input aria-label="Buscar colaborador" className="h-9 max-w-56" placeholder="Buscar colaborador…" value={buscaEquipe} onChange={evento => setBuscaEquipe(evento.target.value)} />
        </div>
        <div className="grid max-h-48 gap-1 overflow-y-auto rounded-lg border bg-surface-elevated p-2 sm:grid-cols-2">
          {colaboradores.map(colaborador => <label key={colaborador.id} className="flex cursor-pointer items-start gap-2 rounded-md bg-surface p-2 text-sm">
            <input type="checkbox" className="mt-0.5 size-4 accent-[hsl(var(--primary))]" checked={f.equipe.includes(colaborador.id)} disabled={Boolean(f.equipe_id)} onChange={evento => set({ equipe: evento.target.checked ? [...f.equipe, colaborador.id] : f.equipe.filter(id => id !== colaborador.id) })} />
            <span title={colaborador.nome}>{abreviarNome(colaborador.nome)}<span className="block text-xs text-text-secondary">{colaborador.empresa}</span></span>
          </label>)}
          {!colaboradores.length && <p className="col-span-full p-4 text-center text-sm text-text-secondary">Nenhum colaborador encontrado.</p>}
        </div>
      </section>

      {agendamento ? <ImagensPlanejamento origem="agendamento" entidadeId={agendamento.id} /> : <p className="rounded-xl border border-dashed p-3 text-sm text-text-secondary">Salve o agendamento para adicionar imagens.</p>}

      <div className="space-y-1.5">
        <Label htmlFor="ag-observacao">Observações</Label>
        <Textarea id="ag-observacao" rows={3} value={f.observacao} onChange={evento => set({ observacao: evento.target.value })} placeholder="Orientações, materiais ou contato…" />
      </div>

      <DialogFooter className="gap-2">
        {agendamento && <Button type="button" variant="destructive" className="mr-auto" disabled={ocupado} onClick={() => { if (window.confirm('Excluir este agendamento?')) excluir.mutate(); }}><Trash2 />Excluir</Button>}
        <Button type="button" variant="outline" onClick={onClose} disabled={ocupado}>Cancelar</Button>
        <Button type="button" onClick={() => salvar.mutate()} disabled={ocupado}>{salvar.isPending ? <Loader2 className="animate-spin" /> : <Save />}Salvar agendamento</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
