/**
 * App Color Palette
 * ===================
 * Defines the color system for both Light and Dark modes.
 */

const PALETTE = {
  purple: {
    primary: '#670FA4',
    light: '#8B3DB8',
    dark: '#4A0B78',
    muted: 'rgba(103, 15, 164, 0.1)',
  },
  gold: {
    primary: '#F5C661',
    light: '#F7D48A',
    dark: '#D4A84A',
    muted: 'rgba(245, 198, 97, 0.2)',
  },
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray200: '#EEEEEE',
    gray300: '#E0E0E0',
    gray400: '#BDBDBD',
    gray500: '#9E9E9E',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#424242',
    gray900: '#212121',
    darkBg: '#0A0A0A',
    darkSurface: '#121212',
  },
  semantic: {
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
  }
};

const LightTheme = {
  primary: PALETTE.purple.primary,
  secondary: PALETTE.gold.primary,
  background: PALETTE.neutral.gray100,
  surface: PALETTE.neutral.white,
  surfaceHighlight: PALETTE.neutral.gray50,
  
  text: {
    primary: PALETTE.neutral.gray900,
    secondary: PALETTE.neutral.gray600,
    disabled: PALETTE.neutral.gray400,
    inverse: PALETTE.neutral.white,
    link: PALETTE.purple.primary,
  },

  border: PALETTE.neutral.gray300,
  divider: PALETTE.neutral.gray200,

  input: {
    background: PALETTE.neutral.white,
    border: PALETTE.neutral.gray300,
    placeholder: PALETTE.neutral.gray500,
  },

  icon: PALETTE.neutral.gray700,
  tabBar: PALETTE.neutral.white,
  
  // Backward compatibility for raw gray access
  gray: {
      400: PALETTE.neutral.gray400,
      100: PALETTE.neutral.gray100,
      200: PALETTE.neutral.gray200,
      500: PALETTE.neutral.gray500,
      600: PALETTE.neutral.gray600,
  },
  white: PALETTE.neutral.white,
  error: PALETTE.semantic.error,
};

const DarkTheme = {
  primary: PALETTE.purple.light,
  secondary: PALETTE.gold.primary,
  background: PALETTE.neutral.darkBg,
  surface: PALETTE.neutral.darkSurface,
  surfaceHighlight: '#1E1E1E',

  text: {
    primary: PALETTE.neutral.gray100,
    secondary: PALETTE.neutral.gray400,
    disabled: PALETTE.neutral.gray600,
    inverse: PALETTE.neutral.black,
    link: PALETTE.gold.primary,
  },

  border: '#333333',
  divider: '#2C2C2C',

  input: {
    background: 'rgba(255,255,255,0.08)',
    border: 'rgba(255,255,255,0.15)',
    placeholder: 'rgba(255,255,255,0.4)',
  },

  icon: PALETTE.neutral.gray300,
  tabBar: PALETTE.neutral.darkSurface,

   // Compatibility
   gray: {
    400: PALETTE.neutral.gray600,
  },
  white: PALETTE.neutral.white,
  error: PALETTE.semantic.error,
};

export const Colors = {
  ...LightTheme, // Flatten Light Theme for backward compatibility with static imports
  light: LightTheme,
  dark: DarkTheme,
  palette: PALETTE,
} as const;

export type ThemeColors = typeof Colors.light;
