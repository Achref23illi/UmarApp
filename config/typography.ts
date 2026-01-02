/**
 * Typography Configuration
 * =========================
 * Poppins: English & French
 * Cairo: Arabic
 */

// Font family names (after loading)
export const FontFamily = {
  // Poppins (English & French)
  poppins: {
    thin: 'Poppins_100Thin',
    extraLight: 'Poppins_200ExtraLight',
    light: 'Poppins_300Light',
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semiBold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
    extraBold: 'Poppins_800ExtraBold',
    black: 'Poppins_900Black',
  },
  // Cairo (Arabic) - Note: Cairo doesn't have thin/extraLight weights
  cairo: {
    light: 'Cairo_300Light',
    regular: 'Cairo_400Regular',
    medium: 'Cairo_500Medium',
    semiBold: 'Cairo_600SemiBold',
    bold: 'Cairo_700Bold',
    extraBold: 'Cairo_800ExtraBold',
    black: 'Cairo_900Black',
  },
} as const;

// Font sizes with line heights
export const FontSize = {
  xs: { size: 10, lineHeight: 14 },
  sm: { size: 12, lineHeight: 16 },
  base: { size: 14, lineHeight: 20 },
  md: { size: 16, lineHeight: 24 },
  lg: { size: 18, lineHeight: 28 },
  xl: { size: 20, lineHeight: 28 },
  '2xl': { size: 24, lineHeight: 32 },
  '3xl': { size: 30, lineHeight: 36 },
  '4xl': { size: 36, lineHeight: 40 },
  '5xl': { size: 48, lineHeight: 52 },
} as const;

// Font weights
export const FontWeight = {
  thin: '100',
  extraLight: '200',
  light: '300',
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
  black: '900',
} as const;

// Pre-defined text styles
export const TextStyles = {
  // Headings
  h1: {
    fontSize: FontSize['4xl'].size,
    lineHeight: FontSize['4xl'].lineHeight,
    fontWeight: FontWeight.bold,
  },
  h2: {
    fontSize: FontSize['3xl'].size,
    lineHeight: FontSize['3xl'].lineHeight,
    fontWeight: FontWeight.bold,
  },
  h3: {
    fontSize: FontSize['2xl'].size,
    lineHeight: FontSize['2xl'].lineHeight,
    fontWeight: FontWeight.semiBold,
  },
  h4: {
    fontSize: FontSize.xl.size,
    lineHeight: FontSize.xl.lineHeight,
    fontWeight: FontWeight.semiBold,
  },
  h5: {
    fontSize: FontSize.lg.size,
    lineHeight: FontSize.lg.lineHeight,
    fontWeight: FontWeight.medium,
  },
  h6: {
    fontSize: FontSize.md.size,
    lineHeight: FontSize.md.lineHeight,
    fontWeight: FontWeight.medium,
  },
  // Body
  bodyLarge: {
    fontSize: FontSize.md.size,
    lineHeight: FontSize.md.lineHeight,
    fontWeight: FontWeight.regular,
  },
  body: {
    fontSize: FontSize.base.size,
    lineHeight: FontSize.base.lineHeight,
    fontWeight: FontWeight.regular,
  },
  bodySmall: {
    fontSize: FontSize.sm.size,
    lineHeight: FontSize.sm.lineHeight,
    fontWeight: FontWeight.regular,
  },
  // Caption & Labels
  caption: {
    fontSize: FontSize.xs.size,
    lineHeight: FontSize.xs.lineHeight,
    fontWeight: FontWeight.regular,
  },
  label: {
    fontSize: FontSize.sm.size,
    lineHeight: FontSize.sm.lineHeight,
    fontWeight: FontWeight.medium,
  },
  // Button
  button: {
    fontSize: FontSize.base.size,
    lineHeight: FontSize.base.lineHeight,
    fontWeight: FontWeight.semiBold,
  },
  buttonSmall: {
    fontSize: FontSize.sm.size,
    lineHeight: FontSize.sm.lineHeight,
    fontWeight: FontWeight.semiBold,
  },
} as const;

// Helper to get font family based on language
export const getFontFamily = (
  language: 'en' | 'fr' | 'ar',
  weight: keyof typeof FontFamily.poppins = 'regular'
): string => {
  if (language === 'ar') {
    // Map poppins weights to cairo (cairo doesn't have thin)
    const cairoWeight = weight === 'thin' ? 'extraLight' : weight;
    return (
      FontFamily.cairo[cairoWeight as keyof typeof FontFamily.cairo] || FontFamily.cairo.regular
    );
  }
  return FontFamily.poppins[weight] || FontFamily.poppins.regular;
};
