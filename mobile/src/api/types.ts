// Mirrors backend/app/schemas (problem.py, category.py, assistant.py, common.py).

export type Page<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

export type CategoryStatus = 'approved' | 'pending' | 'rejected';
export type ProblemStatus = 'new' | 'in_progress' | 'resolved' | 'rejected';
export type ReportSource = 'form' | 'voice' | 'proximity_prompt';

export type CategoryBrief = {
  id: string;
  name: string;
  /** Lucide icon name, see lib/category-icons.ts */
  icon: string;
  is_importance_level_required: boolean;
  status: CategoryStatus;
};

export type Category = CategoryBrief & {
  description: string | null;
  problems_count: number;
  created_at: string;
  updated_at: string;
};

export type CategoryProposal = {
  name: string;
  icon: string;
  description: string | null;
  is_importance_level_required: boolean;
};

export type Problem = {
  id: string;
  category_id: string;
  category: CategoryBrief;
  latitude: number;
  longitude: number;
  description: string | null;
  status: ProblemStatus;
  status_note: string | null;
  is_observable: boolean;
  reports_count: number;
  confirmations_count: number;
  denials_count: number;
  consecutive_denials: number;
  importance_level_average: number | null;
  first_reported_at: string;
  last_reported_at: string;
  created_at: string;
  updated_at: string;
};

export type ProblemReport = {
  id: string;
  problem_id: string;
  is_observable: boolean;
  importance_level: number | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  source: ReportSource;
  transcript: string | null;
  reported_at: string;
  created_at: string;
};

export type ProblemDetail = Problem & {
  reports: ProblemReport[];
};

export type ProblemListParams = {
  min_lat?: number;
  max_lat?: number;
  min_lng?: number;
  max_lng?: number;
  category_ids?: string[];
  min_importance?: number;
  is_observable?: boolean;
  q?: string;
  limit?: number;
};

export type ProblemCreate = {
  category_id?: string;
  new_category?: CategoryProposal;
  description?: string | null;
  importance_level?: number | null;
  latitude: number;
  longitude: number;
  source: ReportSource;
  transcript?: string | null;
  attach_to_problem_id?: string | null;
};

export type ProblemResponseCreate = {
  is_observable: boolean;
  importance_level?: number | null;
  latitude?: number;
  longitude?: number;
};

export type ProblemReportResult = {
  problem: Problem;
  report: ProblemReport;
  attached_to_existing: boolean;
};

export type ReportDraftRequest = {
  text: string;
  latitude: number;
  longitude: number;
};

export type ReportDraft = {
  category: Category | null;
  proposed_category: CategoryProposal | null;
  description: string | null;
  importance_level: number | null;
  latitude: number;
  longitude: number;
  reported_at: string;
  existing_problem: Problem | null;
  missing_fields: string[];
  confidence: number;
  transcript: string;
};
