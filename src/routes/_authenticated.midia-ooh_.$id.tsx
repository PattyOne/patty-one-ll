import { createFileRoute, Link, useNavigate, ClientOnly } from '@tanstack/react-router';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { lazy, Suspense, useState } from 'react';
import { ArrowLeft, ImagePlus, Trash2, LocateFixed } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { parseCoord, pontoOptions, tiposOptions, STATUS_PONTO, type Ponto } from '@/lib/midia';
import { useAdmin } from '@/hooks/useAdmin';
import { OcupacaoGrid } from '@/components/midia/OcupacaoGrid';
import { pageMeta } from '@/lib/page-meta';

const MapaPontos = lazy(() => import('@/components/midia/MapaPontos'));

export const Route = createFileRoute('/_authenticated/midia-ooh_/$id')({
  loader: async ({ context, params }) => { await Promise.all([context.queryClient.ensureQueryData(pontoOptions(params.id)), context.queryClient.ensureQueryData(tiposOptions())]); },
  head: ({ params }) => pageMeta(params.id === 'novo' ? 'Novo ponto de mídia' : 'Ponto de mídia', 'Dados, fotos e localização do ponto de mídia OOH.'),
  errorComponent: ({ error }) => <div className="p-6"><p>{(error as Error).message}</p><Link to="/midia-ooh" className="text-primary underline">Voltar</Link></div>,
  component: () => { const { id } = Route.useParams(); return <PontoForm key={id} id={id} />; },
});

type F = Record<'codigo' | 'nome' | 'tipo_id' | 'endereco' | 'bairro' | 'cidade' | 'estado' | 'referencia' | 'latitude' | 'longitude' | 'faces' | 'largura' | 'altura' | 'status' | 'observacao', string> & { iluminado: boolean };
const toForm = (p: Ponto | null): F => ({ codigo: p?.codigo ?? '', nome: p?.nome ?? '', tipo_id: p?.tipo_id ?? '', endereco: p?.endereco ?? '', bairro: p?.bairro ?? '', cidade: p?.cidade ?? '', estado: p?.estado ?? '', referencia: p?.referencia ?? '', latitude: p?.latitude?.toString() ?? '', longitude: p?.longitude?.toString() ?? '', faces: String(p?.faces ?? 1), largura: p?.largura?.toString().replace('.', ',') ?? '', altura: p?.altura?.toString().replace('.', ',') ?? '', status: p?.status ?? 'Ativo', observacao: p?.observacao ?? '', iluminado: p?.iluminado ?? false });
const num = (v: string) => { const t = v.trim().replace(/\./g, '').replace(',', '.'); return t ? Number(t) : null; };
const sel = 'h-10 w-full rounded-md border bg-surface px-3 text-sm';

function PontoForm({ id }: { id: string }) {
  const { data } = useSuspenseQuery(pontoOptions(id)); const { data: tipos } = useSuspenseQuery(tiposOptions());
  const { admin } = useAdmin(); const navigate = useNavigate(); const qc = useQueryClient();
  const [f, setF] = useState<F>(() => toForm(data.ponto)); const [saving, setSaving] = useState(false); const [uploading, setUploading] = useState(false);
  const set = (k: keyof F) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF(s => ({ ...s, [k]: e.target.value }));
  const lat = parseCoord(f.latitude, 'lat'); const lng = parseCoord(f.longitude, 'lng');
  const pins = typeof lat === 'number' && typeof lng === 'number' ? [{ id: 'p', lat, lng, title: f.nome || 'Ponto' }] : [];
  const pick = (a: number, b: number) => setF(s => ({ ...s, latitude: a.toFixed(6), longitude: b.toFixed(6) }));
  const refresh = () => qc.invalidateQueries({ queryKey: ['pontos_midia'] });

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!f.nome.trim() || !f.tipo_id) { toast.error('Informe nome e tipo de mídia'); return; }
    if (lat === 'invalido' || lng === 'invalido') { toast.error('Coordenadas inválidas'); return; }
    if ((lat === null) !== (lng === null)) { toast.error('Informe latitude e longitude juntas'); return; }
    const faces = parseInt(f.faces, 10); if (!(faces >= 1)) { toast.error('Faces deve ser 1 ou mais'); return; }
    const row = { codigo: f.codigo.trim() || null, nome: f.nome.trim(), tipo_id: f.tipo_id, endereco: f.endereco.trim() || null, bairro: f.bairro.trim() || null, cidade: f.cidade.trim() || null, estado: f.estado.trim().toUpperCase() || null, referencia: f.referencia.trim() || null, latitude: lat, longitude: lng, faces, iluminado: f.iluminado, largura: num(f.largura), altura: num(f.altura), status: f.status, observacao: f.observacao.trim() || null };
    setSaving(true);
    const r = id === 'novo' ? await supabase.from('pontos_midia').insert(row).select('id').single() : await supabase.from('pontos_midia').update(row).eq('id', id).select('id').single();
    setSaving(false);
    if (r.error) { toast.error(r.error.code === '23505' ? 'Já existe um ponto com esse código' : r.error.message); return; }
    toast.success('Ponto salvo'); await refresh();
    if (id === 'novo') navigate({ to: '/midia-ooh/$id', params: { id: r.data.id } });
  }
  async function enviarFotos(files: FileList | null) {
    if (!files?.length) return; setUploading(true);
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) { toast.error(`${file.name} não é imagem`); continue; }
      const path = `${id}/${crypto.randomUUID()}.${file.name.split('.').pop() || 'jpg'}`;
      const up = await supabase.storage.from('pontos-midia').upload(path, file, { contentType: file.type });
      if (up.error) { toast.error(up.error.message); continue; }
      const ins = await supabase.from('pontos_midia_fotos').insert({ ponto_id: id, path });
      if (ins.error) toast.error(ins.error.message);
    }
    setUploading(false); refresh();
  }
  async function removerFoto(fid: string, path: string) {
    await supabase.storage.from('pontos-midia').remove([path]);
    const r = await supabase.from('pontos_midia_fotos').delete().eq('id', fid); if (r.error) { toast.error(r.error.message); return; } refresh();
  }
  async function excluir() {
    if (!confirm('Excluir este ponto e suas fotos?')) return;
    if (data.fotos.length) await supabase.storage.from('pontos-midia').remove(data.fotos.map(x => x.path));
    const r = await supabase.from('pontos_midia').delete().eq('id', id); if (r.error) { toast.error(r.error.message); return; }
    toast.success('Ponto excluído'); await refresh(); navigate({ to: '/midia-ooh' });
  }
  function minhaLocalizacao() { navigator.geolocation?.getCurrentPosition(p => pick(p.coords.latitude, p.coords.longitude), () => toast.error('Não foi possível obter sua localização')); }

  const field = (label: string, k: keyof F, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => <label className="space-y-1.5 text-sm"><span className="text-text-secondary">{label}</span><Input value={f[k] as string} onChange={set(k)} {...props} /></label>;
  return <form onSubmit={salvar} className="space-y-5 p-4 md:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><Button asChild variant="ghost" size="icon" aria-label="Voltar"><Link to="/midia-ooh"><ArrowLeft /></Link></Button><h1 className="text-2xl font-semibold">{id === 'novo' ? 'Novo ponto de mídia' : f.nome}</h1></div>
      <div className="flex gap-2">{admin && id !== 'novo' && <Button type="button" variant="outline" onClick={excluir}><Trash2 />Excluir</Button>}<Button type="submit" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</Button></div></div>
    <section className="grid gap-4 rounded-2xl border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4">
      {field('Código', 'codigo')}{field('Nome *', 'nome', { className: '' })}
      <label className="space-y-1.5 text-sm"><span className="text-text-secondary">Tipo de mídia *</span><select className={sel} value={f.tipo_id} onChange={set('tipo_id')}><option value="">Selecione…</option>{tipos.filter(t => t.ativo || t.id === f.tipo_id).map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}</select></label>
      <label className="space-y-1.5 text-sm"><span className="text-text-secondary">Situação</span><select className={sel} value={f.status} onChange={set('status')}>{STATUS_PONTO.map(s => <option key={s}>{s}</option>)}</select></label>
      {field('Faces', 'faces', { type: 'number', min: 1 })}{field('Largura (m)', 'largura', { inputMode: 'decimal' })}{field('Altura (m)', 'altura', { inputMode: 'decimal' })}
      <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" className="size-4 accent-primary" checked={f.iluminado} onChange={e => setF(s => ({ ...s, iluminado: e.target.checked }))} />Iluminado</label>
    </section>
    <section className="grid gap-4 rounded-2xl border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4">
      <h2 className="font-semibold sm:col-span-2 lg:col-span-4">Localização</h2>
      <div className="sm:col-span-2">{field('Endereço', 'endereco')}</div>{field('Bairro', 'bairro')}{field('Referência', 'referencia')}
      {field('Cidade', 'cidade')}{field('UF', 'estado', { maxLength: 2 })}{field('Latitude', 'latitude', { inputMode: 'decimal', placeholder: '-23,550520' })}{field('Longitude', 'longitude', { inputMode: 'decimal', placeholder: '-46,633308' })}
      <div className="space-y-2 sm:col-span-2 lg:col-span-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-text-secondary">Clique no mapa ou arraste o marcador para definir a posição.</p><Button type="button" variant="outline" size="sm" onClick={minhaLocalizacao}><LocateFixed />Usar minha localização</Button></div>
        <ClientOnly fallback={<div className="h-96 rounded-2xl border bg-surface-elevated" />}><Suspense fallback={<div className="h-96 rounded-2xl border bg-surface-elevated" />}><MapaPontos pins={pins} onPick={pick} className="h-96" /></Suspense></ClientOnly></div>
    </section>
    <section className="space-y-3 rounded-2xl border bg-surface p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Fotos</h2>
      {id !== 'novo' && <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-surface-elevated"><ImagePlus className="size-4" />{uploading ? 'Enviando…' : 'Adicionar fotos'}<input type="file" accept="image/*" multiple hidden disabled={uploading} onChange={e => { enviarFotos(e.target.files); e.target.value = ''; }} /></label>}</div>
      {id === 'novo' ? <p className="text-sm text-text-secondary">Salve o ponto para adicionar fotos.</p> : !data.fotos.length ? <p className="text-sm text-text-secondary">Nenhuma foto ainda.</p> :
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{data.fotos.map(ft => <div key={ft.id} className="group relative overflow-hidden rounded-xl border"><a href={ft.url} target="_blank" rel="noreferrer"><img src={ft.url} alt={`Foto de ${f.nome}`} className="aspect-video w-full object-cover" /></a><Button type="button" size="icon" variant="secondary" aria-label="Remover foto" className="absolute right-2 top-2" onClick={() => removerFoto(ft.id, ft.path)}><Trash2 /></Button></div>)}</div>}
    </section>
    {id !== 'novo' && <section className="space-y-3 rounded-2xl border bg-surface p-5"><h2 className="font-semibold">Bi-semanas {new Date().getFullYear()}</h2><OcupacaoGrid pontos={[{ id, nome: f.nome, codigo: f.codigo }]} ano={new Date().getFullYear()} /></section>}
    <section className="rounded-2xl border bg-surface p-5"><label className="space-y-1.5 text-sm"><span className="text-text-secondary">Observação</span><textarea className="min-h-24 w-full rounded-md border bg-surface p-3 text-sm" value={f.observacao} onChange={set('observacao')} /></label></section>
  </form>;
}
