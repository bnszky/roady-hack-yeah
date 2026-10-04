import { useRouter } from 'expo-router';

import type { Category } from '@/api/types';
import { toProblemCreate, useReportDraft } from '@/context/report-draft';
import { useCategories } from '@/hooks/use-categories';
import { useRememberReport } from '@/hooks/use-my-reports';
import { useCreateProblem } from '@/hooks/use-problems';

/** The chosen category, or the AI's proposal when nothing in the catalog matched. */
export function useDraftCategory() {
  const { draft } = useReportDraft();
  const categories = useCategories();
  const category: Category | undefined = categories.data?.find((c) => c.id === draft.categoryId);
  return { category, proposal: draft.proposedCategory, categories };
}

/** POST /problems, remember it as "mine", then back to the map with a toast. */
export function usePublishDraft() {
  const router = useRouter();
  const { draft, setPublished } = useReportDraft();
  const create = useCreateProblem();
  const remember = useRememberReport();

  const publish = () =>
    create.mutate(toProblemCreate(draft), {
      onSuccess: async (result) => {
        await remember(result.problem.id);
        setPublished({
          problemId: result.problem.id,
          attached: result.attached_to_existing,
          location: { latitude: result.problem.latitude, longitude: result.problem.longitude },
        });
        router.dismissTo('/');
      },
    });

  return { publish, isPending: create.isPending, error: create.error as Error | null };
}
