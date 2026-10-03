import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { useApproveCategory, useCategories, useDeleteCategory } from '@/api/categories';
import { CategoryFormDialog } from '@/components/category-form-dialog';
import { RejectCategoryDialog } from '@/components/reject-category-dialog';
import { CategoryIcon } from '@/components/shared/category-icon';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState, ErrorState } from '@/components/shared/query-state';
import { CategoryStatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDateTime } from '@/lib/format';
import type { Category } from '@/types/api';

export function CategoriesPage() {
  const { data: categories, error, isLoading, refetch } = useCategories();
  const approveCategory = useApproveCategory();
  const deleteCategory = useDeleteCategory();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [rejecting, setRejecting] = useState<Category | null>(null);

  const pending = categories?.filter((c) => c.status === 'pending') ?? [];
  const others = categories?.filter((c) => c.status !== 'pending') ?? [];

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setFormOpen(true);
  };

  const handleApprove = (category: Category) =>
    approveCategory.mutate(category.id, {
      onSuccess: () => toast.success(`Zatwierdzono „${category.name}”`),
      onError: (err) => toast.error(err.message),
    });

  const handleDelete = (category: Category) =>
    deleteCategory.mutate(category.id, {
      onSuccess: () => toast.success(`Usunięto „${category.name}”`),
      onError: (err) => toast.error(err.message),
    });

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader
        title="Kategorie problemów"
        description="Zarządzaj kategoriami i zatwierdzaj propozycje zgłoszone przez użytkowników."
        actions={
          <Button onClick={openCreate}>
            <Plus data-icon="inline-start" />
            Dodaj kategorię
          </Button>
        }
      />

      {error && <ErrorState error={error} onRetry={() => void refetch()} />}

      {pending.length > 0 && (
        <Card className="ring-amber-300">
          <CardHeader>
            <CardTitle>Propozycje użytkowników ({pending.length})</CardTitle>
            <CardDescription>
              Użytkownik nie znalazł pasującej kategorii i zaproponował nową. Zatwierdź, edytuj lub
              odrzuć.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {pending.map((category) => (
              <div
                key={category.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
              >
                <CategoryIcon icon={category.icon} className="size-5 text-muted-foreground" />
                <div className="grid min-w-0 flex-1 gap-0.5">
                  <span className="font-medium">{category.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {category.description ?? 'Brak opisu'} · zgłoszeń: {category.problems_count} ·{' '}
                    {formatDateTime(category.created_at)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" onClick={() => openEdit(category)}>
                    <Pencil data-icon="inline-start" />
                    Edytuj
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setRejecting(category)}>
                    <X data-icon="inline-start" />
                    Odrzuć
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(category)}
                    disabled={approveCategory.isPending}
                  >
                    <Check data-icon="inline-start" />
                    Zatwierdź
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="rounded-xl bg-card ring-1 ring-foreground/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Nazwa</TableHead>
              <TableHead>Opis</TableHead>
              <TableHead>Skala 1–5</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Problemy</TableHead>
              <TableHead className="pr-4 text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 4 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="px-4">
                    <Skeleton className="h-6 w-full" />
                  </TableCell>
                </TableRow>
              ))}
            {others.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="pl-4">
                  <div className="flex items-center gap-2 font-medium">
                    <CategoryIcon icon={category.icon} className="text-muted-foreground" />
                    {category.name}
                  </div>
                </TableCell>
                <TableCell className="max-w-80">
                  <span className="line-clamp-1 text-muted-foreground">
                    {category.description ?? '—'}
                  </span>
                </TableCell>
                <TableCell>
                  {category.is_importance_level_required ? (
                    <Badge variant="outline">Pyta o uciążliwość</Badge>
                  ) : (
                    <span className="text-muted-foreground">Nie</span>
                  )}
                </TableCell>
                <TableCell>
                  <CategoryStatusBadge status={category.status} />
                </TableCell>
                <TableCell className="tabular-nums">{category.problems_count}</TableCell>
                <TableCell className="pr-4">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edytuj"
                      onClick={() => openEdit(category)}
                    >
                      <Pencil />
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Usuń"
                            disabled={category.problems_count > 0 || deleteCategory.isPending}
                            onClick={() => handleDelete(category)}
                          >
                            <Trash2 />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {category.problems_count > 0
                          ? 'Nie można usunąć kategorii z przypisanymi problemami'
                          : 'Usuń kategorię'}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {categories && others.length === 0 && (
          <div className="p-4">
            <EmptyState message="Brak kategorii. Dodaj pierwszą kategorię." />
          </div>
        )}
      </div>

      <CategoryFormDialog open={formOpen} onOpenChange={setFormOpen} category={editing} />
      <RejectCategoryDialog
        category={rejecting}
        onOpenChange={(open) => !open && setRejecting(null)}
      />
    </div>
  );
}
