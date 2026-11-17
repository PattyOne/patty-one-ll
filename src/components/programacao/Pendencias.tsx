import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { adicionarDias } from '@/lib/planejamento';
import { dataCurtaBR, detectarConflitos, diasEmAberto } from '@/lib/programacao';
import { buscarAlocacoesExistentes } from '@/lib/conflitos-programacao';
import { abreviarNome } from '@/lib/nomes';
import { alocacaoDaLinha, linhaDoServico, tomStatus, type DadosProgramacao, type ServicoSalvo } from './recursos';
import type { StatusProgramacao } from '@/lib/programacao';
import { ConfirmacaoConflitos } from './ConfirmacaoConflitos';

export function Pendencias({ dados }: { dados: DadosProgramacao }) {
  if (!dados.pendencias.length) return <div className="rounded-2xl border border-dashed bg-surface p-10 text-center text-sm text-text-secondary">Nenhuma pendência. Serviços marcados como “Não realizado” ou “Aguardando equipe” aparecem aqui automaticamente.</div>;
  return <div className="overflow-x-auto rounded-2xl border bg-surface shadow-sm">
    <table className="w-full min-w-[960px] text-sm">
      <thead className="bg-surface-elevated text-left text-xs uppercase text-text-secondary"><tr>{['Em aberto', 'Data', 'Setor', 'Cliente / serviço', 'Equipe', 'Status', 'Motivo', ''].map(h => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr></thead>
      <tbody className="divide-y">{dados.pendencias.map(p => {
        const dias = diasEmAberto(p.data, dados.hoje);
        return <tr key={p.id}>
          <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${dias >= 3 ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>{dias === 0 ? 'hoje' : `${dias} dia${dias === 1 ? '' : 's'}`}</span></td>
          <td className="px-3 py-2">{dataCurtaBR(p.data)}{p.reagendamentos > 0 && <span className="block text-[11px] text-text-secondary">reagendado {p.reagendamentos}x · orig. {dataCurtaBR(p.data_original)}</span>}</td>
          <td className="px-3 py-2">{p.setor}</td>
          <td className="px-3 py-2"><p className="font-medium">{p.cliente ?? p.cadastros?.nome ?? '—'}</p><p className="text-xs text-text-secondary">{[p.servico, p.produto, p.detalhamento].filter(Boolean).join(' · ')}</p></td>
          <td title={p.lider?.nome} className="px-3 py-2 text-xs">{p.producao_equipes?.nome ?? (p.lider?.nome ? abreviarNome(p.lider.nome) : '—')}</td>
          <td className="px-3 py-2"><span className={`rounded-md border px-2 py-0.5 text-xs ${tomStatus[p.status as StatusProgramacao]}`}>{p.status}</span></td>
          <td className="max-w-56 px-3 py-2 text-xs text-text-secondary">{p.observacao ?? '—'}</td>
          <td className="px-3 py-2"><Reagendar servico={p} dados={dados} /></td>
        </tr>;
      })}</tbody>
    </table>
  </div>;
}

type Destino = { data: string; equipe: string };

function Reagendar({ servico, dados }: { servico: ServicoSalvo; dados: DadosProgramacao }) {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const amanha = adicionarDias(dados.hoje, 1);
  const [data, setData] = useState(amanha);
  const [equipe, setEquipe] = useState(servico.equipe_id ?? '');
  const [verificando, setVerificando] = useState(false);
  const [confirmacao, setConfirmacao] = useState<{ destino: Destino; mensagens: string[] } | null>(null);

  function linhaNoDestino(destino: Destino, confirmado: boolean) {
    const linha = linhaDoServico(servico);
    const eq = dados.equipes.find(e => e.id === destino.equipe);
    const mudouEquipe = Boolean(eq && destino.equipe !== servico.equipe_id);
    return {
      ...linha,
      data: destino.data,
      status: 'Programado' as StatusProgramacao,
      conflito_confirmado: confirmado,
      ...(mudouEquipe && eq ? {
        equipe_id: eq.id,
        lider_id: eq.producao_equipe_colaboradores[0]?.colaborador_id ?? '',
        veiculo_id: eq.producao_equipe_veiculos[0]?.veiculo_id ?? '',
      } : {}),
    };
  }

  const m = useMutation({
    mutationFn: async ({ destino, confirmado }: { destino: Destino; confirmado: boolean }) => {
      const linha = linhaNoDestino(destino, confirmado);
      const r = await supabase.rpc('salvar_programacao_lote', {
        linhas: [{ ...linha, chave: undefined, posicao: servico.posicao, quantidade: linha.quantidade.replace(',', '.') }],
        excluir: [],
      });
      if (r.error) throw new Error(r.error.message);
    },
    onSuccess: (_, { destino }) => { toast.success(`Reagendado para ${dataCurtaBR(destino.data)}.`); setAberto(false); setConfirmacao(null); qc.invalidateQueries({ queryKey: ['programacao'] }); qc.invalidateQueries({ queryKey: ['planejamento'] }); },
    onError: e => toast.error(e.message),
  });

  async function solicitar(destino: Destino) {
    setVerificando(true);
    try {
      const linha = linhaNoDestino(destino, false);
      const atual = alocacaoDaLinha(linha);
      const externas = await buscarAlocacoesExistentes([destino.data], [servico.id]);
      const conflitos = detectarConflitos([atual, ...externas]).filter(c => c.alocacoes.includes(atual.id));
      const mensagens = [...new Set(conflitos.map(c => {
        const outro = externas.find(a => a.id === c.alocacoes.find(id => id !== atual.id));
        if (c.recurso === 'colaborador') {
          const nome = abreviarNome(dados.colaboradores.find(colab => colab.id === c.recursoId)?.nome ?? 'Colaborador');
          return `${nome} já está programado em outro serviço neste dia (${outro?.descricao ?? 'serviço não identificado'}). Confirmar que estará nos dois serviços?`;
        }
        return `O veículo selecionado também está em ${outro?.descricao ?? 'outro serviço'} neste dia. Confirmar o compartilhamento?`;
      }))];
      setAberto(false);
      if (mensagens.length) setConfirmacao({ destino, mensagens });
      else m.mutate({ destino, confirmado: false });
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : 'Não foi possível verificar os recursos.');
    } finally {
      setVerificando(false);
    }
  }

  const ocupado = m.isPending || verificando;
  return <div className="flex gap-1">
    <Button size="sm" variant="outline" disabled={ocupado} onClick={() => solicitar({ data: amanha, equipe: servico.equipe_id ?? '' })} title="Reagendar para amanhã com a mesma equipe">{ocupado ? <Loader2 className="animate-spin" /> : <CalendarClock />}Amanhã</Button>
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild><Button size="sm" variant="ghost" disabled={ocupado}>Outra data…</Button></PopoverTrigger>
      <PopoverContent className="w-64 space-y-2" align="end">
        <label className="block text-xs font-medium">Nova data<Input type="date" className="mt-1 h-8" value={data} onChange={e => setData(e.target.value)} /></label>
        <label className="block text-xs font-medium">Equipe<select className="mt-1 h-8 w-full rounded-md border bg-surface px-2 text-xs" value={equipe} onChange={e => setEquipe(e.target.value)}><option value="">Manter atual</option>{dados.equipes.map(eq => <option key={eq.id} value={eq.id}>{eq.nome} — {eq.setor}</option>)}</select></label>
        <Button size="sm" className="w-full" disabled={!data || ocupado} onClick={() => solicitar({ data, equipe })}>Reagendar</Button>
      </PopoverContent>
    </Popover>
    {confirmacao && <ConfirmacaoConflitos mensagens={confirmacao.mensagens} salvando={m.isPending} onConfirmar={() => m.mutate({ destino: confirmacao.destino, confirmado: true })} onCancelar={() => setConfirmacao(null)} />}
  </div>;
}
