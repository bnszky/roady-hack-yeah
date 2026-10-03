/**
 * Roady design tokens, from design v2 (see design/design v2.html): Montserrat,
 * white-grey ground, turquoise as the interactive color, near-black (#0E1514)
 * for clusters and bottom action bars, magenta as the severity spot.
 */

export const Colors = {
  bg: '#F8F8F8',
  surface: '#F5F5F5',
  text: '#0E1514',
  divider: 'rgba(14, 21, 20, 0.12)',
  scrim: 'rgba(14, 21, 20, 0.35)',

  neutral100: '#FFFFFF',
  neutral200: '#F5F5F5',
  neutral300: '#DEDEDE',
  neutral400: '#C4C4C4',
  neutral500: '#AAAAAA',
  neutral600: '#8A8A8A',
  neutral700: '#5F5F5F',
  neutral800: '#454545',
  neutral900: '#0E1514',

  accent: '#0DB295',
  accent100: '#E7F8F4',
  accent200: '#C5EFE5',
  accent300: '#93E2D0',
  accent600: '#0A9E85',
  accent700: '#087F6B',
  accent800: '#06604F',

  accent2_100: '#fff1f4',
  accent2_600: '#D82071',
  accent2_700: '#aa0b56',
  accent2_800: '#790e3d',

  /** Bottom action bars (details, confirmation). */
  actionBar: '#0E1514',
} as const;

export type ThemeColor = keyof typeof Colors;

/** Font family per weight: custom fonts on Android need one family per face. */
export const Fonts = {
  regular: 'Montserrat_400Regular',
  italic: 'Montserrat_400Regular_Italic',
  medium: 'Montserrat_500Medium',
  semibold: 'Montserrat_600SemiBold',
  bold: 'Montserrat_700Bold',
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

/** Touch app radii: buttons are pills, sheets 24-28, controls 14-18. */
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
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.neutral900,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 5,
  },
  lg: {
    shadowColor: Colors.neutral900,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 40,
    elevation: 12,
  },
} as const;
