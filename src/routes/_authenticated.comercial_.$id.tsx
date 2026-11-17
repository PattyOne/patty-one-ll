import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useSuspenseQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Trash2, FileDown, ShoppingCart, Save, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { vendaOptions, empresasOptions } from '@/lib/vendas-queries';
import { totalItem, totaisVenda, brl, parseNum, CATEGORIAS, STATUS } from '@/lib/vendas-calc';
import { StatusBadge } from '@/components/VendaStatus';
import { CadastroError } from '@/components/CadastroErrors';
import { pageMeta } from '@/lib/page-meta';

const NOVOS = { 'nova-proposta': 'proposta', 'novo-pedido': 'pedido' } as const;
type Tipo = 'proposta' | 'pedido';
type Item = { categoria: string; descricao: string; ponto: string; periodo_inicio: string; periodo_fim: string; quantidade: string; valor_unitario: string; desconto: string };
type Cliente = { id: string; nome: string; cpf_cnpj: string | null; vendedor?: string | null };
type Form = { empresa_id: string; cliente: Cliente | null; vendedor: string; status: string; validade: string; condicoes_pagamento: string; observacao: string; desconto: string; itens: Item[] };

const novoItem = (): Item => ({ categoria: 'Mídia OOH', descricao: '', ponto: '', periodo_inicio: '', periodo_fim: '', quantidade: '1', valor_unitario: '', desconto: '' });
const fmt = (n: number | null | undefined) => n ? String(n).replace('.', ',') : '';

export const Route = createFileRoute('/_authenticated/comercial_/$id')({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(empresasOptions());
    if (!(params.id in NOVOS)) await context.queryClient.ensureQueryData(vendaOptions(params.id));
  },
  head: () => pageMeta('Proposta / Pedido', 'Edição de proposta comercial ou pedido de venda no PattyOne.'),
  errorComponent: CadastroError,
  component: VendaPage,
});

function VendaPage() {
  const { id } = Route.useParams();
  const novo = id in NOVOS;
  return novo ? <Editor key={id} tipo={NOVOS[id as keyof typeof NOVOS]} /> : <Existente id={id} />;
}
function Existente({ id }: { id: string }) {
  const { data } = useSuspenseQuery(vendaOptions(id));
  return <Editor key={id + data.venda.updated_at} tipo={data.venda.tipo as Tipo} doc={data} />;
}

function Editor({ tipo, doc }: { tipo: Tipo; doc?: Awaited<ReturnType<typeof import('@/lib/vendas.functions').getVenda>> }) {
  const { data: empresas } = useSuspenseQuery(empresasOptions());
  const v = doc?.venda; const navigate = useNavigate(); const qc = useQueryClient();
  const [f, setF] = useState<Form>(() => v ? {
    empresa_id: v.empresa_id, cliente: v.cadastros ? { id: v.cadastros.id, nome: v.cadastros.nome, cpf_cnpj: v.cadastros.cpf_cnpj } : null, vendedor: v.vendedor ?? '', status: v.status,
    validade: v.validade ?? '', condicoes_pagamento: v.condicoes_pagamento ?? '', observacao: v.observacao ?? '', desconto: fmt(v.desconto),
    itens: v.vendas_itens.map(i => ({ categoria: i.categoria, descricao: i.descricao, ponto: i.ponto ?? '', periodo_inicio: i.periodo_inicio ?? '', periodo_fim: i.periodo_fim ?? '', quantidade: fmt(i.quantidade) || '1', valor_unitario: fmt(i.valor_unitario), desconto: fmt(i.desconto) })),
  } : { empresa_id: '', cliente: null, vendedor: '', status: STATUS[tipo][0], validade: '', condicoes_pagamento: '', observacao: '', desconto: '', itens: [novoItem()] });
  const set = (p: Partial<Form>) => setF(c => ({ ...c, ...p }));
  const setItem = (i: number, p: Partial<Item>) => setF(c => ({ ...c, itens: c.itens.map((it, k) => k === i ? { ...it, ...p } : it) }));
  const calc = f.itens.map(i => ({ quantidade: parseNum(i.quantidade), valor_unitario: parseNum(i.valor_unitario), desconto: parseNum(i.desconto) }));
  const tot = totaisVenda(calc, parseNum(f.desconto));
  const nome = tipo === 'proposta' ? 'Proposta' : 'Pedido';

  const salvar = useMutation({
    mutationFn: async () => {
      if (!f.empresa_id) throw new Error('Escolha a empresa do grupo');
      if (!f.cliente) throw new Error('Escolha o cliente');
      if (f.itens.some(i => !i.descricao.trim())) throw new Error('Todos os itens precisam de descrição');
      const dados = { tipo, empresa_id: f.empresa_id, cadastro_id: f.cliente.id, vendedor: f.vendedor, status: f.status, validade: f.validade, condicoes_pagamento: f.condicoes_pagamento, observacao: f.observacao, desconto: parseNum(f.desconto),
        itens: f.itens.map((i, k) => ({ ...i, ...calc[k]! })) };
      const r = await supabase.rpc('salvar_venda', { dados, ...(v ? { venda_uuid: v.id } : {}) });
      if (r.error) throw new Error(r.error.message);
      return r.data;
    },
    onSuccess: async novoId => { toast.success(`${nome} salv${tipo === 'proposta' ? 'a' : 'o'}`); await qc.invalidateQueries({ queryKey: ['vendas'] }); if (!v) navigate({ to: '/comercial/$id', params: { id: novoId }, replace: true }); },
    onError: e => toast.error(e.message),
  });
  const converter = useMutation({
    mutationFn: async () => { const r = await supabase.rpc('converter_proposta', { proposta_uuid: v!.id }); if (r.error) throw new Error(r.error.message); return r.data; },
    onSuccess: async pid => { toast.success('Pedido criado a partir da proposta'); await qc.invalidateQueries({ queryKey: ['vendas'] }); navigate({ to: '/comercial/$id', params: { id: pid } }); },
    onError: e => toast.error(e.message),
  });
  const pdf = useMutation({ mutationFn: async () => { const { gerarPdfVenda } = await import('@/lib/proposta-pdf'); await gerarPdfVenda(v as never); }, onError: () => toast.error('Não foi possível gerar o PDF') });

  return <div className="space-y-5 p-4 md:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild aria-label="Voltar"><Link to="/comercial" search={{ tipo, busca: '', status: '', pagina: 1 }}><ArrowLeft /></Link></Button>
        <div><h1 className="text-2xl font-semibold">{v ? `${nome} nº ${v.numero}` : `Nov${tipo === 'proposta' ? 'a proposta' : 'o pedido'}`}</h1>
          <div className="flex items-center gap-2 text-sm text-text-secondary">{v && <StatusBadge status={v.status} />}
            {doc?.propostaOrigem && <Link to="/comercial/$id" params={{ id: doc.propostaOrigem.id }} className="text-primary hover:underline">Gerado da proposta nº {doc.propostaOrigem.numero}</Link>}
            {doc?.pedidoGerado && <Link to="/comercial/$id" params={{ id: doc.pedidoGerado.id }} className="text-primary hover:underline">Virou o pedido nº {doc.pedidoGerado.numero}</Link>}</div></div>
      </div>
      <div className="flex flex-wrap gap-2">
        {v && <Button variant="outline" onClick={() => pdf.mutate()} disabled={pdf.isPending}><FileDown />Baixar PDF</Button>}
        {v && tipo === 'proposta' && !doc?.pedidoGerado && v.status !== 'Recusada' && <Button variant="outline" onClick={() => { if (confirm('Aprovar esta proposta e criar o pedido de venda?')) converter.mutate(); }} disabled={converter.isPending}><ShoppingCart />Gerar pedido</Button>}
        <Button onClick={() => salvar.mutate()} disabled={salvar.isPending}><Save />Salvar</Button>
      </div>
    </div>

    <section className="grid gap-4 rounded-2xl border bg-surface p-5 shadow-sm md:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1.5 lg:col-span-2"><Label htmlFor="empresa">Empresa do grupo</Label>
        <select id="empresa" className="h-10 w-full rounded-md border bg-surface px-3 text-sm" value={f.empresa_id} onChange={e => set({ empresa_id: e.target.value })}><option value="">Escolha…</option>{empresas.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}</select></div>
      <div className="space-y-1.5 lg:col-span-2"><Label>Cliente</Label><ClientePicker value={f.cliente} onChange={c => set({ cliente: c, ...(c?.vendedor && !f.vendedor ? { vendedor: c.vendedor } : {}) })} /></div>
      <div className="space-y-1.5"><Label htmlFor="vendedor">Vendedor</Label><Input id="vendedor" value={f.vendedor} onChange={e => set({ vendedor: e.target.value })} /></div>
      <div className="space-y-1.5"><Label htmlFor="status">Situação</Label><select id="status" className="h-10 w-full rounded-md border bg-surface px-3 text-sm" value={f.status} onChange={e => set({ status: e.target.value })}>{STATUS[tipo].map(s => <option key={s}>{s}</option>)}</select></div>
      {tipo === 'proposta' && <div className="space-y-1.5"><Label htmlFor="validade">Validade</Label><Input id="validade" type="date" value={f.validade} onChange={e => set({ validade: e.target.value })} /></div>}
      <div className="space-y-1.5"><Label htmlFor="cond">Condições de pagamento</Label><Input id="cond" placeholder="Ex.: 30/60/90 dias" value={f.condicoes_pagamento} onChange={e => set({ condicoes_pagamento: e.target.value })} /></div>
    </section>

    <section className="space-y-3 rounded-2xl border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between"><h2 className="font-semibold">Itens</h2><Button variant="outline" size="sm" onClick={() => set({ itens: [...f.itens, novoItem()] })}><Plus />Adicionar item</Button></div>
      {f.itens.map((it, i) => <div key={i} className="grid gap-3 rounded-xl border bg-surface-elevated p-3 md:grid-cols-12">
        <select aria-label={`Tipo do item ${i + 1}`} className="h-10 rounded-md border bg-surface px-2 text-sm md:col-span-2" value={it.categoria} onChange={e => setItem(i, { categoria: e.target.value })}>{CATEGORIAS.map(c => <option key={c}>{c}</option>)}</select>
        <Input aria-label={`Descrição do item ${i + 1}`} placeholder="Descrição" className="md:col-span-4" value={it.descricao} onChange={e => setItem(i, { descricao: e.target.value })} />
        <Input aria-label={`Quantidade do item ${i + 1}`} placeholder="Qtd." inputMode="decimal" className="md:col-span-1" value={it.quantidade} onChange={e => setItem(i, { quantidade: e.target.value })} />
        <Input aria-label={`Valor unitário do item ${i + 1}`} placeholder="Valor unit." inputMode="decimal" className="md:col-span-2" value={it.valor_unitario} onChange={e => setItem(i, { valor_unitario: e.target.value })} />
        <Input aria-label={`Desconto do item ${i + 1}`} placeholder="Desconto R$" inputMode="decimal" className="md:col-span-1" value={it.desconto} onChange={e => setItem(i, { desconto: e.target.value })} />
        <div className="flex items-center justify-end gap-2 md:col-span-2"><span className="text-sm font-medium">{brl(totalItem(calc[i]!))}</span><Button variant="ghost" size="icon" aria-label={`Remover item ${i + 1}`} disabled={f.itens.length === 1} onClick={() => set({ itens: f.itens.filter((_, k) => k !== i) })}><Trash2 /></Button></div>
        {it.categoria === 'Mídia OOH' && <>
          <Input aria-label={`Ponto do item ${i + 1}`} placeholder="Ponto (ex.: Outdoor 9x3 — Av. Brasil, 1200)" className="md:col-span-6" value={it.ponto} onChange={e => setItem(i, { ponto: e.target.value })} />
          <label className="flex items-center gap-2 text-sm md:col-span-3">De<Input type="date" aria-label={`Início do período do item ${i + 1}`} value={it.periodo_inicio} onChange={e => setItem(i, { periodo_inicio: e.target.value })} /></label>
          <label className="flex items-center gap-2 text-sm md:col-span-3">até<Input type="date" aria-label={`Fim do período do item ${i + 1}`} value={it.periodo_fim} onChange={e => setItem(i, { periodo_fim: e.target.value })} /></label>
        </>}
      </div>)}
      <div className="ml-auto max-w-xs space-y-1.5 pt-2 text-sm">
        <div className="flex justify-between"><span className="text-text-secondary">Subtotal</span><span>{brl(tot.subtotal)}</span></div>
        <div className="flex items-center justify-between gap-3"><Label htmlFor="desc" className="font-normal text-text-secondary">Desconto no total (R$)</Label><Input id="desc" inputMode="decimal" className="h-8 w-28 text-right" value={f.desconto} onChange={e => set({ desconto: e.target.value })} /></div>
        <div className="flex justify-between border-t pt-2 text-base font-semibold"><span>Total</span><span>{brl(tot.total)}</span></div>
      </div>
    </section>

    <section className="space-y-1.5 rounded-2xl border bg-surface p-5 shadow-sm"><Label htmlFor="obs">Observações</Label><Textarea id="obs" rows={3} value={f.observacao} onChange={e => set({ observacao: e.target.value })} /></section>
  </div>;
}

function ClientePicker({ value, onChange }: { value: Cliente | null; onChange: (c: Cliente | null) => void }) {
  const [busca, setBusca] = useState(''); const [q, setQ] = useState('');
  useEffect(() => { const t = setTimeout(() => setQ(busca.trim()), 300); return () => clearTimeout(t); }, [busca]);
  const r = useQuery({ queryKey: ['clientes-busca', q], enabled: q.length >= 2, queryFn: async () => {
    const res = await supabase.rpc('listar_cadastros', { filtros: { busca: q, vendedor: '', estado: '', tipo: '', sem_vendedor: false }, pagina: 1 });
    if (res.error) throw new Error(res.error.message);
    return (res.data as unknown as { linhas: Cliente[] }).linhas.slice(0, 8);
  } });
  if (value) return <div className="flex h-10 items-center justify-between rounded-md border bg-surface px-3 text-sm"><span className="truncate">{value.nome}{value.cpf_cnpj && <span className="ml-2 text-text-secondary">{value.cpf_cnpj}</span>}</span><button className="text-primary hover:underline" onClick={() => onChange(null)}>Trocar</button></div>;
  return <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 size-4 text-text-secondary" /><Input aria-label="Buscar cliente" className="pl-9" placeholder="Buscar por nome ou CPF/CNPJ…" value={busca} onChange={e => setBusca(e.target.value)} />
    {q.length >= 2 && <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-surface shadow-floating">
      {r.data?.map(c => <button key={c.id} className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-elevated" onClick={() => { onChange(c); setBusca(''); }}>{c.nome}<span className="ml-2 text-text-secondary">{c.cpf_cnpj}</span></button>)}
      {r.data?.length === 0 && <p className="px-3 py-2 text-sm text-text-secondary">Nenhum cadastro encontrado. <Link to="/cadastros/$id" params={{ id: 'novo' }} className="text-primary hover:underline">Criar cadastro</Link></p>}
      {r.isLoading && <p className="px-3 py-2 text-sm text-text-secondary">Buscando…</p>}
    </div>}
  </div>;
}
