import { Link } from '@tanstack/react-router';
import { CalendarDays, Clock3, Truck, UsersRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ImagensButton, ImagensMiniaturas } from '@/components/planejamento/ImagensPlanejamento';
import { abreviarNome } from '@/lib/nomes';
import type { DadosProgramacao } from './recursos';

export function AgendamentosDoDia({ dados, data }: { dados: DadosProgramacao; data: string }) {
  const agendamentos = dados.agendamentos.filter(a => a.tipo !== 'Reserva de urgência');
  if (!agendamentos.length) return null;
  return <section className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="flex items-center gap-2 font-semibold"><CalendarDays className="size-4 text-primary" />Agendamentos também programados neste dia</h2><p className="text-xs text-text-secondary">Estes itens vêm do cronograma e aparecem aqui para não ficarem de fora da programação.</p></div><Button variant="outline" size="sm" asChild><Link to="/planejamento" search={{ visao: 'diario', data }}>Abrir cronograma</Link></Button></div>
    <div className="grid gap-3 lg:grid-cols-2">{agendamentos.map(a => {
      const nomes = a.planejamento_agendamento_equipe.map(e => e.producao_colaboradores.nome);
      return <article key={a.id} className="rounded-xl border bg-surface p-3 shadow-sm">
        <div className="flex items-start gap-2"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{a.titulo}</h3><Badge variant="outline">{a.tipo}</Badge></div>{a.ordens_producao?.cadastros?.nome && <p className="mt-1 text-xs text-text-secondary">{a.ordens_producao.cadastros.nome}</p>}</div><ImagensButton origem="agendamento" entidadeId={a.id} quantidade={a.planejamento_imagens.length} /></div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary"><span className="flex items-center gap-1"><Clock3 className="size-3.5" />{a.hora_inicio ? `${a.hora_inicio.slice(0, 5)}–${a.hora_fim?.slice(0, 5)}` : 'Dia inteiro'}</span><span title={nomes.join(', ')} className="flex items-center gap-1"><UsersRound className="size-3.5" />{a.producao_equipes?.nome ?? (nomes.map(abreviarNome).join(', ') || 'Sem equipe')}</span><span className="flex items-center gap-1"><Truck className="size-3.5" />{a.producao_veiculos?.placa ?? 'Sem veículo'}</span></div>
        <div className="mt-3"><ImagensMiniaturas imagens={a.planejamento_imagens} /></div>
      </article>;
    })}</div>
  </section>;
}
