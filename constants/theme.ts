/**
 * Theme Constants (Legacy compatibility)
 * =======================================
 * This file provides backward compatibility with existing components.
 * For new code, import directly from @/config/colors or @/config/typography
 */

import { Colors as AppColors } from '@/config/colors';

// Light mode only (no dark mode)
export const Colors = {
  light: {
    text: AppColors.text.primary,
    background: AppColors.background,
    tint: AppColors.primary,
    icon: AppColors.gray[600],
    tabIconDefault: AppColors.gray[500],
    tabIconSelected: AppColors.primary,
  },
  // Keep dark for compatibility but use same values
  dark: {
    text: AppColors.text.primary,
    background: AppColors.background,
    tint: AppColors.primary,
    icon: AppColors.gray[600],
    tabIconDefault: AppColors.gray[500],
    tabIconSelected: AppColors.primary,
  },
};

// Font family names for compatibility
export const Fonts = {
  sans: 'Poppins_400Regular',
  serif: 'Poppins_400Regular',
  rounded: 'Poppins_500Medium',
  mono: 'Poppins_400Regular',
};
