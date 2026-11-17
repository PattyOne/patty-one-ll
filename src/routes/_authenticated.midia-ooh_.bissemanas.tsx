import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ArrowLeft, FilterX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { calendarioOptions, ocupacaoOptions, pontosOptions } from '@/lib/midia';
import { bissemanasDoAno, bissemanaAtual, fmtDia, type StatusOcupacao } from '@/lib/bissemanas';
import {
  alternarStatusFiltro,
  contarPorStatus,
  criarMapaOcupacao,
  filtrarPontos,
  TODOS_STATUS,
} from '@/lib/ocupacao-filtros';
import { OcupacaoGrid } from '@/components/midia/OcupacaoGrid';
import { pageMeta } from '@/lib/page-meta';

export const Route = createFileRoute('/_authenticated/midia-ooh_/bissemanas')({
  loader: async ({ context }) => { await Promise.all([context.queryClient.ensureQueryData(pontosOptions()), context.queryClient.ensureQueryData(calendarioOptions())]); },
  head: () => pageMeta('Bi-semanas', 'Controle de ocupação dos pontos de mídia por bi-semana: filtre pontos livres, reservados ou ocupados em cada período.'),
  component: Page,
});

const CHIP: Record<StatusOcupacao, string> = {
  Livre: 'bg-success/15 text-success',
  Reservado: 'bg-warning/20 text-warning',
  Ocupado: 'bg-danger/15 text-danger',
};

function Page() {
  const { data: pontos } = useSuspenseQuery(pontosOptions());
  const { data: calendario } = useSuspenseQuery(calendarioOptions());
  const atual = bissemanaAtual(new Date(), calendario);
  const anos = [...new Set(calendario.map(b => b.ano))].sort((a, b) => a - b);
  const [ano, setAno] = useState(atual.numero ? atual.ano : anos[anos.length - 1] ?? atual.ano);
  const [busca, setBusca] = useState('');
  const [bis, setBis] = useState(atual.numero);
  const [statuses, setStatuses] = useState<StatusOcupacao[]>([]);

  const dias = useMemo(() => bissemanasDoAno(ano, calendario), [ano, calendario]);
  const bissemana = Math.max(1, Math.min(bis, dias.length));
  const periodo = dias[bissemana - 1];
  const { data: ocupacao = [] } = useQuery(ocupacaoOptions(ano));
  const mapa = useMemo(() => criarMapaOcupacao(ocupacao), [ocupacao]);

  const buscados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return pontos.filter(p => !q || [p.nome, p.codigo, p.cidade].some(v => v?.toLowerCase().includes(q)));
  }, [pontos, busca]);
  const contagem = useMemo(() => contarPorStatus(buscados, mapa, bissemana), [buscados, mapa, bissemana]);
  const lista = useMemo(() => filtrarPontos(buscados, mapa, bissemana, statuses), [buscados, mapa, bissemana, statuses]);
  const filtrando = statuses.length > 0;
  if (!periodo) return <div className="p-6">Calendário oficial indisponível para {ano}.</div>;
  const codigo = periodo.codigo_sige;

  return <div className="space-y-5 p-4 md:p-6">
    <div className="flex flex-wrap items-center gap-3">
      <Button asChild variant="ghost" size="icon" aria-label="Voltar"><Link to="/midia-ooh"><ArrowLeft /></Link></Button>
      <div><h1 className="text-2xl font-semibold">Bi-semanas</h1><p className="text-sm text-text-secondary">Ocupação de cada ponto por período de 14 dias.</p></div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="sm" aria-label="Ano anterior" disabled={!anos.includes(ano - 1)} onClick={() => setAno(a => a - 1)}>‹</Button>
        <span className="w-14 text-center font-semibold">{ano}</span>
        <Button variant="outline" size="sm" aria-label="Próximo ano" disabled={!anos.includes(ano + 1)} onClick={() => setAno(a => a + 1)}>›</Button>
      </div>
    </div>

    <div className="flex flex-wrap items-end gap-3">
      <Input aria-label="Buscar pontos" placeholder="Buscar por nome, código ou cidade…" value={busca} onChange={e => setBusca(e.target.value)} className="h-10 max-w-md" />
      <label className="flex items-center gap-2 text-sm text-text-secondary">Bi-semana
        <select aria-label="Filtrar por bi-semana" className="h-10 rounded-md border bg-surface px-3 text-sm text-text-primary" value={bissemana} onChange={e => setBis(Number(e.target.value))}>
          {dias.map(b => <option key={b.numero} value={b.numero}>B{b.codigo_sige} · {fmtDia(b.inicio)}–{fmtDia(b.fim)}</option>)}
        </select>
      </label>
    </div>

    <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-surface p-3">
      <span className="text-sm text-text-secondary">Situação na B{codigo}</span>
      <div role="group" aria-label="Filtrar por situação" className="flex flex-wrap items-center gap-2">
      {TODOS_STATUS.map(s => {
        const on = statuses.includes(s);
        return <Button variant="ghost" key={s} type="button" aria-pressed={on} onClick={() => setStatuses(v => alternarStatusFiltro(v, s))}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${on ? `border-transparent shadow-sm ${CHIP[s]}` : 'bg-surface text-text-secondary hover:bg-surface-elevated'}`}>
          <span className={`size-2.5 rounded-full ${CHIP[s]}`} />{s}<span className="font-semibold tabular-nums">{contagem[s]}</span>
        </Button>;
      })}
      </div>
      {filtrando && <Button variant="ghost" size="sm" onClick={() => setStatuses([])}><FilterX />Limpar</Button>}
      <span className="ml-auto text-sm text-text-secondary">
        {lista.length} de {buscados.length} pontos · B{codigo} ({fmtDia(periodo.inicio)}–{fmtDia(periodo.fim)})
      </span>
    </div>

    <p className="text-xs text-text-secondary">Clique no cabeçalho de uma bi-semana para filtrar por ela. Clique numa célula para alternar: Livre → Reservado → Ocupado → Livre.</p>
    <OcupacaoGrid pontos={lista} ano={ano} destacarBissemana={bissemana} onSelecionarBissemana={setBis} />
  </div>;
}
