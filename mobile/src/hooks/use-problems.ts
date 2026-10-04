import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { problemsApi } from '@/api/problems';
import type { ProblemCreate, ProblemListParams, ProblemResponseCreate } from '@/api/types';

export const problemKeys = {
  all: ['problems'] as const,
  list: (params: ProblemListParams) => ['problems', 'list', params] as const,
  detail: (id: string) => ['problems', 'detail', id] as const,
};

/**
 * Snaps the bbox to a 0.001° grid so tiny map pans reuse the cached query. Always
 * rounds outwards: rounding to nearest could shrink a zoomed-in bbox to nothing.
 */
function roundParams(params: ProblemListParams): ProblemListParams {
  const down = (v?: number) => (v === undefined ? undefined : Math.floor(v * 1000) / 1000);
  const up = (v?: number) => (v === undefined ? undefined : Math.ceil(v * 1000) / 1000);
  return {
    ...params,
    min_lat: down(params.min_lat),
    max_lat: up(params.max_lat),
    min_lng: down(params.min_lng),
    max_lng: up(params.max_lng),
  };
}

export function useProblems(params: ProblemListParams, enabled = true) {
  // A whole neighbourhood per query (see lib/cluster.ts), so use the backend maximum.
  const rounded = roundParams({ is_observable: true, limit: 1000, ...params });
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
