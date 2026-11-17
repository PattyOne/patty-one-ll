import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CalendarDays, Copy, Loader2, Plus, Save, Trash2, UsersRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { detectarConflitos, idsComAlertaPendente, linhaVazia, novaChave, quantidadeServicosNoDia, SETORES_PROGRAMACAO, STATUS_PROGRAMACAO, validarLinha, type Alocacao, type Conflito, type LinhaProgramacao, type SetorProgramacao, type StatusProgramacao } from '@/lib/programacao';
import { buscarAlocacoesExistentes } from '@/lib/conflitos-programacao';
import { abreviarNome } from '@/lib/nomes';
import { ImagensButton, ImagensMiniaturas } from '@/components/planejamento/ImagensPlanejamento';
import { rotuloVeiculo } from '@/lib/veiculos';
import { alocacaoDaLinha, alocacoesDeAgendamentos, linhaDoServico, rotuloPonto, type DadosProgramacao } from './recursos';
import { ConfirmacaoConflitos } from './ConfirmacaoConflitos';

const campo = 'h-8 text-xs';
const sel = 'h-8 w-full rounded-md border bg-surface px-2 text-xs';
const CAMPOS_DE_RECURSO: (keyof LinhaProgramacao)[] = ['data', 'equipe_id', 'lider_id', 'ajudantes', 'veiculo_id', 'hora_inicio', 'hora_fim'];

type Confirmacao = { mensagens: string[]; ids: string[] };

function ClienteCell({ linha, onChange }: { linha: LinhaProgramacao; onChange: (p: Partial<LinhaProgramacao>) => void }) {
  const [opcoes, setOpcoes] = useState<{ id: string; nome: string }[]>([]);
  const [termo, setTermo] = useState('');
  useEffect(() => {
    const t = termo.trim();
    if (t.length < 2) return;
    const h = setTimeout(async () => {
      const r = await supabase.from('cadastros').select('id, nome').ilike('nome', `%${t.replace(/[%_]/g, '')}%`).order('nome').limit(15);
      if (!r.error) setOpcoes(r.data);
    }, 250);
    return () => clearTimeout(h);
  }, [termo]);
  const lista = `cli-${linha.chave}`;
  return <>
    <Input aria-label="Cliente" className={campo} list={lista} value={linha.cliente} placeholder="Buscar ou digitar"
      onChange={e => { const v = e.target.value; setTermo(v); const achado = opcoes.find(o => o.nome === v); onChange({ cliente: v, cadastro_id: achado?.id ?? '' }); }} />
    <datalist id={lista}>{opcoes.map(o => <option key={o.id} value={o.nome} />)}</datalist>
  </>;
}

function AjudantesCell({ linha, dados, onChange }: { linha: LinhaProgramacao; dados: DadosProgramacao; onChange: (p: Partial<LinhaProgramacao>) => void }) {
  const [busca, setBusca] = useState('');
  const selecionados = dados.colaboradores.filter(c => linha.ajudantes.includes(c.id));
  const nomesCompletos = selecionados.map(c => c.nome).join(', ');
  const lista = dados.colaboradores.filter(c => c.id !== linha.lider_id && c.nome.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR')));
  return <Popover>
    <PopoverTrigger asChild><Button variant="outline" size="sm" title={nomesCompletos || 'Selecionar ajudantes'} className="h-8 w-40 justify-start overflow-hidden px-2 text-xs font-normal"><UsersRound className="size-3.5" /><span className="truncate">{selecionados.length ? selecionados.map(c => abreviarNome(c.nome)).join(', ') : 'Selecionar'}</span></Button></PopoverTrigger>
    <PopoverContent className="w-64 p-2" align="start">
      <Input className="mb-2 h-8 text-xs" placeholder="Buscar colaborador…" value={busca} onChange={e => setBusca(e.target.value)} />
      <div className="max-h-60 space-y-1 overflow-y-auto">{lista.map(c => <label key={c.id} title={c.nome} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-surface-elevated">
        <Checkbox checked={linha.ajudantes.includes(c.id)} onCheckedChange={v => onChange({ ajudantes: v ? [...linha.ajudantes, c.id] : linha.ajudantes.filter(x => x !== c.id) })} />{abreviarNome(c.nome)}
      </label>)}</div>
    </PopoverContent>
  </Popover>;
}

export function LancamentoGrid({ dados, data }: { dados: DadosProgramacao; data: string }) {
  const qc = useQueryClient();
  const [linhas, setLinhas] = useState<LinhaProgramacao[]>(() => dados.itens.map(linhaDoServico));
  const [excluidos, setExcluidos] = useState<string[]>([]);
  const [setorFiltro, setSetorFiltro] = useState<'' | SetorProgramacao>('');
  const [sujo, setSujo] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [confirmacao, setConfirmacao] = useState<Confirmacao | null>(null);
  const [editorData, setEditorData] = useState<{ chave: string; data: string } | null>(null);

  // Recarrega do banco só quando não há edições pendentes (evita perder digitação em atualizações automáticas).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!sujo) { setLinhas(dados.itens.map(linhaDoServico)); setExcluidos([]); } }, [dados.itens]);

  const nomeColab = useMemo(() => new Map(dados.colaboradores.map(c => [c.id, c.nome])), [dados.colaboradores]);
  const nomeVeic = useMemo(() => new Map(dados.veiculos.map(v => [v.id, rotuloVeiculo(v)])), [dados.veiculos]);
  const pontoPorRotulo = useMemo(() => new Map(dados.pontos.map(p => [rotuloPonto(p), p])), [dados.pontos]);

  const alocacoesLocais = useMemo(() => [...linhas.map(alocacaoDaLinha), ...alocacoesDeAgendamentos(dados.agendamentos)], [linhas, dados.agendamentos]);
  const conflitosLocais = useMemo(() => detectarConflitos(alocacoesLocais), [alocacoesLocais]);
  const alertasPendentes = useMemo(() => idsComAlertaPendente(conflitosLocais, alocacoesLocais), [conflitosLocais, alocacoesLocais]);
  const conflitosPorLinha = useMemo(() => {
    const descr = new Map(alocacoesLocais.map(a => [a.id, a.descricao]));
    const mapa = new Map<string, string[]>();
    for (const c of conflitosLocais) {
      const recurso = c.recurso === 'veiculo' ? `Veículo ${nomeVeic.get(c.recursoId) ?? ''}` : abreviarNome(nomeColab.get(c.recursoId) ?? 'Colaborador');
      const [a, b] = c.alocacoes;
      for (const [x, y] of [[a, b], [b, a]] as const) {
        if (!alertasPendentes.has(x)) continue;
        mapa.set(x, [...(mapa.get(x) ?? []), `${recurso} também em ${descr.get(y)}`]);
      }
    }
    return mapa;
  }, [conflitosLocais, alocacoesLocais, alertasPendentes, nomeColab, nomeVeic]);

  function atualizar(chave: string, p: Partial<LinhaProgramacao>) {
    setSujo(true);
    const mudouRecurso = CAMPOS_DE_RECURSO.some(campo => campo in p);
    setLinhas(ls => ls.map(l => l.chave === chave ? { ...l, ...p, ...(mudouRecurso ? { conflito_confirmado: false } : {}) } : l));
  }
  function escolherEquipe(l: LinhaProgramacao, equipeId: string) {
    const eq = dados.equipes.find(e => e.id === equipeId);
    if (!eq) return atualizar(l.chave, { equipe_id: '' });
    const membros = eq.producao_equipe_colaboradores.map(m => m.colaborador_id);
    atualizar(l.chave, { equipe_id: equipeId, lider_id: membros[0] ?? '', ajudantes: membros.slice(1), veiculo_id: eq.producao_equipe_veiculos[0]?.veiculo_id ?? l.veiculo_id, setor: (SETORES_PROGRAMACAO as readonly string[]).includes(eq.setor) ? eq.setor as SetorProgramacao : l.setor });
  }
  function escolherVeiculo(l: LinhaProgramacao, veiculoId: string) {
    const veiculo = dados.veiculos.find(v => v.id === veiculoId);
    if (veiculo?.equipe_id) escolherEquipe(l, veiculo.equipe_id);
    atualizar(l.chave, { veiculo_id: veiculoId });
  }
  function adicionar() {
    setSujo(true);
    // Objeto novo e vazio: somente a data atualmente filtrada é preenchida.
    setLinhas(ls => [...ls, linhaVazia(data)]);
  }
  function duplicar(l: LinhaProgramacao) {
    setSujo(true);
    setLinhas(ls => { const i = ls.findIndex(x => x.chave === l.chave); const c = { ...l, ajudantes: [...l.ajudantes], chave: novaChave(), status: 'Programado' as StatusProgramacao, conflito_confirmado: false }; delete c.id; return [...ls.slice(0, i + 1), c, ...ls.slice(i + 1)]; });
  }
  function remover(l: LinhaProgramacao) {
    setSujo(true);
    if (l.id) setExcluidos(e => [...e, l.id!]);
    setLinhas(ls => ls.filter(x => x.chave !== l.chave));
  }

  const salvar = useMutation({
    mutationFn: async (paraSalvar: LinhaProgramacao[]) => {
      const payload = paraSalvar.map((l, i) => ({ ...l, chave: undefined, posicao: i + 1, quantidade: l.quantidade.replace(',', '.') }));
      const r = await supabase.rpc('salvar_programacao_lote', { linhas: payload, excluir: excluidos });
      if (r.error) throw new Error(r.error.message);
      return r.data;
    },
    onSuccess: async n => { toast.success(`Programação salva (${n} serviço${n === 1 ? '' : 's'}).`); setSujo(false); setExcluidos([]); setConfirmacao(null); await qc.invalidateQueries({ queryKey: ['programacao'] }); qc.invalidateQueries({ queryKey: ['planejamento'] }); },
    onError: e => toast.error(e.message),
  });

  function mensagensParaConfirmacao(conflitos: Conflito[], alocacoes: Alocacao[], idsLocais: Set<string>): Confirmacao {
    const porId = new Map(alocacoes.map(a => [a.id, a]));
    const mensagens = new Set<string>();
    const ids = new Set<string>();
    for (const c of conflitos) {
      const destinos = c.alocacoes.filter(id => idsLocais.has(id) && !porId.get(id)?.confirmado);
      if (!destinos.length) continue;
      destinos.forEach(id => ids.add(id));
      const destino = destinos[0]!;
      const outro = porId.get(c.alocacoes.find(id => id !== destino)!);
      if (c.recurso === 'colaborador') {
        const nome = abreviarNome(nomeColab.get(c.recursoId) ?? 'Colaborador');
        mensagens.add(`${nome} já está programado em outro serviço neste dia (${outro?.descricao ?? 'serviço não identificado'}). Confirmar que estará nos dois serviços?`);
      } else {
        mensagens.add(`O veículo ${nomeVeic.get(c.recursoId) ?? 'selecionado'} também está em ${outro?.descricao ?? 'outro serviço'} neste dia. Confirmar o compartilhamento?`);
      }
    }
    return { mensagens: [...mensagens], ids: [...ids] };
  }

  async function prepararSalvamento() {
    for (const [i, l] of linhas.entries()) {
      const erro = validarLinha(l);
      if (erro) { toast.error(`Linha ${i + 1}: ${erro}`); return; }
    }
    setVerificando(true);
    try {
      const idsLocais = new Set(linhas.map(l => l.chave));
      const externas = await buscarAlocacoesExistentes(linhas.map(l => l.data), [...linhas.flatMap(l => l.id ? [l.id] : []), ...excluidos]);
      const alocacoes = [...linhas.map(alocacaoDaLinha), ...externas];
      const conflitos = detectarConflitos(alocacoes);
      const pendente = mensagensParaConfirmacao(conflitos, alocacoes, idsLocais);
      if (pendente.mensagens.length) setConfirmacao(pendente);
      else salvar.mutate(linhas);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : 'Não foi possível verificar os recursos.');
    } finally {
      setVerificando(false);
    }
  }

  function confirmarESalvar() {
    if (!confirmacao) return;
    const ids = new Set(confirmacao.ids);
    const confirmadas = linhas.map(l => ids.has(l.chave) ? { ...l, conflito_confirmado: true } : l);
    setLinhas(confirmadas);
    setSujo(true);
    salvar.mutate(confirmadas);
  }

  const visiveis = linhas.filter(l => !setorFiltro || l.setor === setorFiltro);
  const totalAvisos = [...alertasPendentes].filter(k => linhas.some(l => l.chave === k)).length;
  const ocupado = salvar.isPending || verificando;

  return <section className="space-y-3 rounded-2xl border bg-surface p-4 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => setSetorFiltro('')} className={`rounded-full border px-3 py-1 text-xs font-medium ${!setorFiltro ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/50'}`}>Todos ({linhas.length})</button>
        {SETORES_PROGRAMACAO.map(s => <button type="button" key={s} onClick={() => setSetorFiltro(s)} className={`rounded-full border px-3 py-1 text-xs font-medium ${setorFiltro === s ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary/50'}`}>{s} ({linhas.filter(l => l.setor === s).length})</button>)}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={adicionar} disabled={ocupado}><Plus />Nova linha</Button>
        <Button onClick={prepararSalvamento} disabled={ocupado || !sujo}>{ocupado ? <Loader2 className="animate-spin" /> : <Save />}{verificando ? 'Verificando…' : 'Salvar programação'}</Button>
      </div>
    </div>
    {totalAvisos > 0 && <p className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning"><AlertTriangle className="size-4" />{totalAvisos} linha(s) com funcionário ou veículo em mais de um serviço neste dia. É apenas um aviso: confirme ao salvar para prosseguir.</p>}
    <datalist id="prog-produtos">{dados.produtos.map(p => <option key={p.id} value={p.nome} />)}</datalist>
    <datalist id="prog-servicos">{dados.servicos.map(s => <option key={s.id} value={s.nome} />)}</datalist>
    <datalist id="prog-pontos">{dados.pontos.map(p => <option key={p.id} value={rotuloPonto(p)}>{[p.endereco, p.cidade].filter(Boolean).join(', ')}</option>)}</datalist>
    <TooltipProvider>
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[2050px] text-xs">
        <thead className="bg-surface-elevated text-left text-[11px] uppercase tracking-wide text-text-secondary">
          <tr>{['#', 'Data', 'Setor', 'Cliente', 'Produto', 'Serviço', 'Detalhamento', 'Endereço / local', 'Qtd', 'Equipe', 'Líder', 'Ajudantes', 'Veículo', 'Horário', 'Status', 'Observação / motivo', 'Ordem de produção (opcional)', 'Imagens', ''].map(h => <th key={h} className="px-2 py-2 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y">
          {visiveis.map((l, i) => {
            const avisos = conflitosPorLinha.get(l.chave);
            const quantidadeNoDia = quantidadeServicosNoDia(l.chave, conflitosLocais);
            return <tr key={l.chave} className={avisos ? 'bg-warning/5' : ''}>
              <td className="px-2 py-1.5 text-text-secondary"><div className="flex items-center gap-1.5"><span>{i + 1}</span>{avisos && <Tooltip><TooltipTrigger asChild><span aria-label="Aviso de recurso compartilhado" className="inline-flex text-warning"><AlertTriangle className="size-4" /></span></TooltipTrigger><TooltipContent className="max-w-xs">{avisos.map((c, k) => <p key={k}>{c}</p>)}</TooltipContent></Tooltip>}{l.conflito_confirmado && quantidadeNoDia > 1 && <span className="whitespace-nowrap rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">{quantidadeNoDia} serviços no dia</span>}</div></td>
              <td className="min-w-32 px-1 py-1.5"><Input aria-label="Data do serviço" title="Alterar data" type="date" className={`${campo} px-1`} value={l.data} onChange={e => atualizar(l.chave, { data: e.target.value })} /></td>
              <td className="min-w-36 px-1 py-1.5"><select aria-label="Setor" className={sel} value={l.setor} onChange={e => atualizar(l.chave, { setor: e.target.value as SetorProgramacao })}><option value="">Selecione</option>{SETORES_PROGRAMACAO.map(s => <option key={s}>{s}</option>)}</select></td>
              <td className="min-w-44 px-1 py-1.5"><ClienteCell linha={l} onChange={p => atualizar(l.chave, p)} /></td>
              <td className="min-w-28 px-1 py-1.5"><Input aria-label="Produto" className={campo} list="prog-produtos" value={l.produto} onChange={e => atualizar(l.chave, { produto: e.target.value })} /></td>
              <td className="min-w-32 px-1 py-1.5"><Input aria-label="Serviço" className={campo} list="prog-servicos" value={l.servico} onChange={e => atualizar(l.chave, { servico: e.target.value })} /></td>
              <td className="min-w-52 px-1 py-1.5"><Input aria-label="Detalhamento" className={campo} value={l.detalhamento} onChange={e => atualizar(l.chave, { detalhamento: e.target.value })} /></td>
              <td className="min-w-52 px-1 py-1.5"><Input aria-label="Endereço ou local" className={campo} list="prog-pontos" placeholder="Ponto ou endereço" value={l.local} onChange={e => { const p = pontoPorRotulo.get(e.target.value); atualizar(l.chave, { local: e.target.value, ponto_id: p?.id ?? '' }); }} /></td>
              <td className="min-w-16 px-1 py-1.5"><Input aria-label="Quantidade" className={campo} inputMode="decimal" value={l.quantidade} onChange={e => atualizar(l.chave, { quantidade: e.target.value })} /></td>
              <td className="min-w-36 px-1 py-1.5"><select aria-label="Equipe" className={sel} value={l.equipe_id} onChange={e => escolherEquipe(l, e.target.value)}><option value="">—</option>{dados.equipes.map(eq => <option key={eq.id} value={eq.id}>{eq.nome}</option>)}</select></td>
              <td className="min-w-36 px-1 py-1.5"><select aria-label="Líder" title={nomeColab.get(l.lider_id) ?? 'Selecione o líder'} className={sel} value={l.lider_id} onChange={e => atualizar(l.chave, { lider_id: e.target.value, ajudantes: l.ajudantes.filter(a => a !== e.target.value) })}><option value="">—</option>{dados.colaboradores.map(c => <option key={c.id} value={c.id} title={c.nome}>{abreviarNome(c.nome)}</option>)}</select></td>
              <td className="min-w-40 px-1 py-1.5"><AjudantesCell linha={l} dados={dados} onChange={p => atualizar(l.chave, p)} /></td>
              <td className="min-w-28 px-1 py-1.5"><select aria-label="Veículo" className={sel} value={l.veiculo_id} onChange={e => escolherVeiculo(l, e.target.value)}><option value="">—</option>{dados.veiculos.map(v => <option key={v.id} value={v.id}>{rotuloVeiculo(v)}</option>)}</select></td>
              <td className="min-w-40 px-1 py-1.5"><div className="flex gap-1"><Input aria-label="Início" type="time" className={`${campo} px-1`} value={l.hora_inicio} onChange={e => atualizar(l.chave, { hora_inicio: e.target.value })} /><Input aria-label="Fim" type="time" className={`${campo} px-1`} value={l.hora_fim} onChange={e => atualizar(l.chave, { hora_fim: e.target.value })} /></div></td>
              <td className="min-w-36 px-1 py-1.5"><select aria-label="Status" className={sel} value={l.status} onChange={e => atualizar(l.chave, { status: e.target.value as StatusProgramacao })}>{STATUS_PROGRAMACAO.map(s => <option key={s}>{s}</option>)}</select></td>
              <td className="min-w-48 px-1 py-1.5"><Input aria-label="Observação" className={campo} value={l.observacao} onChange={e => atualizar(l.chave, { observacao: e.target.value })} /></td>
              <td className="min-w-40 px-1 py-1.5"><select aria-label="Ordem de produção" className={sel} value={l.ordem_id} onChange={e => atualizar(l.chave, { ordem_id: e.target.value })}><option value="">Sem vínculo</option>{dados.ordens.map(o => <option key={o.id} value={o.id}>nº {o.numero}</option>)}</select></td>
              <td className="min-w-32 px-1 py-1.5"><div className="flex items-center gap-2"><ImagensButton origem="programacao" entidadeId={l.id ?? ''} quantidade={dados.itens.find(s => s.id === l.id)?.planejamento_imagens.length ?? 0} disabled={!l.id} /><ImagensMiniaturas imagens={dados.itens.find(s => s.id === l.id)?.planejamento_imagens ?? []} /></div></td>
              <td className="px-1 py-1.5"><div className="flex"><Button variant="ghost" size="icon" className="size-8" aria-label="Alterar data" title="Alterar data" onClick={() => setEditorData({ chave: l.chave, data: l.data })}><CalendarDays /></Button><Button variant="ghost" size="icon" className="size-8" aria-label="Duplicar linha" onClick={() => duplicar(l)}><Copy /></Button><Button variant="ghost" size="icon" className="size-8 text-danger" aria-label="Remover linha" onClick={() => remover(l)}><Trash2 /></Button></div></td>
            </tr>;
          })}
          {!visiveis.length && <tr><td colSpan={19} className="p-8 text-center text-sm text-text-secondary">Nenhum serviço programado{setorFiltro ? ` em ${setorFiltro}` : ''} neste dia. Clique em “Nova linha” para começar.</td></tr>}
        </tbody>
      </table>
    </div>
    </TooltipProvider>
    <p className="text-xs text-text-secondary">“Nova linha” começa vazia e preenche somente a data selecionada. Funcionários e veículos podem participar de vários serviços no mesmo dia; o sistema apenas pede confirmação. “Ordem de produção” é um vínculo opcional. Salve a linha antes de anexar imagens.</p>

    {confirmacao && <ConfirmacaoConflitos mensagens={confirmacao.mensagens} salvando={salvar.isPending} onConfirmar={confirmarESalvar} onCancelar={() => setConfirmacao(null)} />}
    {editorData && <Dialog open onOpenChange={aberto => !aberto && setEditorData(null)}>
      <DialogContent className="max-w-md bg-surface">
        <DialogHeader><DialogTitle>Alterar data do serviço</DialogTitle><DialogDescription>O mesmo serviço será movido com funcionários, veículo, produto e demais vínculos. Os recursos serão verificados novamente ao salvar.</DialogDescription></DialogHeader>
        <label className="text-sm font-medium">Nova data<Input aria-label="Nova data do serviço" type="date" className="mt-2" value={editorData.data} onChange={e => setEditorData(atual => atual ? { ...atual, data: e.target.value } : null)} /></label>
        <DialogFooter><Button variant="outline" onClick={() => setEditorData(null)}>Cancelar</Button><Button disabled={!editorData.data} onClick={() => { atualizar(editorData.chave, { data: editorData.data }); setEditorData(null); }}>Alterar data</Button></DialogFooter>
      </DialogContent>
    </Dialog>}
  </section>;
}
