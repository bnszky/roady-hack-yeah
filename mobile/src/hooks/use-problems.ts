import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { problemsApi } from '@/api/problems';
import type { ProblemCreate, ProblemListParams, ProblemResponseCreate } from '@/api/types';

export const problemKeys = {
  all: ['problems'] as const,
  list: (params: ProblemListParams) => ['problems', 'list', params] as const,
  detail: (id: string) => ['problems', 'detail', id] as const,
};

/** Rounds the bbox so tiny map pans reuse the cached query. */
function roundParams(params: ProblemListParams): ProblemListParams {
  const r = (v?: number) => (v === undefined ? undefined : Math.round(v * 1000) / 1000);
  return {
    ...params,
    min_lat: r(params.min_lat),
    max_lat: r(params.max_lat),
    min_lng: r(params.min_lng),
    max_lng: r(params.max_lng),
  };
}

export function useProblems(params: ProblemListParams, enabled = true) {
  const rounded = roundParams({ is_observable: true, limit: 300, ...params });
  return useQuery({
    queryKey: problemKeys.list(rounded),
    queryFn: () => problemsApi.list(rounded),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useProblem(id: string | undefined) {
  return useQuery({
    queryKey: problemKeys.detail(id ?? ''),
    queryFn: () => problemsApi.get(id!),
    enabled: !!id,
  });
}

export function useRespondToProblem(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProblemResponseCreate) => problemsApi.respond(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: problemKeys.all }),
  });
}

export function useCreateProblem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProblemCreate) => problemsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: problemKeys.all }),
  });
}
