import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Ponto = Tables<'pontos_midia'>;
export type TipoMidia = Tables<'tipos_midia'>;
export type Foto = Tables<'pontos_midia_fotos'> & { url: string };
export const STATUS_PONTO = ['Ativo', 'Inativo', 'Em manutenção'] as const;
export const calendarioOptions = () => queryOptions({ queryKey: ['calendario_bissemanas'], queryFn: async () => {
  const r = await supabase.from('calendario_bissemanas').select('*').order('inicio');
  if (r.error) throw new Error(r.error.message);
  return r.data;
} });

/** Aceita "-23,5505" ou "-23.5505"; devolve null se vazio, NaN-safe e dentro do limite. */
export function parseCoord(value: string, kind: 'lat' | 'lng'): number | null | 'invalido' {
  const t = value.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  const max = kind === 'lat' ? 90 : 180;
  if (!Number.isFinite(n) || Math.abs(n) > max) return 'invalido';
  return Math.round(n * 1e6) / 1e6;
}

export const tiposOptions = () => queryOptions({ queryKey: ['tipos_midia'], queryFn: async () => {
  const r = await supabase.from('tipos_midia').select('*').order('nome');
  if (r.error) throw new Error(r.error.message); return r.data;
} });
export const pontosOptions = () => queryOptions({ queryKey: ['pontos_midia'], queryFn: async () => {
  const r = await supabase.from('pontos_midia').select('*, tipos_midia(nome)').order('nome');
  if (r.error) throw new Error(r.error.message); return r.data;
} });
/** Ocupação do ano; sem pontoId traz todos os pontos (mesma chave usada pela grade). */
export const ocupacaoOptions = (ano: number, pontoId?: string) => queryOptions({
  queryKey: ['pontos_ocupacao', ano, pontoId ?? 'todos'],
  queryFn: async () => {
    let q = supabase.from('pontos_ocupacao').select('ponto_id,bissemana,status,cliente').eq('ano', ano);
    if (pontoId) q = q.eq('ponto_id', pontoId);
    const r = await q;
    if (r.error) throw new Error(r.error.message);
    return r.data;
  },
});
/** Validade dos links das fotos (segundos) — curta para que acesso removido expire logo. */
export const FOTO_URL_TTL_SEGUNDOS = 300;
/** Recarrega os links antes de expirarem (1 min de folga). */
export const FOTO_URL_STALE_MS = (FOTO_URL_TTL_SEGUNDOS - 60) * 1000;
export const pontoOptions = (id: string) => queryOptions({ queryKey: ['pontos_midia', id], staleTime: FOTO_URL_STALE_MS, refetchInterval: FOTO_URL_STALE_MS, queryFn: async () => {
  if (id === 'novo') return { ponto: null as Ponto | null, fotos: [] as Foto[] };
  const r = await supabase.from('pontos_midia').select('*').eq('id', id).single();
  if (r.error) throw new Error('Ponto não encontrado');
  const f = await supabase.from('pontos_midia_fotos').select('*').eq('ponto_id', id).order('created_at');
  if (f.error) throw new Error(f.error.message);
  const paths = f.data.map(x => x.path);
  const signed = paths.length ? await supabase.storage.from('pontos-midia').createSignedUrls(paths, FOTO_URL_TTL_SEGUNDOS) : { data: [] };
  const fotos = f.data.map((x, i) => ({ ...x, url: signed.data?.[i]?.signedUrl ?? '' }));
  return { ponto: r.data as Ponto | null, fotos };
} });
