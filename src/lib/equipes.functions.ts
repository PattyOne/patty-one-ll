import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const getEquipesProducao = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [equipes, colaboradores, veiculos] = await Promise.all([
      context.supabase.from('producao_equipes').select('*, producao_equipe_colaboradores(producao_colaboradores(id, nome, empresa)), producao_equipe_veiculos(producao_veiculos(id, placa, modelo, marca))').order('setor').order('nome'),
      context.supabase.from('producao_colaboradores').select('id, nome, empresa').eq('ativo', true).order('nome'),
      context.supabase.from('producao_veiculos').select('id, placa, modelo, marca').eq('status', 'ATIVO').order('placa'),
    ]);
    for (const resultado of [equipes, colaboradores, veiculos]) {
      if (resultado.error) throw new Error(resultado.error.message);
    }
    return { equipes: equipes.data ?? [], colaboradores: colaboradores.data ?? [], veiculos: veiculos.data ?? [] };
  });
