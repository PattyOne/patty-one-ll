import { queryOptions } from '@tanstack/react-query';
import { getHistoricoComercial, type HistoricoFilters } from './historico-comercial.functions';
export const historicoComercialOptions = (filters: HistoricoFilters) => queryOptions({ queryKey: ['historico-comercial', filters], queryFn: () => getHistoricoComercial({ data: filters }), staleTime: 0 });