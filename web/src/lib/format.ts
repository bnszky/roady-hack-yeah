import type { CategoryStatus, ProblemStatus, ReportSource } from '@/types/api';

export const APP_NAME = 'Routy';

export const PROBLEM_STATUS_LABELS: Record<ProblemStatus, string> = {
  new: 'Nowe',
  in_progress: 'W realizacji',
  resolved: 'Rozwiązane',
  rejected: 'Odrzucone',
};

export const CATEGORY_STATUS_LABELS: Record<CategoryStatus, string> = {
  approved: 'Zatwierdzona',
  pending: 'Oczekuje',
  rejected: 'Odrzucona',
};

export const REPORT_SOURCE_LABELS: Record<ReportSource, string> = {
  form: 'Formularz',
  voice: 'Asystent głosowy',
  proximity_prompt: 'Popup w pobliżu',
};

const dateTimeFormat = new Intl.DateTimeFormat('pl-PL', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatDateTime(value: string): string {
  return dateTimeFormat.format(new Date(value));
}

export function formatImportance(value: number | null): string {
  return value === null ? '—' : value.toFixed(1);
}

/** Green (1) → red (5); slate when the category has no severity scale. */
export function importanceColor(value: number | null): string {
  if (value === null) return '#64748b';
  const stops = ['#16a34a', '#84cc16', '#eab308', '#f97316', '#dc2626'];
  const index = Math.min(stops.length - 1, Math.max(0, Math.round(value) - 1));
  return stops[index];
}
