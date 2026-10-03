import { ArrowLeft, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';

import { useDeleteProblem, useProblem, useUpdateProblem } from '@/api/problems';
import { ProblemsMap } from '@/components/problems-map';
import { CategoryIcon } from '@/components/shared/category-icon';
import { ImportanceIndicator } from '@/components/shared/importance-indicator';
import { LabeledField } from '@/components/shared/labeled-input';
import { PageHeader } from '@/components/shared/page-header';
import { ErrorState } from '@/components/shared/query-state';
import { ObservableBadge, ProblemStatusBadge } from '@/components/shared/status-badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime, PROBLEM_STATUS_LABELS, REPORT_SOURCE_LABELS } from '@/lib/format';
import type { ProblemDetail, ProblemStatus } from '@/types/api';

const STATUSES = Object.keys(PROBLEM_STATUS_LABELS) as ProblemStatus[];

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function StatusForm({ problem }: { problem: ProblemDetail }) {
  const [status, setStatus] = useState<ProblemStatus>(problem.status);
  const [note, setNote] = useState(problem.status_note ?? '');
  const updateProblem = useUpdateProblem(problem.id);
  const dirty = status !== problem.status || note !== (problem.status_note ?? '');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    updateProblem.mutate(
      { status, status_note: note.trim() || null },
      {
        onSuccess: () => toast.success('Zapisano status'),
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <LabeledField label="Status">
        {(id) => (
          <Select value={status} onValueChange={(v) => setStatus(v as ProblemStatus)}>
            <SelectTrigger id={id} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {PROBLEM_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </LabeledField>
      <LabeledField label="Notatka do statusu" hint="Co dokładnie dzieje się ze zgłoszeniem">
        {(id) => (
          <Textarea
            id={id}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="np. Przekazano do ZDMK, naprawa zaplanowana na przyszły tydzień"
          />
        )}
      </LabeledField>
      <Button
        type="submit"
        disabled={!dirty || updateProblem.isPending}
        className="justify-self-end"
      >
        Zapisz status
      </Button>
    </form>
  );
}

export function ProblemDetailPage() {
  const { problemId = '' } = useParams();
  const navigate = useNavigate();
  const { data: problem, error, isLoading, refetch } = useProblem(problemId);
  const deleteProblem = useDeleteProblem();

  const handleDelete = () => {
    deleteProblem.mutate(problemId, {
      onSuccess: () => {
        toast.success('Usunięto problem');
        navigate('/problems');
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const backLink = (
    <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
      <Link to="/problems">
        <ArrowLeft data-icon="inline-start" />
        Zgłoszenia
      </Link>
    </Button>
  );

  if (error) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {backLink}
        <ErrorState error={error} onRetry={() => void refetch()} />
      </div>
    );
  }

  if (isLoading || !problem) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {backLink}
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="grid gap-2">
        {backLink}
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <CategoryIcon icon={problem.category.icon} className="size-6" />
              {problem.category.name}
            </span>
          }
          description={
            <span className="flex flex-wrap items-center gap-2">
              <ProblemStatusBadge status={problem.status} />
              <ObservableBadge isObservable={problem.is_observable} />
              {problem.category.status === 'pending' && (
                <Badge variant="outline">Kategoria oczekuje na zatwierdzenie</Badge>
              )}
              <span>Pierwsze zgłoszenie: {formatDateTime(problem.first_reported_at)}</span>
            </span>
          }
          actions={
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 data-icon="inline-start" />
                  Usuń
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Usunąć problem?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Zostaną usunięte także wszystkie zgłoszenia i potwierdzenia (
                    {problem.reports_count}). Tej operacji nie można cofnąć.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={handleDelete}>
                    Usuń
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid content-start gap-4">
          <Card>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Metric label="Potwierdzenia" value={problem.confirmations_count} />
                <Metric label="Zaprzeczenia" value={problem.denials_count} />
                <Metric
                  label="Średnia uciążliwość"
                  value={
                    problem.category.is_importance_level_required ? (
                      <ImportanceIndicator value={problem.importance_level_average} />
                    ) : (
                      <span className="text-sm font-normal text-muted-foreground">nie dotyczy</span>
                    )
                  }
                />
                <Metric label="Zgłoszenia łącznie" value={problem.reports_count} />
              </div>
              <div className="grid gap-1">
                <span className="text-xs text-muted-foreground">Opis</span>
                <p className="text-sm">{problem.description ?? 'Brak opisu.'}</p>
              </div>
              {problem.consecutive_denials > 0 && (
                <p className="text-xs text-muted-foreground">
                  Ostatnie odpowiedzi „nie występuje” z rzędu: {problem.consecutive_denials}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historia zgłoszeń i potwierdzeń</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Data</TableHead>
                    <TableHead>Odpowiedź</TableHead>
                    <TableHead>Uciążliwość</TableHead>
                    <TableHead>Źródło</TableHead>
                    <TableHead>Opis / transkrypcja</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {problem.reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="pl-4 text-muted-foreground">
                        {formatDateTime(report.reported_at)}
                      </TableCell>
                      <TableCell>
                        {report.is_observable ? (
                          <Badge className="bg-emerald-100 text-emerald-800">Występuje</Badge>
                        ) : (
                          <Badge variant="secondary">Nie występuje</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {report.importance_level ? (
                          <ImportanceIndicator value={report.importance_level} />
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {REPORT_SOURCE_LABELS[report.source]}
                      </TableCell>
                      <TableCell className="max-w-64">
                        <span className="line-clamp-2 whitespace-normal text-muted-foreground">
                          {report.description ?? report.transcript ?? '—'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="grid content-start gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Obsługa zgłoszenia</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusForm key={problem.updated_at} problem={problem} />
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle>Lokalizacja</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <ProblemsMap problems={[problem]} showPopups={false} className="h-64" />
              <span className="text-xs text-muted-foreground tabular-nums">
                {problem.latitude.toFixed(6)}, {problem.longitude.toFixed(6)}
              </span>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
