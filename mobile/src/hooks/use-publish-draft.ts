import { useRouter } from 'expo-router';

import type { Category } from '@/api/types';
import { toProblemCreate, useReportDraft } from '@/context/report-draft';
import { useCategories } from '@/hooks/use-categories';
import { useRememberReport } from '@/hooks/use-my-reports';
import { useCreateProblem } from '@/hooks/use-problems';

/** The chosen category (or the AI's proposal) and whether it asks for severity 1-5. */
export function useDraftCategory() {
  const { draft } = useReportDraft();
  const categories = useCategories();
  const category: Category | undefined = categories.data?.find((c) => c.id === draft.categoryId);
  const needsImportance = category
    ? category.is_importance_level_required
    : (draft.proposedCategory?.is_importance_level_required ?? false);
  return { category, proposal: draft.proposedCategory, needsImportance, categories };
}

/** POST /problems, remember it as "mine", then back to the map with a toast. */
export function usePublishDraft() {
  const router = useRouter();
  const { draft, setPublished } = useReportDraft();
  const { needsImportance } = useDraftCategory();
  const create = useCreateProblem();
  const remember = useRememberReport();

  const publish = () =>
    create.mutate(toProblemCreate(draft, needsImportance), {
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
