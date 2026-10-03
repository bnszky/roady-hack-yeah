import type { CategoryStatus, ProblemListParams } from '@/types/api';

export const queryKeys = {
  categories: {
    all: ['categories'] as const,
    list: (status?: CategoryStatus) => ['categories', 'list', status ?? 'all'] as const,
  },
  problems: {
    all: ['problems'] as const,
    list: (params: ProblemListParams) => ['problems', 'list', params] as const,
    detail: (id: string) => ['problems', 'detail', id] as const,
  },
  stats: {
    summary: ['stats', 'summary'] as const,
  },
};
