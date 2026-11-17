import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Image as ImageIcon, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { caminhoImagemPlanejamento, caminhoPublicoImagem, validarImagemPlanejamento } from '@/lib/planejamento-imagens';

export type OrigemImagem = 'programacao' | 'agendamento';
type Imagem = Tables<'planejamento_imagens'> & { url: string };

export function ImagensPlanejamento({ origem, entidadeId }: { origem: OrigemImagem; entidadeId: string }) {
  const [imagens, setImagens] = useState<Imagem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const queryClient = useQueryClient();

  async function atualizarConsultas() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['programacao'] }),
      queryClient.invalidateQueries({ queryKey: ['planejamento'] }),
    ]);
  }

  const carregar = useCallback(async () => {
    setCarregando(true);
    const coluna = origem === 'programacao' ? 'programacao_id' : 'agendamento_id';
    const r = await supabase.from('planejamento_imagens').select('*').eq(coluna, entidadeId).order('created_at');
    if (r.error) { toast.error(r.error.message); setCarregando(false); return; }
    setImagens((r.data ?? []).map(imagem => ({ ...imagem, url: caminhoPublicoImagem(imagem.id) })));
    setCarregando(false);
  }, [origem, entidadeId]);

  useEffect(() => { void carregar(); }, [carregar]);

  async function enviar(files: FileList | null) {
    if (!files?.length) return;
    const lista = [...files];
    const invalida = lista.map(validarImagemPlanejamento).find(Boolean);
    if (invalida) { toast.error(invalida); return; }
    setEnviando(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { toast.error('Sua sessão expirou. Entre novamente.'); setEnviando(false); return; }
    let enviadas = 0;
    for (const file of lista) {
      const path = caminhoImagemPlanejamento(auth.user.id, origem, entidadeId, file.name);
      const up = await supabase.storage.from('planejamento-imagens').upload(path, file, { contentType: file.type });
      if (up.error) { toast.error(`${file.name}: ${up.error.message}`); continue; }
      const vinculo = origem === 'programacao' ? { programacao_id: entidadeId, agendamento_id: null } : { programacao_id: null, agendamento_id: entidadeId };
      const ins = await supabase.from('planejamento_imagens').insert({ ...vinculo, owner_id: auth.user.id, storage_path: path, nome: file.name, content_type: file.type, tamanho: file.size });
      if (ins.error) {
        await supabase.storage.from('planejamento-imagens').remove([path]);
        toast.error(`${file.name}: ${ins.error.message}`);
      } else enviadas++;
    }
    setEnviando(false);
    if (enviadas) {
      toast.success(`${enviadas} imagem(ns) adicionada(s).`);
      await carregar();
      await atualizarConsultas();
    }
  }

  async function remover(imagem: Imagem) {
    if (!window.confirm(`Excluir a imagem “${imagem.nome}”?`)) return;
    const storage = await supabase.storage.from('planejamento-imagens').remove([imagem.storage_path]);
    if (storage.error) { toast.error(storage.error.message); return; }
    const r = await supabase.from('planejamento_imagens').delete().eq('id', imagem.id);
    if (r.error) { toast.error(r.error.message); return; }
    toast.success('Imagem excluída.');
    await carregar();
    await atualizarConsultas();
  }

  return <section className="space-y-3 rounded-xl border p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h3 className="flex items-center gap-2 text-sm font-semibold"><ImageIcon className="size-4 text-primary" />Imagens do serviço</h3><p className="text-xs text-text-secondary">Os endereços são permanentes e o acesso privado é renovado a cada abertura.</p></div>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-surface-elevated">
        {enviando ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}{enviando ? 'Enviando…' : 'Adicionar imagens'}
        <input aria-label="Enviar imagens" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden disabled={enviando} onChange={e => { void enviar(e.target.files); e.target.value = ''; }} />
      </label>
    </div>
    {carregando ? <p className="flex items-center gap-2 py-4 text-sm text-text-secondary"><Loader2 className="size-4 animate-spin" />Carregando imagens…</p> : !imagens.length ? <p className="rounded-lg border border-dashed p-4 text-center text-sm text-text-secondary">Nenhuma imagem anexada.</p> : <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">{imagens.map(imagem => <article key={imagem.id} className="overflow-hidden rounded-xl border bg-surface-elevated">
      <a href={imagem.url} target="_blank" rel="noreferrer" aria-label={`Abrir ${imagem.nome}`}><img src={imagem.url} alt={imagem.nome} className="aspect-video w-full object-cover" /></a>
      <div className="flex items-center gap-1 p-2"><p className="min-w-0 flex-1 truncate text-xs" title={imagem.nome}>{imagem.nome}</p><Button variant="ghost" size="icon" className="size-8" asChild><a href={imagem.url} target="_blank" rel="noreferrer" aria-label={`Abrir imagem ${imagem.nome}`}><ExternalLink /></a></Button><Button variant="ghost" size="icon" className="size-8 text-danger" aria-label={`Excluir imagem ${imagem.nome}`} onClick={() => void remover(imagem)}><Trash2 /></Button></div>
    </article>)}</div>}
  </section>;
}

export function ImagensMiniaturas({ imagens }: { imagens: { id: string; nome: string }[] }) {
  if (!imagens.length) return null;
  return <div className="flex flex-wrap gap-1.5" aria-label={`${imagens.length} imagem(ns) anexada(s)`}>
    {imagens.map(imagem => <a key={imagem.id} href={caminhoPublicoImagem(imagem.id)} target="_blank" rel="noreferrer" title={imagem.nome} aria-label={`Abrir imagem ${imagem.nome}`} className="overflow-hidden rounded-md border bg-surface-elevated hover:border-primary">
      <img src={`${caminhoPublicoImagem(imagem.id)}?miniatura=1`} alt={imagem.nome} className="size-11 object-cover" loading="lazy" />
    </a>)}
  </div>;
}

export function ImagensButton({ origem, entidadeId, quantidade = 0, disabled = false }: { origem: OrigemImagem; entidadeId: string; quantidade?: number; disabled?: boolean }) {
  const [aberto, setAberto] = useState(false);
  return <>
    <Button type="button" variant="ghost" size="icon" className="relative size-8" aria-label="Imagens do serviço" title={disabled ? 'Salve antes de adicionar imagens' : 'Ver ou adicionar imagens'} disabled={disabled} onClick={() => setAberto(true)}><ImageIcon /><span className="sr-only">{quantidade}</span>{quantidade > 0 && <span className="absolute ml-5 -mt-5 rounded-full bg-primary px-1 text-[9px] text-primary-foreground">{quantidade}</span>}</Button>
    {aberto && <Dialog open onOpenChange={setAberto}><DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto bg-surface"><DialogHeader><DialogTitle>Imagens do serviço</DialogTitle><DialogDescription>Clique na imagem para abrir o link privado de visualização.</DialogDescription></DialogHeader><ImagensPlanejamento origem={origem} entidadeId={entidadeId} /></DialogContent></Dialog>}
  </>;
}
