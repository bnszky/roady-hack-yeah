import {
  Accessibility,
  ArrowUpDown,
  Ban,
  Car,
  CircleAlert,
  Construction,
  Droplets,
  Footprints,
  LightbulbOff,
  Signpost,
  Snowflake,
  TrafficCone,
  Trash2,
  TreePine,
  TriangleAlert,
  VolumeX,
  type LucideIcon,
} from 'lucide-react';

// Keep in sync with SUGGESTED_ICONS in backend/app/services/assistant_service.py
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'arrow-up-down': ArrowUpDown,
  construction: Construction,
  'volume-x': VolumeX,
  footprints: Footprints,
  'triangle-alert': TriangleAlert,
  accessibility: Accessibility,
  ban: Ban,
  'traffic-cone': TrafficCone,
  'lightbulb-off': LightbulbOff,
  signpost: Signpost,
  car: Car,
  'trash-2': Trash2,
  droplets: Droplets,
  snowflake: Snowflake,
  'tree-pine': TreePine,
  'circle-alert': CircleAlert,
};

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS);

export const FALLBACK_CATEGORY_ICON = CircleAlert;
