import { createFileRoute, Link, useNavigate, ClientOnly } from '@tanstack/react-router';
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lazy, Suspense, useMemo, useState } from 'react';
import { CalendarRange, Plus, Tags, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { pontosOptions, tiposOptions } from '@/lib/midia';
import { useAdmin } from '@/hooks/useAdmin';
import { pageMeta } from '@/lib/page-meta';

const MapaPontos = lazy(() => import('@/components/midia/MapaPontos'));

export const Route = createFileRoute('/_authenticated/midia-ooh')({
  loader: async ({ context }) => { await Promise.all([context.queryClient.ensureQueryData(pontosOptions()), context.queryClient.ensureQueryData(tiposOptions())]); },
  head: () => pageMeta('Mídia OOH', 'Pontos de mídia exterior do grupo, com tipos, fotos e localização no mapa.'),
  component: MidiaPage,
});

function MidiaPage() {
  const { data: pontos } = useSuspenseQuery(pontosOptions()); const { data: tipos } = useSuspenseQuery(tiposOptions());
  const { admin } = useAdmin(); const navigate = useNavigate();
  const [busca, setBusca] = useState(''); const [tipo, setTipo] = useState(''); const [tiposOpen, setTiposOpen] = useState(false);
  const lista = useMemo(() => { const q = busca.trim().toLowerCase(); return pontos.filter(p => (!tipo || p.tipo_id === tipo) && (!q || [p.nome, p.codigo, p.endereco, p.bairro, p.cidade].some(v => v?.toLowerCase().includes(q)))); }, [pontos, busca, tipo]);
  const pins = useMemo(() => lista.filter(p => p.latitude != null && p.longitude != null).map(p => ({ id: p.id, lat: Number(p.latitude), lng: Number(p.longitude), title: p.nome })), [lista]);
  return <div className="space-y-5 p-4 md:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">Mídia OOH</h1><p className="text-sm text-text-secondary">Pontos de mídia, tipos, fotos e localização.</p></div>
      <div className="flex gap-2"><Button asChild variant="outline"><Link to="/midia-ooh/bissemanas"><CalendarRange />Bi-semanas</Link></Button>{admin && <Button variant="outline" onClick={() => setTiposOpen(true)}><Tags />Tipos de mídia</Button>}<Button asChild><Link to="/midia-ooh/$id" params={{ id: 'novo' }}><Plus />Novo ponto</Link></Button></div></div>
    <ClientOnly fallback={<div className="h-80 rounded-2xl border bg-surface-elevated" />}><Suspense fallback={<div className="h-80 rounded-2xl border bg-surface-elevated" />}><MapaPontos pins={pins} onSelect={id => navigate({ to: '/midia-ooh/$id', params: { id } })} /></Suspense></ClientOnly>
    <div className="grid gap-3 sm:grid-cols-3"><Input aria-label="Buscar pontos" placeholder="Buscar por nome, código, endereço ou cidade…" value={busca} onChange={e => setBusca(e.target.value)} className="sm:col-span-2" />
      <select aria-label="Filtrar tipo de mídia" className="h-10 rounded-md border bg-surface px-3 text-sm" value={tipo} onChange={e => setTipo(e.target.value)}><option value="">Todos os tipos</option>{tipos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}</select></div>
    <p className="text-sm text-text-secondary">{lista.length} pontos · {pins.length} no mapa</p>
    <div className="overflow-x-auto rounded-md border bg-surface"><table className="w-full text-left text-sm"><thead className="bg-surface-elevated"><tr>{['Código', 'Nome', 'Tipo', 'Cidade/UF', 'Faces', 'Situação', 'Mapa'].map(h => <th key={h} className="whitespace-nowrap p-3">{h}</th>)}</tr></thead><tbody>
      {lista.map(p => <tr key={p.id} className="border-t hover:bg-surface-elevated"><td className="p-3">{p.codigo || '—'}</td><td className="min-w-48 p-3"><Link className="font-medium text-primary hover:underline" to="/midia-ooh/$id" params={{ id: p.id }}>{p.nome}</Link></td><td className="p-3">{p.tipos_midia?.nome}</td><td className="p-3">{[p.cidade, p.estado].filter(Boolean).join('/') || '—'}</td><td className="p-3">{p.faces}</td><td className="p-3"><Badge variant={p.status === 'Ativo' ? 'secondary' : 'outline'}>{p.status}</Badge></td><td className="p-3">{p.latitude != null ? 'Sim' : '—'}</td></tr>)}
      {!lista.length && <tr><td colSpan={7} className="p-10 text-center text-text-secondary">Nenhum ponto cadastrado.</td></tr>}
    </tbody></table></div>
    {admin && <TiposDialog open={tiposOpen} onOpenChange={setTiposOpen} />}
  </div>;
}

function TiposDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: tipos } = useSuspenseQuery(tiposOptions()); const qc = useQueryClient(); const [nome, setNome] = useState('');
  const refresh = () => qc.invalidateQueries({ queryKey: ['tipos_midia'] });
  const add = useMutation({ mutationFn: async () => { const r = await supabase.from('tipos_midia').insert({ nome: nome.trim() }); if (r.error) throw new Error(r.error.code === '23505' ? 'Esse tipo já existe' : r.error.message); }, onSuccess: () => { setNome(''); refresh(); }, onError: e => toast.error(e.message) });
  const del = useMutation({ mutationFn: async (id: string) => { const r = await supabase.from('tipos_midia').delete().eq('id', id); if (r.error) throw new Error(r.error.code === '23503' ? 'Há pontos usando esse tipo' : r.error.message); }, onSuccess: refresh, onError: e => toast.error(e.message) });
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogTitle>Tipos de mídia</DialogTitle><DialogDescription>Tipos disponíveis ao cadastrar um ponto.</DialogDescription>
    <ul className="max-h-72 divide-y overflow-auto rounded-md border">{tipos.map(t => <li key={t.id} className="flex items-center justify-between px-3 py-2 text-sm">{t.nome}<Button size="icon" variant="ghost" aria-label={`Excluir ${t.nome}`} onClick={() => del.mutate(t.id)}><Trash2 /></Button></li>)}</ul>
    <form className="flex gap-2" onSubmit={e => { e.preventDefault(); if (nome.trim()) add.mutate(); }}><Input aria-label="Novo tipo" placeholder="Novo tipo…" value={nome} onChange={e => setNome(e.target.value)} /><Button type="submit" disabled={!nome.trim() || add.isPending}>Adicionar</Button></form>
  </DialogContent></Dialog>;
}
