// Mirrors backend/app/schemas/*

export type CategoryStatus = 'approved' | 'pending' | 'rejected';
export type ProblemStatus = 'new' | 'in_progress' | 'resolved' | 'rejected';
export type ReportSource = 'form' | 'voice' | 'proximity_prompt';
export type SortOrder = 'asc' | 'desc';
export type ProblemSortField =
  | 'confirmations_count'
  | 'importance_level_average'
  | 'reports_count'
  | 'last_reported_at'
  | 'first_reported_at';

export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface CategoryBrief {
  id: string;
  name: string;
  icon: string;
  is_importance_level_required: boolean;
  status: CategoryStatus;
}

export interface Category extends CategoryBrief {
  description: string | null;
  problems_count: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreate {
  name: string;
  icon: string;
  description: string | null;
  is_importance_level_required: boolean;
}

export type CategoryUpdate = Partial<CategoryCreate> & { status?: CategoryStatus };

export interface CategoryReject {
  reassign_to_category_id: string | null;
}

export interface ProblemReport {
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
}

export interface Problem {
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
}

export interface ProblemDetail extends Problem {
  reports: ProblemReport[];
}

export interface ProblemFilters {
  category_ids?: string[];
  statuses?: ProblemStatus[];
  is_observable?: boolean;
  min_confirmations?: number;
  min_importance?: number;
  include_pending_categories?: boolean;
}

export interface ProblemListParams extends ProblemFilters {
  min_lat?: number;
  max_lat?: number;
  min_lng?: number;
  max_lng?: number;
  q?: string;
  sort_by?: ProblemSortField;
  order?: SortOrder;
  limit?: number;
  offset?: number;
}

export interface ProblemUpdate {
  category_id?: string;
  description?: string | null;
  status?: ProblemStatus;
  status_note?: string | null;
  latitude?: number;
  longitude?: number;
}

export interface CategoryStats {
  category_id: string;
  name: string;
  icon: string;
  problems_count: number;
}

export interface StatsSummary {
  problems_total: number;
  problems_observable: number;
  problems_by_status: Record<ProblemStatus, number>;
  reports_total: number;
  reports_last_7_days: number;
  pending_categories: number;
  top_categories: CategoryStats[];
}
