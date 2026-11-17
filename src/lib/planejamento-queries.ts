import { queryOptions } from '@tanstack/react-query';
import { getPlanejamento } from './planejamento.functions';
import type { Periodo } from './planejamento';

export const planejamentoOptions = (periodo: Periodo) => queryOptions({
  queryKey: ['planejamento', periodo.inicio, periodo.fim],
  queryFn: () => getPlanejamento({ data: periodo }),
  staleTime: 0,
});
