import { CheckCircle2, ClipboardList, MapPin, Tags } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

import { useProblems } from '@/api/problems';
import { useStatsSummary } from '@/api/stats';
import { ProblemFiltersBar } from '@/components/problem-filters';
import { MapLegend, ProblemsMap } from '@/components/problems-map';
import { CategoryIcon } from '@/components/shared/category-icon';
import { PageHeader } from '@/components/shared/page-header';
import { ErrorState } from '@/components/shared/query-state';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PROBLEM_STATUS_LABELS } from '@/lib/format';
import type { ProblemFilters, ProblemStatus } from '@/types/api';

const MAP_LIMIT = 1000;

export function DashboardPage() {
  const [filters, setFilters] = useState<ProblemFilters>({ is_observable: true });
  const stats = useStatsSummary();
  const problems = useProblems({ ...filters, limit: MAP_LIMIT, sort_by: 'last_reported_at' });

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader
        title="Mapa zgłoszeń"
        description="Gdzie zgłaszane są problemy, ile mają potwierdzeń i jak są uciążliwe."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Wszystkie problemy"
          value={stats.data?.problems_total}
          icon={MapPin}
          isLoading={stats.isLoading}
        />
        <StatCard
          label="Nadal występujące"
          value={stats.data?.problems_observable}
          icon={CheckCircle2}
          isLoading={stats.isLoading}
        />
        <StatCard
          label="Zgłoszenia z 7 dni"
          value={stats.data?.reports_last_7_days}
          hint={stats.data && `${stats.data.reports_total} łącznie`}
          icon={ClipboardList}
          isLoading={stats.isLoading}
        />
        <StatCard
          label="Kategorie do zatwierdzenia"
          value={stats.data?.pending_categories}
          hint={<Link to="/categories">Przejdź do kategorii →</Link>}
          icon={Tags}
          isLoading={stats.isLoading}
        />
      </div>

      <ProblemFiltersBar value={filters} onChange={setFilters} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-2">
          {problems.error ? (
            <ErrorState error={problems.error} onRetry={() => void problems.refetch()} />
          ) : (
            <ProblemsMap problems={problems.data?.items ?? []} className="h-[560px]" />
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <MapLegend />
            {problems.data && (
              <span className="text-xs text-muted-foreground">
                Na mapie: {problems.data.items.length}
                {problems.data.total > problems.data.items.length && ` z ${problems.data.total}`}
              </span>
            )}
          </div>
        </div>

        <div className="grid content-start gap-4">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Najczęstsze kategorie</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {stats.data?.top_categories.length === 0 && (
                <p className="text-sm text-muted-foreground">Brak zgłoszeń.</p>
              )}
              {stats.data?.top_categories.map((c) => (
                <div key={c.category_id} className="flex items-center gap-2 text-sm">
                  <CategoryIcon icon={c.icon} className="text-muted-foreground" />
                  <span className="truncate">{c.name}</span>
                  <span className="ml-auto font-medium tabular-nums">{c.problems_count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>Statusy</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              {stats.data &&
                (Object.entries(stats.data.problems_by_status) as [ProblemStatus, number][]).map(
                  ([status, count]) => (
                    <div key={status} className="flex items-center text-sm">
                      <span>{PROBLEM_STATUS_LABELS[status]}</span>
                      <span className="ml-auto font-medium tabular-nums">{count}</span>
                    </div>
                  ),
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
