import { apiFetch } from '@/api/client';
import type { Category } from '@/api/types';

export const categoriesApi = {
  listApproved: () => apiFetch<Category[]>('/api/v1/categories?status=approved'),
};
