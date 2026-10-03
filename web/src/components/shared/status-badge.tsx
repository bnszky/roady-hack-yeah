import { Badge } from '@/components/ui/badge';
import { CATEGORY_STATUS_LABELS, PROBLEM_STATUS_LABELS } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { CategoryStatus, ProblemStatus } from '@/types/api';

const PROBLEM_STATUS_CLASSES: Record<ProblemStatus, string> = {
  new: 'bg-sky-100 text-sky-800',
  in_progress: 'bg-amber-100 text-amber-800',
  resolved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-zinc-200 text-zinc-700',
};

const CATEGORY_STATUS_CLASSES: Record<CategoryStatus, string> = {
  approved: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-amber-100 text-amber-800',
  rejected: 'bg-zinc-200 text-zinc-700',
};

export function ProblemStatusBadge({ status }: { status: ProblemStatus }) {
  return (
    <Badge variant="secondary" className={cn(PROBLEM_STATUS_CLASSES[status])}>
      {PROBLEM_STATUS_LABELS[status]}
    </Badge>
  );
}

export function CategoryStatusBadge({ status }: { status: CategoryStatus }) {
  return (
    <Badge variant="secondary" className={cn(CATEGORY_STATUS_CLASSES[status])}>
      {CATEGORY_STATUS_LABELS[status]}
    </Badge>
  );
}

export function ObservableBadge({ isObservable }: { isObservable: boolean }) {
  return isObservable ? (
    <Badge variant="outline">Występuje</Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground line-through">
      Nie występuje
    </Badge>
  );
}
