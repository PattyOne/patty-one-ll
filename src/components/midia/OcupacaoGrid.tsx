import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { bissemanasDoAno, bissemanaAtual, fmtDia, PROXIMO, type StatusOcupacao } from '@/lib/bissemanas';
import { calendarioOptions, ocupacaoOptions } from '@/lib/midia';
import { chave, criarMapaOcupacao } from '@/lib/ocupacao-filtros';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Linha = { id: string; nome: string; codigo?: string | null };
const COR: Record<StatusOcupacao, string> = {
  Livre: 'bg-success/15 text-success hover:bg-success/25',
  Reservado: 'bg-warning/20 text-warning hover:bg-warning/30',
  Ocupado: 'bg-danger/15 text-danger hover:bg-danger/25',
};

/** Grade ponto × bi-semana. Clique alterna Livre → Reservado → Ocupado → Livre. */
export function OcupacaoGrid({
  pontos,
  ano,
  destacarBissemana,
  onSelecionarBissemana,
}: {
  pontos: Linha[];
  ano: number;
  /** Coluna em destaque (bi-semana em uso pelo filtro). */
  destacarBissemana?: number;
  /** Quando informado, o cabeçalho vira botão para escolher a bi-semana. */
  onSelecionarBissemana?: (numero: number) => void;
}) {
  const qc = useQueryClient();
  const [cliente, setCliente] = useState('');
  const unico = pontos.length === 1 ? pontos[0]?.id : undefined;
  const { data = [] } = useQuery(ocupacaoOptions(ano, unico));
  const mapa = useMemo(() => criarMapaOcupacao(data), [data]);
  const { data: calendario } = useSuspenseQuery(calendarioOptions());
  const bis = bissemanasDoAno(ano, calendario);
  const atual = bissemanaAtual(new Date(), calendario);
  const ths = useRef<Record<number, HTMLTableCellElement | null>>({});

  // A coluna filtrada entra na tela sozinha: sem isso, a bi-semana escolhida fica fora do campo de visão.
  useEffect(() => {
    if (destacarBissemana != null) ths.current[destacarBissemana]?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [destacarBissemana, ano]);

  async function alternar(ponto_id: string, bissemana: number) {
    const cur = mapa.get(chave(ponto_id, bissemana));
    const prox = PROXIMO[(cur?.status as StatusOcupacao) ?? 'Livre'];
    const r = prox === 'Livre'
      ? await supabase.from('pontos_ocupacao').delete().eq('ponto_id', ponto_id).eq('ano', ano).eq('bissemana', bissemana)
      : await supabase.from('pontos_ocupacao').upsert({ ponto_id, ano, bissemana, status: prox, cliente: cliente.trim() || cur?.cliente || null }, { onConflict: 'ponto_id,ano,bissemana' });
    if (r.error) { toast.error(r.error.message); return; }
    qc.invalidateQueries({ queryKey: ['pontos_ocupacao', ano] });
  }

  return <div className="space-y-3">
    <div className="flex flex-wrap items-center gap-3 text-sm">
      {(['Livre', 'Reservado', 'Ocupado'] as const).map(s => <span key={s} className="flex items-center gap-1.5"><span className={`size-3 rounded ${COR[s]}`} />{s}</span>)}
      <Input aria-label="Cliente para marcação" placeholder="Cliente (opcional) ao reservar/ocupar" value={cliente} onChange={e => setCliente(e.target.value)} className="ml-auto h-9 max-w-xs" />
    </div>
    {!onSelecionarBissemana && <p className="text-xs text-text-secondary">Clique numa bi-semana para alternar: Livre → Reservado → Ocupado → Livre.</p>}
    <div className="overflow-x-auto rounded-md border bg-surface"><table className="text-xs"><thead className="bg-surface-elevated"><tr>
      <th className="sticky left-0 z-10 min-w-44 bg-surface-elevated p-2 text-left">Ponto</th>
      {bis.map(b => {
        const destacada = destacarBissemana === b.numero;
        const hoje = atual.ano === ano && atual.numero === b.numero;
        const conteudo = <>B{b.codigo_sige}<div className="font-normal text-text-secondary">{fmtDia(b.inicio)}–{fmtDia(b.fim)}</div></>;
        return <th key={b.numero} ref={el => { ths.current[b.numero] = el; }} className={`min-w-16 whitespace-nowrap p-1.5 text-center font-medium ${destacada ? 'bg-primary/10 text-primary' : hoje ? 'text-primary' : ''}`}>
          {onSelecionarBissemana
            ? <Button variant="ghost" type="button" aria-pressed={destacada} title={`Filtrar pela bi-semana ${b.codigo_sige}`} onClick={() => onSelecionarBissemana(b.numero)} className="h-auto w-full flex-col gap-0 rounded px-1 py-0.5">{conteudo}</Button>
            : conteudo}
        </th>;
      })}
    </tr></thead><tbody>
      {pontos.map(p => <tr key={p.id} className="border-t">
        <td className="sticky left-0 z-10 bg-surface p-2 font-medium">{p.codigo ? `${p.codigo} · ` : ''}{p.nome}</td>
        {bis.map(b => {
          const o = mapa.get(chave(p.id, b.numero));
          const s = (o?.status as StatusOcupacao) ?? 'Livre';
          const destacada = destacarBissemana === b.numero;
          return <td key={b.numero} className={`p-0.5 ${destacada ? 'bg-primary/5' : ''}`}><Button variant="ghost" type="button" onClick={() => alternar(p.id, b.numero)} title={`B${b.codigo_sige} · ${s}${o?.cliente ? ` · ${o.cliente}` : ''}`} aria-label={`${p.nome} bissemana ${b.codigo_sige}: ${s}`} className={`block h-9 w-16 truncate rounded px-1 text-[10px] font-medium ${COR[s]} ${destacada ? 'ring-1 ring-primary/40' : ''}`}>{s === 'Livre' ? '' : (o?.cliente || s)}</Button></td>;
        })}
      </tr>)}
      {!pontos.length && <tr><td colSpan={bis.length + 1} className="p-8 text-center text-text-secondary">Nenhum ponto com esse filtro.</td></tr>}
    </tbody></table></div>
  </div>;
}
