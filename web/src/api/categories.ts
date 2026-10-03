import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '@/api/client';
import { queryKeys } from '@/api/query-keys';
import type {
  Category,
  CategoryCreate,
  CategoryReject,
  CategoryStatus,
  CategoryUpdate,
} from '@/types/api';

export function useCategories(status?: CategoryStatus) {
  return useQuery({
    queryKey: queryKeys.categories.list(status),
    queryFn: () => apiRequest<Category[]>('GET', '/categories', { query: { status } }),
  });
}

function useInvalidateCategories() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.problems.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.stats.summary });
  };
}

export function useCreateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (data: CategoryCreate) =>
      apiRequest<Category>('POST', '/categories', { body: data }),
    onSuccess: invalidate,
  });
}

export function useUpdateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryUpdate }) =>
      apiRequest<Category>('PATCH', `/categories/${id}`, { body: data }),
    onSuccess: invalidate,
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (id: string) => apiRequest<void>('DELETE', `/categories/${id}`),
    onSuccess: invalidate,
  });
}

export function useApproveCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: (id: string) => apiRequest<Category>('POST', `/categories/${id}/approve`),
    onSuccess: invalidate,
  });
}

export function useRejectCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoryReject }) =>
      apiRequest<Category>('POST', `/categories/${id}/reject`, { body: data }),
    onSuccess: invalidate,
  });
}
