import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  hint?: ReactNode;
  isLoading?: boolean;
}

export function StatCard({ label, value, icon: Icon, hint, isLoading }: StatCardProps) {
  return (
    <Card size="sm">
      <CardContent className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          {isLoading ? (
            <Skeleton className="h-7 w-16" />
          ) : (
            <span className="text-2xl font-semibold tabular-nums">{value}</span>
          )}
          {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
        </div>
        <Icon className="size-5 text-muted-foreground" aria-hidden />
      </CardContent>
    </Card>
  );
}
