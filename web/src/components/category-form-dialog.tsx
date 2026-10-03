import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { useCreateCategory, useUpdateCategory } from '@/api/categories';
import { CategoryIcon } from '@/components/shared/category-icon';
import { LabeledField, LabeledInput } from '@/components/shared/labeled-input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { CATEGORY_ICON_NAMES } from '@/lib/category-icons';
import { cn } from '@/lib/utils';
import type { Category, CategoryCreate } from '@/types/api';

const EMPTY: CategoryCreate = {
  name: '',
  icon: 'circle-alert',
  description: null,
  is_importance_level_required: false,
};

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
}

export function CategoryFormDialog({ open, onOpenChange, category }: CategoryFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open && (
          <CategoryForm
            key={category?.id ?? 'new'}
            category={category}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CategoryForm({ category, onDone }: { category?: Category | null; onDone: () => void }) {
  const [form, setForm] = useState<CategoryCreate>(
    category
      ? {
          name: category.name,
          icon: category.icon,
          description: category.description,
          is_importance_level_required: category.is_importance_level_required,
        }
      : EMPTY,
  );
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const isPending = createCategory.isPending || updateCategory.isPending;
  const nameError = form.name.trim().length > 0 && form.name.trim().length < 2;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const data = { ...form, name: form.name.trim(), description: form.description?.trim() || null };
    const options = {
      onSuccess: () => {
        toast.success(category ? 'Zapisano kategorię' : 'Dodano kategorię');
        onDone();
      },
      onError: (error: Error) => toast.error(error.message),
    };
    if (category) {
      updateCategory.mutate({ id: category.id, data }, options);
    } else {
      createCategory.mutate(data, options);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{category ? 'Edytuj kategorię' : 'Nowa kategoria'}</DialogTitle>
        <DialogDescription>
          Kategorie dodane przez administratora są od razu widoczne w aplikacji.
        </DialogDescription>
      </DialogHeader>

      <LabeledInput
        label="Nazwa"
        required
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="np. Zepsuta winda"
        error={nameError ? 'Nazwa musi mieć co najmniej 2 znaki' : undefined}
      />

      <LabeledField label="Opis">
        {(id) => (
          <Textarea
            id={id}
            value={form.description ?? ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Krótki opis, pomaga asystentowi dopasować zgłoszenie"
          />
        )}
      </LabeledField>

      <div className="grid gap-1.5">
        <Label>Ikona</Label>
        <div className="grid grid-cols-8 gap-1.5">
          {CATEGORY_ICON_NAMES.map((icon) => (
            <Button
              key={icon}
              type="button"
              variant={form.icon === icon ? 'default' : 'outline'}
              size="icon"
              aria-label={icon}
              aria-pressed={form.icon === icon}
              onClick={() => setForm({ ...form, icon })}
              className={cn(form.icon === icon && 'ring-2 ring-ring/50')}
            >
              <CategoryIcon icon={icon} />
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
        <div className="grid gap-1">
          <Label htmlFor="importance-required">Pytaj o uciążliwość (1–5)</Label>
          <p className="text-xs text-muted-foreground">
            Włącz, gdy problem może być mniej lub bardziej poważny (np. nierówna nawierzchnia).
            Wyłącz dla stanów zero-jedynkowych (np. zepsuta winda).
          </p>
        </div>
        <Switch
          id="importance-required"
          checked={form.is_importance_level_required}
          onCheckedChange={(checked) => setForm({ ...form, is_importance_level_required: checked })}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Anuluj
        </Button>
        <Button type="submit" disabled={isPending || form.name.trim().length < 2}>
          {category ? 'Zapisz' : 'Dodaj'}
        </Button>
      </DialogFooter>
    </form>
  );
}
