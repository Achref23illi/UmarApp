import { Colors } from '@/config/colors';
import { useAppSelector } from '@/store/hooks';
import { useColorScheme } from 'react-native';

export function useTheme() {
  const systemScheme = useColorScheme();
  const { theme: userTheme } = useAppSelector((state) => state.user.preferences);

  const activeTheme = userTheme === 'system' 
    ? (systemScheme === 'dark' ? 'dark' : 'light') 
    : userTheme;

  const colors = Colors[activeTheme];
  const isDark = activeTheme === 'dark';

  return {
    theme: activeTheme,
    isDark,
    colors,
  };
}
