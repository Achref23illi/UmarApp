/**
 * Spacing & Layout Configuration
 * ================================
 * Consistent spacing values throughout the app
 */

// Base spacing unit (4px)
const BASE_UNIT = 4;

export const Spacing = {
  // Core spacing values
  none: 0,
  xs: BASE_UNIT, // 4
  sm: BASE_UNIT * 2, // 8
  md: BASE_UNIT * 3, // 12
  base: BASE_UNIT * 4, // 16
  lg: BASE_UNIT * 5, // 20
  xl: BASE_UNIT * 6, // 24
  '2xl': BASE_UNIT * 8, // 32
  '3xl': BASE_UNIT * 10, // 40
  '4xl': BASE_UNIT * 12, // 48
  '5xl': BASE_UNIT * 16, // 64

  // Screen padding
  screenHorizontal: BASE_UNIT * 4, // 16
  screenVertical: BASE_UNIT * 6, // 24

  // Component specific
  cardPadding: BASE_UNIT * 4, // 16
  inputPadding: BASE_UNIT * 3, // 12
  buttonPaddingX: BASE_UNIT * 6, // 24
  buttonPaddingY: BASE_UNIT * 3, // 12
} as const;

// Border Radius
export const BorderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

// Shadow configurations
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// Z-Index layers
export const ZIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  popover: 500,
  toast: 600,
  tooltip: 700,
} as const;

// Screen breakpoints (for responsive design)
export const Breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

// Icon sizes
export const IconSize = {
  xs: 12,
  sm: 16,
  md: 20,
  base: 24,
  lg: 28,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
} as const;
