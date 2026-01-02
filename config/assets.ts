/**
 * Asset Paths Configuration
 * ==========================
 * Centralized asset references
 */

// Image assets
export const Images = {
  // Logo
  logo: require('@/assets/images/logo.png'),
  logoWhite: require('@/assets/images/logo_white.png'),
  icon: require('@/assets/images/icon.png'),
  // Welcome screen
  welcomeBackground: require('@/assets/images/mosque.jpg'),
  // Splash
  splashIcon: require('@/assets/images/splash-icon.png'),
  // Home screen
  athanBackground: require('@/assets/images/athan_bg.png'),
} as const;

// SVG Assets
// We need to use 'any' type here because import *.svg is handled by transformer
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GeometricPattern: any = require('@/assets/images/geometric.svg').default;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MosqueSilhouette: any = require('@/assets/images/mosque.svg').default;

export const Svgs = {
  geometric: GeometricPattern,
  mosque: MosqueSilhouette,
};

// Icon sets (using @expo/vector-icons)
export const IconSets = {
  primary: 'Ionicons', // Main icon set
  secondary: 'MaterialCommunityIcons', // Secondary set
  social: 'FontAwesome', // Social media icons
} as const;

// Animation durations (ms)
export const AnimationDurations = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 800,
} as const;

// Animation easings
export const AnimationEasing = {
  linear: 'linear',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
} as const;
