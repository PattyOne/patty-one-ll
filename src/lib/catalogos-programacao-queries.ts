import { queryOptions } from '@tanstack/react-query';
import { getCatalogosProgramacao } from './catalogos-programacao.functions';

export const catalogosProgramacaoOptions = () => queryOptions({
  queryKey: ['catalogos-programacao'],
  queryFn: () => getCatalogosProgramacao(),
  staleTime: 30_000,
});
