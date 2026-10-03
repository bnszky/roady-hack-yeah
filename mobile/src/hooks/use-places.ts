import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { placesApi } from '@/api/places';

export const placeKeys = {
  all: ['places'] as const,
  detail: (id: string) => ['places', id] as const,
};

export function usePlaces() {
  return useQuery({
    queryKey: placeKeys.all,
    queryFn: placesApi.list,
  });
}

export function useCreatePlace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: placesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: placeKeys.all });
    },
  });
}
