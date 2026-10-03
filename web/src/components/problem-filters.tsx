import { ChevronDown, X } from 'lucide-react';

import { useCategories } from '@/api/categories';
import { CategoryIcon } from '@/components/shared/category-icon';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { PROBLEM_STATUS_LABELS } from '@/lib/format';
import type { ProblemFilters, ProblemStatus } from '@/types/api';

const STATUSES = Object.keys(PROBLEM_STATUS_LABELS) as ProblemStatus[];
const ANY = 'any';

function toggle<T>(list: T[] | undefined, item: T): T[] | undefined {
  const next = list?.includes(item) ? list.filter((x) => x !== item) : [...(list ?? []), item];
  return next.length ? next : undefined;
}

interface ProblemFiltersBarProps {
  value: ProblemFilters;
  onChange: (value: ProblemFilters) => void;
}

export function ProblemFiltersBar({ value, onChange }: ProblemFiltersBarProps) {
  const { data: categories = [] } = useCategories();
  const selectable = categories.filter((c) => c.status !== 'rejected');
  const set = (patch: Partial<ProblemFilters>) => onChange({ ...value, ...patch });

  const categoryLabel = value.category_ids?.length
    ? `Kategorie (${value.category_ids.length})`
    : 'Wszystkie kategorie';
  const statusLabel = value.statuses?.length
    ? value.statuses.map((s) => PROBLEM_STATUS_LABELS[s]).join(', ')
    : 'Wszystkie statusy';
  const hasFilters = Object.values(value).some((v) => v !== undefined && v !== false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            {categoryLabel}
            <ChevronDown data-icon="inline-end" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          {selectable.map((category) => (
            <DropdownMenuCheckboxItem
              key={category.id}
              checked={value.category_ids?.includes(category.id) ?? false}
              onCheckedChange={() => set({ category_ids: toggle(value.category_ids, category.id) })}
              onSelect={(event) => event.preventDefault()}
            >
              <CategoryIcon icon={category.icon} />
              {category.name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="max-w-56">
            <span className="truncate">{statusLabel}</span>
            <ChevronDown data-icon="inline-end" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {STATUSES.map((status) => (
            <DropdownMenuCheckboxItem
              key={status}
              checked={value.statuses?.includes(status) ?? false}
              onCheckedChange={() => set({ statuses: toggle(value.statuses, status) })}
              onSelect={(event) => event.preventDefault()}
            >
              {PROBLEM_STATUS_LABELS[status]}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Select
        value={value.is_observable === undefined ? ANY : String(value.is_observable)}
        onValueChange={(v) => set({ is_observable: v === ANY ? undefined : v === 'true' })}
      >
        <SelectTrigger aria-label="Czy występuje">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Występujące i nie</SelectItem>
          <SelectItem value="true">Tylko występujące</SelectItem>
          <SelectItem value="false">Już nie występują</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={value.min_confirmations === undefined ? ANY : String(value.min_confirmations)}
        onValueChange={(v) => set({ min_confirmations: v === ANY ? undefined : Number(v) })}
      >
        <SelectTrigger aria-label="Minimalna liczba potwierdzeń">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Dowolna liczba potwierdzeń</SelectItem>
          {[2, 5, 10].map((n) => (
            <SelectItem key={n} value={String(n)}>
              ≥ {n} potwierdzeń
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.min_importance === undefined ? ANY : String(value.min_importance)}
        onValueChange={(v) => set({ min_importance: v === ANY ? undefined : Number(v) })}
      >
        <SelectTrigger aria-label="Minimalna uciążliwość">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Dowolna uciążliwość</SelectItem>
          {[2, 3, 4].map((n) => (
            <SelectItem key={n} value={String(n)}>
              Uciążliwość ≥ {n}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2 px-1">
        <Switch
          id="include-pending"
          checked={value.include_pending_categories ?? false}
          onCheckedChange={(checked) => set({ include_pending_categories: checked || undefined })}
        />
        <Label htmlFor="include-pending" className="text-sm font-normal">
          Niezatwierdzone kategorie
        </Label>
      </div>

      {hasFilters && (
        <Button variant="ghost" onClick={() => onChange({})}>
          <X data-icon="inline-start" />
          Wyczyść
        </Button>
      )}
    </div>
  );
}
