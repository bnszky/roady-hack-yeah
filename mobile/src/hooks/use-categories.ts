import { useQuery } from '@tanstack/react-query';

import { categoriesApi } from '@/api/categories';

export function useCategories() {
  return useQuery({
    queryKey: ['categories', 'approved'],
    queryFn: categoriesApi.listApproved,
    staleTime: 5 * 60_000,
  });
}
