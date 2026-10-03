import { formatImportance, importanceColor } from '@/lib/format';
import { cn } from '@/lib/utils';

interface ImportanceIndicatorProps {
  value: number | null;
  className?: string;
}

export function ImportanceIndicator({ value, className }: ImportanceIndicatorProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 tabular-nums', className)}>
      <span
        className="size-2.5 rounded-full"
        style={{ backgroundColor: importanceColor(value) }}
        aria-hidden
      />
      {formatImportance(value)}
      {value !== null && <span className="text-muted-foreground">/ 5</span>}
    </span>
  );
}
