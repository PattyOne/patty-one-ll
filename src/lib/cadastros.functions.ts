import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';

export const filtersSchema = z.object({ busca: z.string().default(''), vendedor: z.string().default(''), estado: z.string().default(''), tipo: z.enum(['', 'cliente', 'fornecedor', 'prestador']).default(''), sem_vendedor: z.boolean().default(false), pagina: z.number().int().min(1).default(1) });
export type Filters = z.infer<typeof filtersSchema>;
export const getCadastros = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: Filters) => filtersSchema.parse(input)).handler(async ({ data, context }) => {
  const result = await context.supabase.rpc('listar_cadastros', { filtros: data, pagina: data.pagina });
  if (result.error) throw new Error(result.error.message);
  return result.data as unknown as CadastroList;
});
export type ListRow = { id: string; nome: string; cpf_cnpj: string | null; cidade: string | null; estado: string | null; vendedor: string | null; is_cliente: boolean; is_fornecedor: boolean; is_prestador: boolean; telefone: string | null; restricao_sige: boolean; restricao_observacao: string | null };
export type CadastroList = { total: number; linhas: ListRow[]; vendedores: string[]; estados: string[] };
export const getCadastro = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((input: { id: string }) => z.object({ id: z.string() }).parse(input)).handler(async ({ data, context }) => {
  const role = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
  if (role.error) throw new Error(role.error.message);
  if (data.id === 'novo') return { cadastro: null, bancario: null, admin: !!role.data };
  const result = await context.supabase.from('cadastros').select('*').eq('id', data.id).single();
  if (result.error) throw new Error('Cadastro não encontrado');
  const banking = role.data ? await context.supabase.from('cadastros_bancario').select('*').eq('cadastro_id', data.id).maybeSingle() : null;
  if (banking?.error) throw new Error(banking.error.message);
  return { cadastro: result.data, bancario: banking?.data ?? null, admin: !!role.data };
});