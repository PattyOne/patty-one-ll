import { queryOptions } from '@tanstack/react-query';
import { getVeiculosPlanejamento } from './veiculos.functions';

export const veiculosPlanejamentoOptions = () => queryOptions({
  queryKey: ['veiculos-planejamento'],
  queryFn: () => getVeiculosPlanejamento(),
  staleTime: 30_000,
});
