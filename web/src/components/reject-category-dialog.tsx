import { useState } from 'react';
import { toast } from 'sonner';

import { useCategories, useRejectCategory } from '@/api/categories';
import { CategoryIcon } from '@/components/shared/category-icon';
import { LabeledField } from '@/components/shared/labeled-input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Category } from '@/types/api';

const NONE = 'none';

interface RejectCategoryDialogProps {
  category: Category | null;
  onOpenChange: (open: boolean) => void;
}

export function RejectCategoryDialog({ category, onOpenChange }: RejectCategoryDialogProps) {
  const [target, setTarget] = useState(NONE);
  const { data: approved = [] } = useCategories('approved');
  const rejectCategory = useRejectCategory();

  const handleReject = () => {
    if (!category) return;
    rejectCategory.mutate(
      {
        id: category.id,
        data: { reassign_to_category_id: target === NONE ? null : target },
      },
      {
        onSuccess: () => {
          toast.success('Odrzucono propozycję kategorii');
          setTarget(NONE);
          onOpenChange(false);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <Dialog open={category !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Odrzuć „{category?.name}”</DialogTitle>
          <DialogDescription>
            Zgłoszenia w tej kategorii ({category?.problems_count ?? 0}) możesz przenieść do
            istniejącej kategorii. W przeciwnym razie zostaną oznaczone jako odrzucone.
          </DialogDescription>
        </DialogHeader>
        <LabeledField label="Przenieś zgłoszenia do">
          {(id) => (
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger id={id} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Nie przenoś — odrzuć zgłoszenia</SelectItem>
                {approved.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <CategoryIcon icon={c.icon} />
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </LabeledField>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button variant="destructive" onClick={handleReject} disabled={rejectCategory.isPending}>
            Odrzuć
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
