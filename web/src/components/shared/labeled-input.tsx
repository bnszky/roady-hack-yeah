import { useId, type ComponentProps, type ReactNode } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface LabeledFieldProps {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: (id: string) => ReactNode;
}

/** Label + any control + hint/error. The render prop receives the generated control id. */
export function LabeledField({ label, hint, error, className, children }: LabeledFieldProps) {
  const id = useId();
  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      {children(id)}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

type LabeledInputProps = ComponentProps<typeof Input> & {
  label: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
};

export function LabeledInput({
  label,
  hint,
  error,
  containerClassName,
  className,
  ...props
}: LabeledInputProps) {
  return (
    <LabeledField label={label} hint={hint} error={error} className={containerClassName}>
      {(id) => <Input id={id} aria-invalid={Boolean(error)} className={cn(className)} {...props} />}
    </LabeledField>
  );
}
