import { apiFetch } from '@/api/client';
import type { Place } from '@/api/types';

export const placesApi = {
  list: () => apiFetch<Place[]>('/api/v1/places'),
  get: (id: string) => apiFetch<Place>(`/api/v1/places/${id}`),
  create: (payload: { name: string; category: string; latitude: number; longitude: number }) =>
    apiFetch<Place>('/api/v1/places', { method: 'POST', body: JSON.stringify(payload) }),
};
