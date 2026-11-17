import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { adminOptions } from '@/lib/cadastros-queries';
export function useAdmin() {
  const { user } = useAuth();
  const query = useQuery({ ...adminOptions(user?.id ?? ''), enabled: !!user });
  return { admin: query.data === true, loading: query.isPending, error: query.error };
}