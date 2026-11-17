import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const getCatalogosProgramacao = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [produtos, servicos] = await Promise.all([
      context.supabase.from('programacao_produtos').select('*').order('nome'),
      context.supabase.from('producao_servicos').select('id, id_sige, nome, produto, ativo').order('nome'),
    ]);
    if (produtos.error) throw new Error(produtos.error.message);
    if (servicos.error) throw new Error(servicos.error.message);
    return { produtos: produtos.data ?? [], servicos: servicos.data ?? [] };
  });
