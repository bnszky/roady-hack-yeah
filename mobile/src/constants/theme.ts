/**
 * Roady design tokens, adapted from the "Broadsheet" design system (see
 * assets/design/design.html): paper ground, Source Serif 4 as the only typeface,
 * cyan as the interactive color and magenta as the severity spot.
 */

export const Colors = {
  bg: '#f3f2f2',
  surface: '#eae9e9',
  text: '#201e1d',
  divider: 'rgba(32, 30, 29, 0.16)',
  scrim: 'rgba(45, 43, 43, 0.35)',

  neutral100: '#f8f4f4',
  neutral200: '#eae7e7',
  neutral300: '#d7d3d3',
  neutral400: '#bab6b6',
  neutral500: '#9b9797',
  neutral600: '#7d7979',
  neutral700: '#605d5d',
  neutral800: '#444141',
  neutral900: '#2d2b2b',

  // The app darkens the system's cyan for contrast on touch targets.
  accent: '#006080',
  accent100: '#e9f8ff',
  accent200: '#cbeeff',
  accent300: '#99e0ff',
  accent600: '#005572',
  accent700: '#004a63',
  accent800: '#004961',

  accent2_100: '#fff1f4',
  accent2_600: '#d82071',
  accent2_700: '#aa0b56',
  accent2_800: '#790e3d',
} as const;

export type ThemeColor = keyof typeof Colors;

/** Font family per weight: custom fonts on Android need one family per face. */
export const Fonts = {
  regular: 'SourceSerif4_400Regular',
  italic: 'SourceSerif4_400Regular_Italic',
  semibold: 'SourceSerif4_600SemiBold',
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** Touch app radii: larger than the system's 2px (sheets 24-28, controls 14-18). */
export const Radius = {
  pill: 999,
  sm: 10,
  md: 14,
  lg: 18,
  sheet: 28,
} as const;

export const Shadows = {
  sm: {
    shadowColor: Colors.neutral900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.14,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.neutral900,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },
  lg: {
    shadowColor: Colors.neutral900,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 32,
    elevation: 12,
  },
} as const;
