import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const getVeiculosPlanejamento = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [veiculos, equipes] = await Promise.all([
      context.supabase
        .from('producao_veiculos')
        .select('id, placa, modelo, marca, apelido, equipe_id, observacao, status, producao_equipes!producao_veiculos_equipe_id_fkey(id, nome, setor)')
        .order('placa'),
      context.supabase
        .from('producao_equipes')
        .select('id, nome, setor')
        .eq('ativo', true)
        .order('nome'),
    ]);
    if (veiculos.error) throw new Error(veiculos.error.message);
    if (equipes.error) throw new Error(equipes.error.message);
    return { veiculos: veiculos.data ?? [], equipes: equipes.data ?? [] };
  });
