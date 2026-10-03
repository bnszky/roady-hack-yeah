import { StyleSheet, Text, type TextProps } from 'react-native';

import { Colors, Fonts, type ThemeColor } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'display'
    | 'title'
    | 'heading'
    | 'subheading'
    | 'bodyLarge'
    | 'body'
    | 'small'
    | 'caption'
    | 'kicker'
    | 'button';
  themeColor?: ThemeColor;
  bold?: boolean;
  italic?: boolean;
};

/** Large system font sizes (common on Samsung) still scale text, but not enough to break layouts. */
const MAX_FONT_SCALE = 1.3;

export function ThemedText({
  style,
  type = 'body',
  themeColor,
  bold,
  italic,
  maxFontSizeMultiplier = MAX_FONT_SCALE,
  ...rest
}: ThemedTextProps) {
  return (
    <Text
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[
        styles[type],
        themeColor && { color: Colors[themeColor] },
        bold && { fontFamily: Fonts.semibold },
        italic && { fontFamily: Fonts.italic },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  display: { fontFamily: Fonts.semibold, fontSize: 32, lineHeight: 35, color: Colors.text },
  title: { fontFamily: Fonts.semibold, fontSize: 26, lineHeight: 30, color: Colors.text },
  heading: { fontFamily: Fonts.semibold, fontSize: 20, lineHeight: 25, color: Colors.text },
  subheading: { fontFamily: Fonts.semibold, fontSize: 18, lineHeight: 23, color: Colors.text },
  bodyLarge: { fontFamily: Fonts.regular, fontSize: 17, lineHeight: 25, color: Colors.text },
  body: { fontFamily: Fonts.regular, fontSize: 16, lineHeight: 22, color: Colors.text },
  small: { fontFamily: Fonts.regular, fontSize: 14, lineHeight: 20, color: Colors.text },
  caption: { fontFamily: Fonts.regular, fontSize: 13, lineHeight: 18, color: Colors.neutral700 },
  kicker: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.neutral700,
  },
  button: { fontFamily: Fonts.semibold, fontSize: 16, lineHeight: 20, color: Colors.text },
});
