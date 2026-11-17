import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';

export const historicoFiltersSchema = z.object({ busca: z.string().default(''), tipo: z.enum(['', 'proposta', 'contrato', 'reserva']).default(''), pagina: z.number().int().min(1).default(1) });
export type HistoricoFilters = z.infer<typeof historicoFiltersSchema>;
export const getHistoricoComercial = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: HistoricoFilters) => historicoFiltersSchema.parse(input)).handler(async ({ data, context }) => {
  let query = context.supabase.from('historico_comercial_sige').select('*', { count: 'exact' }).order('data_documento', { ascending: false }).order('numero_sige', { ascending: false }).range((data.pagina - 1) * 50, data.pagina * 50 - 1);
  if (data.tipo) query = query.eq('tipo', data.tipo);
  const search = data.busca.trim().replace(/[%,()]/g, '');
  if (search) query = query.or(`cliente_nome.ilike.%${search}%,numero_sige.ilike.%${search}%,contrato_sige.ilike.%${search}%,vendedor.ilike.%${search}%`);
  const result = await query;
  if (result.error) throw new Error('Não foi possível consultar o histórico comercial.');
  return { total: result.count ?? 0, linhas: result.data };
});