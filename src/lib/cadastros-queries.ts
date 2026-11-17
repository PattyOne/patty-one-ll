import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCadastros, getCadastro, type Filters } from './cadastros.functions';
export const listOptions = (filters: Filters) => queryOptions({ queryKey: ['cadastros', 'lista', filters], queryFn: () => getCadastros({ data: filters }), staleTime: 0 });
export const detailOptions = (id: string, userId: string) => queryOptions({ queryKey: ['cadastros', 'ficha', id, userId], queryFn: () => getCadastro({ data: { id } }), staleTime: 0 });
export const adminOptions = (userId: string) => queryOptions({ queryKey: ['admin', userId], queryFn: async () => {
  const result = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
  if (result.error) throw new Error(result.error.message);
  return result.data;
} });