import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { useProblems } from '@/api/problems';
import { ProblemFiltersBar } from '@/components/problem-filters';
import { CategoryIcon } from '@/components/shared/category-icon';
import { ImportanceIndicator } from '@/components/shared/importance-indicator';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState, ErrorState } from '@/components/shared/query-state';
import { ObservableBadge, ProblemStatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ProblemFilters, ProblemSortField, SortOrder } from '@/types/api';

const PAGE_SIZE = 25;

interface SortableHeadProps {
  field: ProblemSortField;
  label: string;
  sortBy: ProblemSortField;
  order: SortOrder;
  onSort: (field: ProblemSortField) => void;
  className?: string;
}

function SortableHead({ field, label, sortBy, order, onSort, className }: SortableHeadProps) {
  const active = sortBy === field;
  const Icon = !active ? ArrowUpDown : order === 'desc' ? ArrowDown : ArrowUp;
  return (
    <TableHead
      className={className}
      aria-sort={active ? (order === 'desc' ? 'descending' : 'ascending') : 'none'}
    >
      <Button
        variant="ghost"
        size="sm"
        className={cn('-ml-2.5', active && 'text-foreground')}
        onClick={() => onSort(field)}
      >
        {label}
        <Icon data-icon="inline-end" className={cn(!active && 'opacity-40')} />
      </Button>
    </TableHead>
  );
}

export function ProblemsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ProblemFilters>({});
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<ProblemSortField>('confirmations_count');
  const [order, setOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(0);

  const { data, error, isLoading, refetch } = useProblems({
    ...filters,
    q: search.trim() || undefined,
    sort_by: sortBy,
    order,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const handleSort = (field: ProblemSortField) => {
    if (field === sortBy) {
      setOrder(order === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setOrder('desc');
    }
    setPage(0);
  };

  const handleFilters = (value: ProblemFilters) => {
    setFilters(value);
    setPage(0);
  };

  const pageCount = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
  const sortProps = { sortBy, order, onSort: handleSort };

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader
        title="Zgłoszenia"
        description="Lista problemów — sortuj po liczbie potwierdzeń lub poziomie uciążliwości."
      />

      <div className="grid gap-3">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Szukaj w opisie…"
            className="pl-8"
            aria-label="Szukaj w opisie"
          />
        </div>
        <ProblemFiltersBar value={filters} onChange={handleFilters} />
      </div>

      {error ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (
        <div className="rounded-xl bg-card ring-1 ring-foreground/10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Kategoria</TableHead>
                <TableHead>Opis</TableHead>
                <TableHead>Status</TableHead>
                <SortableHead field="confirmations_count" label="Potwierdzenia" {...sortProps} />
                <TableHead>Zaprzeczenia</TableHead>
                <SortableHead field="importance_level_average" label="Uciążliwość" {...sortProps} />
                <SortableHead field="last_reported_at" label="Ostatnie zgłoszenie" {...sortProps} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 6 }, (_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className="px-4">
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {data?.items.map((problem) => (
                <TableRow
                  key={problem.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/problems/${problem.id}`)}
                >
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-2 font-medium">
                      <CategoryIcon
                        icon={problem.category.icon}
                        className="text-muted-foreground"
                      />
                      {problem.category.name}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-72">
                    <span className="line-clamp-1 text-muted-foreground">
                      {problem.description ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <ProblemStatusBadge status={problem.status} />
                      {!problem.is_observable && <ObservableBadge isObservable={false} />}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium tabular-nums">
                    {problem.confirmations_count}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {problem.denials_count}
                  </TableCell>
                  <TableCell>
                    <ImportanceIndicator value={problem.importance_level_average} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(problem.last_reported_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data && data.items.length === 0 && (
            <div className="p-4">
              <EmptyState message="Brak zgłoszeń spełniających filtry." />
            </div>
          )}
          <div className="flex items-center justify-between gap-2 border-t px-4 py-3 text-sm text-muted-foreground">
            <span>{data ? `${data.total} problemów` : '\u00a0'}</span>
            <div className="flex items-center gap-2">
              <span>
                Strona {page + 1} z {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                Poprzednia
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= pageCount}
                onClick={() => setPage(page + 1)}
              >
                Następna
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
