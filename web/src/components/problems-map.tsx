import 'leaflet/dist/leaflet.css';

import { latLngBounds } from 'leaflet';
import { useEffect, useRef } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import { Link } from 'react-router';

import { CategoryIcon } from '@/components/shared/category-icon';
import { ImportanceIndicator } from '@/components/shared/importance-indicator';
import { ProblemStatusBadge } from '@/components/shared/status-badge';
import { importanceColor } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Problem } from '@/types/api';

const KRAKOW_CENTER: [number, number] = [50.0614, 19.9366];

function markerRadius(confirmations: number): number {
  return 6 + Math.min(confirmations, 20) * 0.6;
}

function InvalidateOnResize() {
  const map = useMap();

  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  return null;
}

function FitToProblems({ problems }: { problems: Problem[] }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (fitted.current || problems.length === 0) return;
    fitted.current = true;
    map.invalidateSize();
    if (problems.length === 1) {
      map.setView([problems[0].latitude, problems[0].longitude], 17);
      return;
    }
    const bounds = latLngBounds(problems.map((p) => [p.latitude, p.longitude]));
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 17 });
  }, [map, problems]);

  return null;
}

interface ProblemsMapProps {
  problems: Problem[];
  className?: string;
  showPopups?: boolean;
}

export function ProblemsMap({ problems, className, showPopups = true }: ProblemsMapProps) {
  return (
    <div className={cn('isolate overflow-hidden rounded-xl ring-1 ring-foreground/10', className)}>
      <MapContainer center={KRAKOW_CENTER} zoom={13} className="size-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <InvalidateOnResize />
        <FitToProblems problems={problems} />
        {problems.map((problem) => {
          const color = importanceColor(problem.importance_level_average);
          return (
            <CircleMarker
              key={problem.id}
              center={[problem.latitude, problem.longitude]}
              radius={markerRadius(problem.confirmations_count)}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: problem.is_observable ? 0.55 : 0.15,
                weight: 2,
                dashArray: problem.is_observable ? undefined : '4 4',
              }}
            >
              {showPopups && (
                <Popup>
                  <div className="grid min-w-52 gap-2 text-sm">
                    <div className="flex items-center gap-2 font-medium">
                      <CategoryIcon icon={problem.category.icon} />
                      {problem.category.name}
                    </div>
                    {problem.description && (
                      <p className="m-0! line-clamp-3 text-muted-foreground">
                        {problem.description}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      <span className="text-muted-foreground">Potwierdzenia</span>
                      <span className="font-medium tabular-nums">
                        {problem.confirmations_count}
                      </span>
                      <span className="text-muted-foreground">Zaprzeczenia</span>
                      <span className="font-medium tabular-nums">{problem.denials_count}</span>
                      <span className="text-muted-foreground">Uciążliwość</span>
                      <ImportanceIndicator value={problem.importance_level_average} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <ProblemStatusBadge status={problem.status} />
                      <Link to={`/problems/${problem.id}`} className="text-xs font-medium">
                        Szczegóły →
                      </Link>
                    </div>
                  </div>
                </Popup>
              )}
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export function MapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span>Uciążliwość:</span>
      {[1, 2, 3, 4, 5].map((level) => (
        <span key={level} className="inline-flex items-center gap-1">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: importanceColor(level) }}
          />
          {level}
        </span>
      ))}
      <span className="inline-flex items-center gap-1">
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: importanceColor(null) }}
        />
        bez skali
      </span>
      <span>· Wielkość = liczba potwierdzeń · Przerywana linia = już nie występuje</span>
    </div>
  );
}
