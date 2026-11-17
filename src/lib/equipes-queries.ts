import { queryOptions } from '@tanstack/react-query';
import { getEquipesProducao } from './equipes.functions';

export const equipesProducaoOptions = () => queryOptions({
  queryKey: ['equipes-producao'],
  queryFn: () => getEquipesProducao(),
  staleTime: 30_000,
});
