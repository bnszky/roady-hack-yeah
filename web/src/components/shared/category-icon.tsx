import { CATEGORY_ICONS, FALLBACK_CATEGORY_ICON } from '@/lib/category-icons';
import { cn } from '@/lib/utils';

interface CategoryIconProps {
  icon: string;
  className?: string;
}

export function CategoryIcon({ icon, className }: CategoryIconProps) {
  const Icon = CATEGORY_ICONS[icon] ?? FALLBACK_CATEGORY_ICON;
  return <Icon className={cn('size-4', className)} aria-hidden />;
}
