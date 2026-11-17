import { queryOptions } from '@tanstack/react-query';
import { getVendas, getVenda, getEmpresas, type VendasFilters } from './vendas.functions';
export const vendasListOptions = (f: VendasFilters) => queryOptions({ queryKey: ['vendas', 'lista', f], queryFn: () => getVendas({ data: f }), staleTime: 0 });
export const vendaOptions = (id: string) => queryOptions({ queryKey: ['vendas', 'doc', id], queryFn: () => getVenda({ data: { id } }), staleTime: 0 });
export const empresasOptions = () => queryOptions({ queryKey: ['empresas'], queryFn: () => getEmpresas(), staleTime: 300_000 });
