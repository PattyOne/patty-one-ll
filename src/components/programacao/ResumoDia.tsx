import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Clock3, Copy, MapPin, MessageCircle, Truck, UsersRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { agruparResumo, detectarConflitos, idsComAlertaPendente, quantidadeServicosNoDia, STATUS_PROGRAMACAO, textoWhatsApp, type Conflito, type GrupoResumo, type StatusProgramacao } from '@/lib/programacao';
import { abreviarNome } from '@/lib/nomes';
import { alocacaoDaLinha, alocacoesDeAgendamentos, itemResumo, itemResumoAgendamento, linhaDoServico, tomStatus, type DadosProgramacao } from './recursos';
import { ImagensButton, ImagensMiniaturas } from '@/components/planejamento/ImagensPlanejamento';

async function copiar(texto: string) {
  try { await navigator.clipboard.writeText(texto); toast.success('Texto copiado. Cole no WhatsApp.'); }
  catch { toast.error('Não foi possível copiar automaticamente.'); }
}

function abrirWhatsApp(texto: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer');
}

export function ResumoDia({ dados, data }: { dados: DadosProgramacao; data: string }) {
  const qc = useQueryClient();
  const grupos = useMemo(() => agruparResumo([
    ...dados.itens.map(itemResumo),
    ...dados.agendamentos.filter(a => a.tipo !== 'Reserva de urgência').map(itemResumoAgendamento),
  ]), [dados.itens, dados.agendamentos]);
  const alocacoes = useMemo(() => [...dados.itens.map(s => alocacaoDaLinha(linhaDoServico(s))), ...alocacoesDeAgendamentos(dados.agendamentos)], [dados]);
  const conflitos = useMemo(() => detectarConflitos(alocacoes), [alocacoes]);
  const alertas = useMemo(() => idsComAlertaPendente(conflitos, alocacoes), [conflitos, alocacoes]);
  const total = grupos.reduce((t, g) => ({ p: t.p + g.programados, c: t.c + g.concluidos, x: t.x + g.pendentes }), { p: 0, c: 0, x: 0 });
  const textoDia = () => textoWhatsApp(data, grupos, window.location.origin);
  const status = useMutation({
    mutationFn: async ({ id, valor }: { id: string; valor: StatusProgramacao }) => {
      const r = await supabase.from('programacao_servicos').update({ status: valor }).eq('id', id);
      if (r.error) throw new Error(r.error.message);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['programacao'] }); qc.invalidateQueries({ queryKey: ['planejamento'] }); },
    onError: e => toast.error(e.message),
  });

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-surface p-4 shadow-sm">
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="flex items-center gap-1.5"><Clock3 className="size-4 text-primary" /><b>{total.p}</b> programados</span>
        <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-success" /><b>{total.c}</b> concluídos</span>
        <span className="flex items-center gap-1.5"><AlertTriangle className="size-4 text-danger" /><b>{total.x}</b> pendentes</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => copiar(textoDia())} disabled={!grupos.length}><Copy />Copiar dia completo</Button>
        <Button onClick={() => abrirWhatsApp(textoDia())} disabled={!grupos.length}><MessageCircle />Enviar programação do dia</Button>
      </div>
    </div>
    <p className="text-xs text-text-secondary">A mensagem completa reúne todos os setores, serviços e agendamentos, ordenados por equipe, veículo e horário, incluindo os links permanentes das imagens.</p>
    {!grupos.length && <div className="rounded-2xl border border-dashed bg-surface p-10 text-center text-sm text-text-secondary">Nenhum serviço salvo para este dia. Lance os serviços na aba “Lançamento rápido”.</div>}
    <div className="grid gap-4 xl:grid-cols-2">{grupos.map(g => <GrupoCard key={g.chave} grupo={g} data={data} alertas={alertas} conflitos={conflitos} onStatus={(id, valor) => status.mutate({ id, valor })} />)}</div>
  </div>;
}

function GrupoCard({ grupo: g, data, alertas, conflitos, onStatus }: { grupo: GrupoResumo; data: string; alertas: Set<string>; conflitos: Conflito[]; onStatus: (id: string, v: StatusProgramacao) => void }) {
  const textoEquipe = () => textoWhatsApp(data, [g], window.location.origin);
  const primeiro = g.itens[0];
  const tituloAbreviado = [primeiro?.equipeNome, primeiro?.liderNome ? abreviarNome(primeiro.liderNome) : null].filter(Boolean).join(' / ') || g.titulo;
  return <article className="rounded-2xl border bg-surface p-4 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 title={g.titulo} className="flex items-center gap-1.5 font-semibold"><UsersRound className="size-4 text-primary" />{tituloAbreviado}</h3>
        {g.ajudantes.length > 0 && <p title={g.ajudantes.join(', ')} className="mt-0.5 text-xs text-text-secondary">Ajudantes: {g.ajudantes.map(abreviarNome).join(', ')}</p>}
        <p className="mt-0.5 flex items-center gap-1 text-xs text-text-secondary"><Truck className="size-3.5" />{g.veiculo ?? 'Sem veículo'}</p>
      </div>
      <div className="flex gap-1.5"><Button variant="outline" size="sm" onClick={() => copiar(textoEquipe())}><Copy />Copiar</Button><Button variant="outline" size="sm" onClick={() => abrirWhatsApp(textoEquipe())}><MessageCircle />WhatsApp</Button></div>
    </div>
    <div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{g.programados} programado(s)</span><span className="rounded-full bg-success/10 px-2 py-0.5 text-success">{g.concluidos} concluído(s)</span><span className="rounded-full bg-danger/10 px-2 py-0.5 text-danger">{g.pendentes} pendente(s)</span></div>
    <ol className="mt-3 divide-y">{g.itens.map((it, i) => {
      const quantidadeNoDia = quantidadeServicosNoDia(it.id, conflitos);
      return <li key={it.id} className="flex items-start gap-3 py-3 text-sm">
        <span className="mt-0.5 w-5 text-xs text-text-secondary">{i + 1}.</span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="font-medium">{[it.cliente, [it.servico, it.produto].filter(Boolean).join(' ')].filter(Boolean).join(' — ')}{alertas.has(it.id) && <span className="ml-2 inline-flex items-center gap-1 rounded bg-warning/10 px-1.5 text-[11px] text-warning"><AlertTriangle className="size-3" />Recurso compartilhado</span>}{!alertas.has(it.id) && it.conflito_confirmado && quantidadeNoDia > 1 && <span className="ml-2 rounded bg-secondary px-1.5 py-0.5 text-[11px] text-secondary-foreground">{quantidadeNoDia} serviços no dia</span>}</p>
          <p className="text-xs text-text-secondary">{it.setor}{it.hora_inicio ? ` · ${it.hora_inicio.slice(0, 5)}` : ''}{it.detalhamento ? ` · ${it.detalhamento}` : ''}</p>
          {it.observacao && <p className="text-xs text-text-secondary">Observação: {it.observacao}</p>}
          {it.local && <p className="flex items-center gap-1 text-xs text-text-secondary"><MapPin className="size-3" />{it.local}</p>}
          <ImagensMiniaturas imagens={it.imagens ?? []} />
        </div>
        <div className="flex items-center gap-1"><ImagensButton origem={it.origem === 'agendamento' ? 'agendamento' : 'programacao'} entidadeId={it.origem === 'agendamento' ? it.id.slice(3) : it.id} quantidade={it.imagens?.length ?? 0} />{it.origem === 'agendamento' ? <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-xs text-primary">Agendamento</span> : <select aria-label="Status do serviço" className={`h-7 rounded-md border px-1.5 text-xs ${tomStatus[it.status]}`} value={it.status} onChange={e => onStatus(it.id, e.target.value as StatusProgramacao)}>{STATUS_PROGRAMACAO.map(s => <option key={s}>{s}</option>)}</select>}</div>
      </li>;
    })}</ol>
  </article>;
}
