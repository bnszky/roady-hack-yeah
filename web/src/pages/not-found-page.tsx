import { Link } from 'react-router';

import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="grid place-items-center gap-3 py-24 text-center">
      <h1 className="font-heading text-2xl font-semibold">Nie znaleziono strony</h1>
      <Button asChild variant="outline">
        <Link to="/">Wróć do mapy</Link>
      </Button>
    </div>
  );
}
