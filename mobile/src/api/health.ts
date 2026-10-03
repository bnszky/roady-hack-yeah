import { apiFetch } from '@/api/client';

export type Health = { status: string; version: string };

export const healthApi = {
  get: () => apiFetch<Health>('/api/v1/health'),
};
