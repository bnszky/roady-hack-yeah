import type { Problem, ProblemStatus } from '@/api/types';

export type Severity = 'low' | 'mid' | 'high';

/** Rounded 1-5 severity, or 0 when nobody rated the problem. */
export function severityOf(problem: Pick<Problem, 'importance_level_average'>): number {
  const avg = problem.importance_level_average;
  return avg == null ? 0 : Math.max(1, Math.min(5, Math.round(avg)));
}

/** Marker tier: size, fill and number badge carry severity, never color alone. */
export function severityTier(sev: number): Severity {
  if (sev >= 4) return 'high';
  if (sev === 3) return 'mid';
  return 'low';
}

export const SEVERITY_LABELS = [
  'Wybierz ocenę',
  'Drobna niedogodność',
  'Uciążliwe',
  'Wyraźne utrudnienie',
  'Poważne utrudnienie',
  'Całkowita blokada lub poważny problem',
];

export const STATUS_LABELS: Record<ProblemStatus, string> = {
  new: 'Nowe',
  in_progress: 'W trakcie naprawy',
  resolved: 'Rozwiązane',
  rejected: 'Odrzucone',
};

/** Polish plural: 1 zgłoszenie, 2-4 zgłoszenia, 5+ zgłoszeń (12-14 -> zgłoszeń). */
export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const t = n % 10;
  const h = n % 100;
  return t >= 2 && t <= 4 && !(h >= 12 && h <= 14) ? few : many;
}

export function countLabel(n: number, one: string, few: string, many: string): string {
  return `${n} ${plural(n, one, few, many)}`;
}

export function ago(iso: string, now = Date.now()): string {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return 'przed chwilą';
  if (mins < 60) return `${mins} min temu`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} godz. temu`;
  const days = Math.round(hours / 24);
  return `${days} ${plural(days, 'dzień', 'dni', 'dni')} temu`;
}

const MONTHS = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const time = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (d.toDateString() === today.toDateString()) return `Dziś, ${time}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${time}`;
}

export type LatLng = { latitude: number; longitude: number };

/** Great-circle distance in meters. */
export function distanceM(a: LatLng, b: LatLng): number {
  const R = 6_371_000;
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLng = (b.longitude - a.longitude) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  return `${(m / 1000).toFixed(1).replace('.', ',')} km`;
}

/** Problems have no title, so the category name doubles as one. */
export function problemTitle(problem: Pick<Problem, 'category'>): string {
  return problem.category.name;
}
