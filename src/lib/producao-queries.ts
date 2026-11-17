import { queryOptions } from '@tanstack/react-query';
import { getOrdensProducao, getOrdemProducao, getRecursosProducao, type ProducaoFilters } from './producao.functions';

export const ordensProducaoOptions = (filtros: ProducaoFilters) => queryOptions({
  queryKey: ['producao', 'ordens', filtros],
  queryFn: () => getOrdensProducao({ data: filtros }),
  staleTime: 0,
});
export const ordemProducaoOptions = (id: string) => queryOptions({
  queryKey: ['producao', 'ordem', id],
  queryFn: () => getOrdemProducao({ data: { id } }),
  staleTime: 0,
});
export const recursosProducaoOptions = () => queryOptions({
  queryKey: ['producao', 'recursos'],
  queryFn: () => getRecursosProducao(),
  staleTime: 300_000,
});
