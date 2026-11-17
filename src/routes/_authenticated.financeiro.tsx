import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Wallet, AlertTriangle, CalendarClock, Home, Zap, Plus, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { brl, dataBR } from '@/lib/vendas-calc';
import { situacaoConta, aluguelMensal, hojeISO, type Situacao } from '@/lib/financeiro';
import { pageMeta } from '@/lib/page-meta';

export const Route = createFileRoute('/_authenticated/financeiro')({
  head: () => pageMeta('Financeiro', 'Contas a receber, contratos de aluguel dos pontos e contratos de energia.'),
  component: FinanceiroPage,
});

const sel = 'h-10 rounded-md border bg-surface px-3 text-sm';
function useTabela<T>(key: string, fn: () => PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  return useQuery({ queryKey: ['financeiro', key], queryFn: async () => { const r = await fn(); if (r.error) throw new Error(r.error.message); return r.data ?? []; } });
}
function Kpi({ icon: Icon, label, value, tone = 'primary' }: { icon: typeof Wallet; label: string; value: string; tone?: 'primary' | 'danger' | 'warning' | 'success' }) {
  return <div className="flex items-center justify-between rounded-2xl border bg-surface p-5 shadow-sm">
    <div><p className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>
    <div className="flex size-10 items-center justify-center rounded-full" style={{ background: `hsl(var(--${tone}) / 0.12)`, color: `hsl(var(--${tone}))` }}><Icon className="size-5" /></div>
  </div>;
}
const TONE: Record<Situacao, string> = { Recebido: 'success', Cancelado: 'text-secondary', Vencido: 'danger', 'A vencer': 'warning' };
function Sit({ s }: { s: Situacao }) { return <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: `hsl(var(--${TONE[s]}) / 0.14)`, color: `hsl(var(--${TONE[s]}))` }}>{s}</span>; }
const Vazio = ({ cols, txt }: { cols: number; txt: string }) => <tr><td colSpan={cols} className="p-10 text-center text-text-secondary">{txt}</td></tr>;

function FinanceiroPage() {
  const hoje = hojeISO();
  const contas = useTabela('receber', () => supabase.from('contas_receber').select('id, descricao, vencimento, valor, status, recebido_em, cadastros(nome)').order('vencimento'));
  const aluguel = useTabela('aluguel', () => supabase.from('contratos_aluguel').select('*').order('vencimento', { nullsFirst: false }));
  const energia = useTabela('energia', () => supabase.from('contratos_energia').select('*').order('titular'));
  const k = useMemo(() => {
    const cs = (contas.data ?? []).map(c => ({ ...c, sit: situacaoConta(c.status, c.vencimento, hoje) }));
    const ativos = (aluguel.data ?? []).filter(a => a.ativo);
    const em30 = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    return {
      cs, aberto: cs.filter(c => c.sit === 'A vencer').reduce((s, c) => s + Number(c.valor), 0),
      vencido: cs.filter(c => c.sit === 'Vencido').reduce((s, c) => s + Number(c.valor), 0),
      aluguelMes: ativos.reduce((s, a) => s + aluguelMensal(Number(a.valor), a.periodicidade), 0),
      vencendo: ativos.filter(a => a.vencimento && a.vencimento >= hoje && a.vencimento <= em30).length,
    };
  }, [contas.data, aluguel.data, hoje]);

  return <div className="space-y-5 p-4 md:p-6">
    <div><h1 className="text-2xl font-semibold">Financeiro</h1><p className="text-sm text-text-secondary">Contas a receber, aluguel dos pontos e energia</p></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi icon={Wallet} label="A receber" value={brl(k.aberto)} />
      <Kpi icon={AlertTriangle} label="Vencido" value={brl(k.vencido)} tone="danger" />
      <Kpi icon={Home} label="Aluguel por mês" value={brl(k.aluguelMes)} tone="warning" />
      <Kpi icon={CalendarClock} label="Aluguéis vencendo em 30 dias" value={String(k.vencendo)} tone="success" />
    </div>
    <Tabs defaultValue="receber">
      <TabsList><TabsTrigger value="receber">Contas a receber</TabsTrigger><TabsTrigger value="aluguel">Aluguel</TabsTrigger><TabsTrigger value="energia">Energia</TabsTrigger></TabsList>
      <TabsContent value="receber"><Receber linhas={k.cs} loading={contas.isPending} /></TabsContent>
      <TabsContent value="aluguel"><Aluguel linhas={aluguel.data ?? []} loading={aluguel.isPending} hoje={hoje} /></TabsContent>
      <TabsContent value="energia"><Energia linhas={energia.data ?? []} loading={energia.isPending} /></TabsContent>
    </Tabs>
  </div>;
}

type Conta = { id: string; descricao: string; vencimento: string; valor: number; status: string; recebido_em: string | null; cadastros: { nome: string } | null; sit: Situacao };
function Receber({ linhas, loading }: { linhas: Conta[]; loading: boolean }) {
  const qc = useQueryClient(); const [filtro, setFiltro] = useState(''); const [novo, setNovo] = useState(false);
  const vis = linhas.filter(l => !filtro || l.sit === filtro);
  const receber = async (id: string) => {
    const r = await supabase.from('contas_receber').update({ status: 'Recebido', recebido_em: hojeISO() }).eq('id', id);
    if (r.error) { toast.error(r.error.message); return; }
    toast.success('Recebimento registrado'); qc.invalidateQueries({ queryKey: ['financeiro', 'receber'] });
  };
  return <div className="space-y-3 pt-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <select aria-label="Filtrar situação" className={sel} value={filtro} onChange={e => setFiltro(e.target.value)}><option value="">Todas as situações</option>{['A vencer', 'Vencido', 'Recebido', 'Cancelado'].map(s => <option key={s}>{s}</option>)}</select>
      <Button onClick={() => setNovo(true)}><Plus />Nova conta a receber</Button>
    </div>
    <div className="overflow-x-auto rounded-md border bg-surface"><table className="w-full text-left text-sm">
      <thead className="bg-surface-elevated"><tr><th className="p-3">Vencimento</th><th className="p-3">Descrição</th><th className="p-3">Cliente</th><th className="p-3">Situação</th><th className="p-3 text-right">Valor</th><th className="p-3" /></tr></thead>
      <tbody>{loading ? <Vazio cols={6} txt="Carregando…" /> : vis.map(c => <tr key={c.id} className="border-t">
        <td className="p-3">{dataBR(c.vencimento)}</td><td className="p-3">{c.descricao}</td><td className="p-3 text-text-secondary">{c.cadastros?.nome ?? '—'}</td>
        <td className="p-3"><Sit s={c.sit} />{c.recebido_em && <span className="ml-2 text-xs text-text-secondary">em {dataBR(c.recebido_em)}</span>}</td>
        <td className="p-3 text-right font-medium">{brl(Number(c.valor))}</td>
        <td className="p-3 text-right">{c.status === 'Aberto' && <Button size="sm" variant="outline" onClick={() => receber(c.id)}><Check />Receber</Button>}</td>
      </tr>)}{!loading && !vis.length && <Vazio cols={6} txt="Nenhuma conta a receber." />}</tbody>
    </table></div>
    <NovaConta open={novo} onClose={() => setNovo(false)} />
  </div>;
}

function NovaConta({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient(); const [f, setF] = useState({ descricao: '', vencimento: hojeISO(), valor: '', busca: '', cadastro_id: '' }); const [saving, setSaving] = useState(false);
  const clientes = useQuery({ queryKey: ['financeiro', 'clientes', f.busca], enabled: f.busca.trim().length >= 2 && !f.cadastro_id, queryFn: async () => (await supabase.from('cadastros').select('id, nome').ilike('nome', `%${f.busca.trim()}%`).limit(8)).data ?? [] });
  const salvar = async () => {
    const valor = Number(f.valor.replace(/\./g, '').replace(',', '.'));
    if (!f.descricao.trim() || !f.vencimento || !(valor > 0)) { toast.error('Preencha descrição, vencimento e um valor maior que zero.'); return; }
    setSaving(true);
    const r = await supabase.from('contas_receber').insert({ descricao: f.descricao.trim(), vencimento: f.vencimento, valor, cadastro_id: f.cadastro_id || null });
    setSaving(false);
    if (r.error) { toast.error(r.error.message); return; }
    toast.success('Conta criada'); qc.invalidateQueries({ queryKey: ['financeiro', 'receber'] }); setF({ descricao: '', vencimento: hojeISO(), valor: '', busca: '', cadastro_id: '' }); onClose();
  };
  return <Dialog open={open} onOpenChange={o => !o && onClose()}><DialogContent>
    <DialogHeader><DialogTitle>Nova conta a receber</DialogTitle></DialogHeader>
    <div className="space-y-3">
      <div className="relative space-y-1"><Label htmlFor="cr-cli">Cliente (opcional)</Label><Input id="cr-cli" value={f.busca} placeholder="Digite o nome do cliente…" onChange={e => setF({ ...f, busca: e.target.value, cadastro_id: '' })} />
        {!!clientes.data?.length && !f.cadastro_id && <div className="absolute z-10 mt-1 w-full rounded-md border bg-surface shadow-md">{clientes.data.map(c => <button key={c.id} type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-elevated" onClick={() => setF({ ...f, busca: c.nome, cadastro_id: c.id })}>{c.nome}</button>)}</div>}</div>
      <div className="space-y-1"><Label htmlFor="cr-desc">Descrição</Label><Input id="cr-desc" value={f.descricao} onChange={e => setF({ ...f, descricao: e.target.value })} placeholder="Ex.: Pedido 12 — parcela 1/3" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label htmlFor="cr-venc">Vencimento</Label><Input id="cr-venc" type="date" value={f.vencimento} onChange={e => setF({ ...f, vencimento: e.target.value })} /></div>
        <div className="space-y-1"><Label htmlFor="cr-valor">Valor (R$)</Label><Input id="cr-valor" inputMode="decimal" value={f.valor} onChange={e => setF({ ...f, valor: e.target.value })} placeholder="0,00" /></div>
      </div>
    </div>
    <DialogFooter><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={salvar} disabled={saving}>{saving && <Loader2 className="animate-spin" />}Salvar</Button></DialogFooter>
  </DialogContent></Dialog>;
}

type Al = { id: string; contrato: string | null; proprietario: string; midias: string | null; periodicidade: string | null; vigencia: string | null; vencimento: string | null; valor: number; ativo: boolean };
function Aluguel({ linhas, loading, hoje }: { linhas: Al[]; loading: boolean; hoje: string }) {
  const [busca, setBusca] = useState(''); const [ativos, setAtivos] = useState('ativos');
  const b = busca.trim().toLowerCase();
  const vis = linhas.filter(a => (ativos === 'todos' || a.ativo === (ativos === 'ativos')) && (!b || [a.proprietario, a.midias, a.contrato].some(x => x?.toLowerCase().includes(b))));
  return <div className="space-y-3 pt-3">
    <div className="grid gap-3 sm:grid-cols-3"><Input aria-label="Buscar aluguel" placeholder="Buscar proprietário, ponto ou contrato…" value={busca} onChange={e => setBusca(e.target.value)} className="sm:col-span-2" />
      <select aria-label="Situação do contrato" className={sel} value={ativos} onChange={e => setAtivos(e.target.value)}><option value="ativos">Ativos</option><option value="inativos">Inativos</option><option value="todos">Todos</option></select></div>
    <p className="text-sm text-text-secondary">{vis.length} contratos</p>
    <div className="overflow-x-auto rounded-md border bg-surface"><table className="w-full text-left text-sm">
      <thead className="bg-surface-elevated"><tr><th className="p-3">Contrato</th><th className="p-3">Proprietário</th><th className="p-3">Pontos</th><th className="p-3">Período</th><th className="p-3">Próx. vencimento</th><th className="p-3">Vigência até</th><th className="p-3 text-right">Valor</th></tr></thead>
      <tbody>{loading ? <Vazio cols={7} txt="Carregando…" /> : vis.map(a => <tr key={a.id} className="border-t">
        <td className="p-3 font-medium">{a.contrato ?? '—'}</td><td className="p-3">{a.proprietario}{!a.ativo && <Badge variant="outline" className="ml-2">Inativo</Badge>}</td>
        <td className="max-w-56 truncate p-3 text-text-secondary" title={a.midias ?? ''}>{a.midias ?? '—'}</td><td className="p-3">{a.periodicidade ?? '—'}</td>
        <td className="p-3">{a.vencimento ? <span style={a.ativo && a.vencimento < hoje ? { color: 'hsl(var(--danger))' } : undefined}>{dataBR(a.vencimento)}</span> : '—'}</td>
        <td className="p-3">{dataBR(a.vigencia) || '—'}</td><td className="p-3 text-right font-medium">{brl(Number(a.valor))}</td>
      </tr>)}{!loading && !vis.length && <Vazio cols={7} txt="Nenhum contrato encontrado." />}</tbody>
    </table></div>
  </div>;
}

type En = { id: string; num_cliente: string | null; num_instalacao: string | null; unidade: string | null; data_inicio: string | null; titular: string | null; local: string | null };
function Energia({ linhas, loading }: { linhas: En[]; loading: boolean }) {
  const [busca, setBusca] = useState(''); const b = busca.trim().toLowerCase();
  const vis = linhas.filter(e => !b || [e.local, e.titular, e.num_cliente, e.num_instalacao].some(x => x?.toLowerCase().includes(b)));
  return <div className="space-y-3 pt-3">
    <Input aria-label="Buscar energia" placeholder="Buscar endereço, titular ou número…" value={busca} onChange={e => setBusca(e.target.value)} />
    <p className="text-sm text-text-secondary">{vis.length} contratos de energia</p>
    <div className="overflow-x-auto rounded-md border bg-surface"><table className="w-full text-left text-sm">
      <thead className="bg-surface-elevated"><tr><th className="p-3"><Zap className="inline size-4" /> Nº cliente</th><th className="p-3">Instalação</th><th className="p-3">Titular</th><th className="p-3">Local</th><th className="p-3">Desde</th></tr></thead>
      <tbody>{loading ? <Vazio cols={5} txt="Carregando…" /> : vis.map(e => <tr key={e.id} className="border-t">
        <td className="p-3 font-medium">{e.num_cliente ?? '—'}</td><td className="p-3">{e.num_instalacao ?? '—'}</td><td className="p-3">{e.titular ?? '—'}</td><td className="p-3 text-text-secondary">{e.local ?? '—'}</td><td className="p-3">{dataBR(e.data_inicio) || '—'}</td>
      </tr>)}{!loading && !vis.length && <Vazio cols={5} txt="Nenhum contrato de energia." />}</tbody>
    </table></div>
  </div>;
}
