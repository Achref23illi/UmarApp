import { Colors } from '@/config/colors';

export function useTheme() {
  // Dark mode is temporarily disabled across the app.
  const activeTheme = 'light' as const;
  const colors = Colors.light;
  const isDark = false;

  return {
    theme: activeTheme,
    isDark,
    colors,
  };
}
