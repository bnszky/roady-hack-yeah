import { LayoutDashboard, List, MapPinned, Tags } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';

import { useStatsSummary } from '@/api/stats';
import { Badge } from '@/components/ui/badge';
import { APP_NAME } from '@/lib/format';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', label: 'Mapa', icon: LayoutDashboard, end: true },
  { to: '/problems', label: 'Zgłoszenia', icon: List, end: false },
  { to: '/categories', label: 'Kategorie', icon: Tags, end: false },
];

export function AppLayout() {
  const { data: stats } = useStatsSummary();
  const pending = stats?.pending_categories ?? 0;

  return (
    <div className="flex min-h-svh bg-muted/40">
      <aside className="sticky top-0 flex h-svh w-60 shrink-0 flex-col gap-6 border-r bg-sidebar px-3 py-5">
        <div className="flex items-center gap-2 px-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MapPinned className="size-4" aria-hidden />
          </div>
          <div className="grid leading-tight">
            <span className="font-heading font-semibold">{APP_NAME}</span>
            <span className="text-xs text-muted-foreground">Panel administracji</span>
          </div>
        </div>
        <nav className="grid gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
                )
              }
            >
              <Icon className="size-4" aria-hidden />
              {label}
              {to === '/categories' && pending > 0 && (
                <Badge className="ml-auto bg-amber-500 text-white">{pending}</Badge>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
