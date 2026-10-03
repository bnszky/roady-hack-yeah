import {
  BarricadeIcon,
  CarIcon,
  ElevatorIcon,
  FootprintsIcon,
  LightbulbFilamentIcon,
  type Icon,
  type IconProps,
  RoadHorizonIcon,
  SignpostIcon,
  SnowflakeIcon,
  SpeakerSimpleXIcon,
  TrafficConeIcon,
  TrashIcon,
  TreeEvergreenIcon,
  DropIcon,
  WarningCircleIcon,
  WarningIcon,
  WheelchairIcon,
} from 'phosphor-react-native';
import { createElement } from 'react';

// Backend categories carry Lucide icon names (shared with the web admin).
// Keep in sync with SUGGESTED_ICONS in backend/app/services/assistant_service.py.
const CATEGORY_ICONS: Record<string, Icon> = {
  'arrow-up-down': ElevatorIcon,
  construction: RoadHorizonIcon,
  'volume-x': SpeakerSimpleXIcon,
  footprints: FootprintsIcon,
  'triangle-alert': WarningIcon,
  accessibility: WheelchairIcon,
  ban: BarricadeIcon,
  'traffic-cone': TrafficConeIcon,
  'lightbulb-off': LightbulbFilamentIcon,
  signpost: SignpostIcon,
  car: CarIcon,
  'trash-2': TrashIcon,
  droplets: DropIcon,
  snowflake: SnowflakeIcon,
  'tree-pine': TreeEvergreenIcon,
  'circle-alert': WarningCircleIcon,
};

export function categoryIcon(name: string | null | undefined): Icon {
  return (name && CATEGORY_ICONS[name]) || WarningCircleIcon;
}

/** Renders the Phosphor icon for a backend (Lucide) icon name. */
export function CategoryIcon({ name, ...props }: IconProps & { name: string | null | undefined }) {
  return createElement(categoryIcon(name), props);
}
