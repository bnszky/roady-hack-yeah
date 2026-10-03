import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
import type { Page, Problem, ProblemDetail, ProblemListParams, ProblemUpdate } from '@/types/api';

export function useProblems(params: ProblemListParams) {
  return useQuery({
    queryKey: queryKeys.problems.list(params),
    queryFn: () => apiRequest<Page<Problem>>('GET', '/problems', { query: { ...params } }),
    placeholderData: keepPreviousData,
  });
}

export function useProblem(id: string) {
  return useQuery({
    queryKey: queryKeys.problems.detail(id),
    queryFn: () => apiRequest<ProblemDetail>('GET', `/problems/${id}`),
  });
}

export function useUpdateProblem(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProblemUpdate) =>
      apiRequest<ProblemDetail>('PATCH', `/problems/${id}`, { body: data }),
    onSuccess: (problem) => {
      queryClient.setQueryData(queryKeys.problems.detail(id), problem);
      void queryClient.invalidateQueries({ queryKey: queryKeys.problems.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stats.summary });
    },
  });
}

export function useDeleteProblem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiRequest<void>('DELETE', `/problems/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.problems.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stats.summary });
    },
  });
}
