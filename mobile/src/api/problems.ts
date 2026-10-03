import { apiFetch } from '@/api/client';
import type {
  Page,
  Problem,
  ProblemCreate,
  ProblemDetail,
  ProblemListParams,
  ProblemReportResult,
  ProblemResponseCreate,
} from '@/api/types';

function toQuery(params: ProblemListParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) value.forEach((v) => search.append(key, String(v)));
    else search.append(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export const problemsApi = {
  list: (params: ProblemListParams) =>
    apiFetch<Page<Problem>>(`/api/v1/problems${toQuery(params)}`),
  get: (id: string) => apiFetch<ProblemDetail>(`/api/v1/problems/${id}`),
  create: (payload: ProblemCreate) =>
    apiFetch<ProblemReportResult>('/api/v1/problems', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  respond: (id: string, payload: ProblemResponseCreate) =>
    apiFetch<ProblemReportResult>(`/api/v1/problems/${id}/responses`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
