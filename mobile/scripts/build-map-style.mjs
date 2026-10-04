// Builds src/components/roady/map-style.json: Mapbox "light-v11" recolored to the
// Roady design v2 palette (see src/constants/theme.ts) with Montserrat labels.
//
// Usage (from mobile/): node scripts/build-map-style.mjs && npx prettier --write src/components/roady/map-style.json
// Reads EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN from .env.local to download the base style.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const token = readFileSync(join(root, '.env.local'), 'utf8').match(
  /^EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=(.+)$/m,
)?.[1];
if (!token) throw new Error('EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN missing in mobile/.env.local');

const res = await fetch(`https://api.mapbox.com/styles/v1/mapbox/light-v11?access_token=${token}`);
if (!res.ok) throw new Error(`Base style download failed: ${res.status}`);
const style = await res.json();

// Design v2 palette (keep in sync with src/constants/theme.ts).
const C = {
  ground: '#F8F8F8',
  white: '#FFFFFF',
  green: '#E6F5EF', // parks, landuse: a whisper of the turquoise accent
  water: '#CBEDE4', // accent-200 family
  waterLabel: '#087F6B', // accent-700
  building: '#EEEEEE',
  buildingOutline: '#DEDEDE',
  casing: '#E6E6E6',
  tunnel: '#DEDEDE',
  rail: '#C4C4C4',
  boundary: '#AAAAAA',
  boundaryBg: '#DEDEDE',
  labelStrong: '#454545',
  label: '#5F5F5F',
  labelSoft: '#8A8A8A',
  halo: '#FFFFFF',
};

/** layer id (exact or prefix*) -> paint overrides */
const PAINT = {
  land: { 'background-color': C.ground },
  'land-structure-polygon': { 'fill-color': C.ground },
  'land-structure-line': { 'line-color': C.ground },
  'national-park': { 'fill-color': C.green },
  landuse: { 'fill-color': C.green },
  water: { 'fill-color': C.water },
  waterway: { 'line-color': C.water },
  'aeroway-polygon': { 'fill-color': C.white },
  'aeroway-line': { 'line-color': C.white },
  building: { 'fill-color': C.building, 'fill-outline-color': C.buildingOutline },
  'tunnel-*': { 'line-color': C.tunnel },
  'road-rail': { 'line-color': C.rail },
  'bridge-rail': { 'line-color': C.rail },
  'bridge-case-simple': { 'line-color': C.casing },
  'road-*': { 'line-color': C.white },
  'bridge-*': { 'line-color': C.white },
  'admin-*-bg': { 'line-color': C.boundaryBg },
  'admin-*': { 'line-color': C.boundary },
  'road-label-simple': { 'text-color': C.label, 'text-halo-color': C.halo },
  'water*-label': { 'text-color': C.waterLabel, 'text-halo-color': 'rgba(255,255,255,0.6)' },
  'waterway-label': { 'text-color': C.waterLabel, 'text-halo-color': 'rgba(255,255,255,0.6)' },
  'natural-*-label': { 'text-color': C.labelSoft, 'text-halo-color': C.halo },
  'poi-label': { 'text-color': C.labelSoft, 'text-halo-color': C.halo },
  'settlement-subdivision-label': { 'text-color': C.labelSoft, 'text-halo-color': C.halo },
  'settlement-*-label': {
    'text-color': ['step', ['get', 'symbolrank'], C.labelStrong, 11, C.label, 16, C.labelSoft],
    'text-halo-color': C.halo,
  },
  '*-label': { 'text-color': C.label, 'text-halo-color': C.halo },
};

const FONT = {
  'DIN Pro Regular': 'Montserrat Regular',
  'DIN Pro Medium': 'Montserrat Medium',
  'DIN Pro Bold': 'Montserrat SemiBold',
  'DIN Pro Italic': 'Montserrat Italic',
};

const matches = (pattern, id) =>
  new RegExp(`^${pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`).test(id);

// The first matching rule wins, so exact ids are listed before wildcards.
const rules = Object.entries(PAINT).sort(([a], [b]) => a.includes('*') - b.includes('*'));

for (const layer of style.layers) {
  const rule = rules.find(([pattern]) => matches(pattern, layer.id));
  if (rule) layer.paint = { ...layer.paint, ...rule[1] };

  const font = layer.layout?.['text-font'];
  if (Array.isArray(font)) {
    layer.layout['text-font'] = font.map((f) => FONT[f] ?? f);
  }
}

style.name = 'Roady v2';
const out = join(root, 'src/components/roady/map-style.json');
writeFileSync(out, `${JSON.stringify(style, null, 2)}\n`);
console.log(`Wrote ${out} (${style.layers.length} layers)`);
