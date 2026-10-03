import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { assistantApi } from '@/api/assistant';
import { useReportDraft, type DraftSource } from '@/context/report-draft';

/** Sends free text to the DeepSeek assistant, fills the draft and opens the confirmation. */
export function useAnalyzeReport(source: DraftSource) {
  const router = useRouter();
  const { draft, applyAiDraft } = useReportDraft();

  return useMutation({
    mutationFn: (text: string) => assistantApi.reportDraft({ text, ...draft.location }),
    onSuccess: (ai) => {
      applyAiDraft(ai, source);
      router.replace('/report/confirm');
    },
  });
}
