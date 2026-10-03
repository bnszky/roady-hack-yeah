import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { CategoryProposal, Problem, ProblemCreate, ReportDraft } from '@/api/types';
import { FALLBACK_LOCATION } from '@/hooks/use-location';
import type { LatLng } from '@/lib/format';

export type DraftSource = 'voice' | 'text' | 'form';

export type Draft = {
  source: DraftSource;
  transcript: string | null;
  categoryId: string | null;
  /** AI suggestion when no existing category matched (needs admin approval). */
  proposedCategory: CategoryProposal | null;
  importance: number | null;
  description: string;
  location: LatLng;
  locationManual: boolean;
  /** Nearby problem of the same category the report will be attached to. */
  existingProblem: Problem | null;
};

const emptyDraft = (source: DraftSource, location: LatLng): Draft => ({
  source,
  transcript: null,
  categoryId: null,
  proposedCategory: null,
  importance: null,
  description: '',
  location,
  locationManual: false,
  existingProblem: null,
});

type Published = { problemId: string; attached: boolean; location: LatLng };

type ContextValue = {
  draft: Draft;
  start: (source: DraftSource, location: LatLng) => void;
  update: (patch: Partial<Draft>) => void;
  applyAiDraft: (ai: ReportDraft, source: DraftSource) => void;
  /** Set after a successful publish; the map shows a toast and focuses the marker. */
  published: Published | null;
  setPublished: (p: Published | null) => void;
};

const ReportDraftContext = createContext<ContextValue | null>(null);

export function ReportDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<Draft>(() => emptyDraft('form', FALLBACK_LOCATION));
  const [published, setPublished] = useState<Published | null>(null);

  const start = useCallback(
    (source: DraftSource, location: LatLng) => setDraft(emptyDraft(source, location)),
    [],
  );
  const update = useCallback((patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch })), []);
  const applyAiDraft = useCallback(
    (ai: ReportDraft, source: DraftSource) =>
      setDraft((d) => ({
        ...d,
        source,
        transcript: ai.transcript,
        categoryId: ai.category?.id ?? null,
        proposedCategory: ai.category ? null : ai.proposed_category,
        importance: ai.importance_level,
        description: ai.description ?? ai.transcript,
        existingProblem: ai.existing_problem,
      })),
    [],
  );

  const value = useMemo(
    () => ({ draft, start, update, applyAiDraft, published, setPublished }),
    [draft, start, update, applyAiDraft, published],
  );
  return <ReportDraftContext.Provider value={value}>{children}</ReportDraftContext.Provider>;
}

export function useReportDraft() {
  const ctx = useContext(ReportDraftContext);
  if (!ctx) throw new Error('useReportDraft must be used inside ReportDraftProvider');
  return ctx;
}

/** What still blocks publishing, as a button label; null when the draft is complete. */
export function missingField(draft: Draft, needsImportance: boolean): string | null {
  if (!draft.categoryId && !draft.proposedCategory) return 'Wybierz kategorię';
  if (needsImportance && !draft.importance) return 'Oceń ważność problemu';
  return null;
}

export function toProblemCreate(draft: Draft, needsImportance: boolean): ProblemCreate {
  return {
    ...(draft.categoryId
      ? { category_id: draft.categoryId }
      : { new_category: draft.proposedCategory! }),
    description: draft.description.trim() || null,
    importance_level: needsImportance ? draft.importance : null,
    latitude: draft.location.latitude,
    longitude: draft.location.longitude,
    // The backend has no "text" source: a typed report is a form submission.
    source: draft.source === 'voice' ? 'voice' : 'form',
    transcript: draft.source === 'voice' ? draft.transcript : null,
    attach_to_problem_id: draft.locationManual ? null : (draft.existingProblem?.id ?? null),
  };
}
