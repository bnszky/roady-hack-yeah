import { apiFetch } from '@/api/client';
import type { Trip } from '@/api/types';

export const tripsApi = {
  list: () => apiFetch<Trip[]>('/api/v1/trips'),
  get: (id: string) => apiFetch<Trip>(`/api/v1/trips/${id}`),
  create: (payload: { name: string; description?: string }) =>
    apiFetch<Trip>('/api/v1/trips', { method: 'POST', body: JSON.stringify(payload) }),
};
