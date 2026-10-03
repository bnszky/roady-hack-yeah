import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';

import { problemsApi } from '@/api/problems';
import { problemKeys } from '@/hooks/use-problems';

// The backend does not store who reported a problem, so this device remembers it.
const STORAGE_KEY = 'roady.my-reports';
const myReportsKey = ['my-reports'] as const;

async function readIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function useRememberReport() {
  const queryClient = useQueryClient();
  return async (problemId: string) => {
    const ids = await readIds();
    const next = [problemId, ...ids.filter((id) => id !== problemId)];
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Losing the local history is not worth blocking the publish flow.
    }
    queryClient.setQueryData(myReportsKey, next);
  };
}

export function useMyReports() {
  const ids = useQuery({ queryKey: myReportsKey, queryFn: readIds });
  const details = useQueries({
    queries: (ids.data ?? []).map((id) => ({
      queryKey: problemKeys.detail(id),
      queryFn: () => problemsApi.get(id),
    })),
  });
  return {
    isPending: ids.isPending,
    problems: details.flatMap((q) => (q.data ? [q.data] : [])),
  };
}

/** Whether this device published (or confirmed while reporting) the given problem. */
export function useIsMyReport(problemId: string) {
  const ids = useQuery({ queryKey: myReportsKey, queryFn: readIds });
  return ids.data?.includes(problemId) ?? false;
}
