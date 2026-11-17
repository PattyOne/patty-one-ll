import { queryOptions } from '@tanstack/react-query';
import { getProgramacao } from './programacao.functions';

export const programacaoOptions = (data: string) => queryOptions({
  queryKey: ['programacao', data],
  queryFn: () => getProgramacao({ data: { data } }),
  staleTime: 0,
});
