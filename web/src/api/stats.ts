import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
import type { StatsSummary } from '@/types/api';

export function useStatsSummary() {
  return useQuery({
    queryKey: queryKeys.stats.summary,
    queryFn: () => apiRequest<StatsSummary>('GET', '/stats/summary'),
  });
}
