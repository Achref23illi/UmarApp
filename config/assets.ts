/**
 * Asset Paths Configuration
 * ==========================
 * Centralized asset references
 */

// Image assets
export const Images = {
  // Logo
  logo: require('@/assets/logo/logo.png'),
  logoWhite: require('@/assets/images/logo_white.png'),
  icon: require('@/assets/images/icon.png'),
  // Welcome screen
  welcomeBackground: require('@/assets/images/bg-wa.jpg'),
  // Onboarding Illustrations (placeholders until generated)
  illustration1: require('@/assets/images/i1.png'),
  illustration2: require('@/assets/images/i2.png'),
  illustration3: require('@/assets/images/i3.png'),
  // Auth / Signup
  man: require('@/assets/images/man.png'),
  woman: require('@/assets/images/woman.png'),
  // Janaza
  death: require('@/assets/images/death.png'),
  // Sick visit
  sick: require('@/assets/images/sick.png'),
  // Splash
  splashIcon: require('@/assets/images/splash-icon.png'),
  splashBackground: require('@/assets/images/background.png'),
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
