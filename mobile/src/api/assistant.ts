import { apiFetch } from '@/api/client';
import type { ReportDraft, ReportDraftRequest } from '@/api/types';

export const assistantApi = {
  /** DeepSeek: free text -> category, severity, description. Nothing is saved. */
  reportDraft: (payload: ReportDraftRequest) =>
    apiFetch<ReportDraft>('/api/v1/assistant/report-draft', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
