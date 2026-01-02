import {
  Poppins_100Thin,
  Poppins_200ExtraLight,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
} from '@expo-google-fonts/poppins';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Import Cairo fonts individually to avoid broken package exports
// @ts-ignore - direct path imports
import Cairo_300Light from '@expo-google-fonts/cairo/300Light/Cairo_300Light.ttf';
// @ts-ignore
import Cairo_400Regular from '@expo-google-fonts/cairo/400Regular/Cairo_400Regular.ttf';
// @ts-ignore
import Cairo_500Medium from '@expo-google-fonts/cairo/500Medium/Cairo_500Medium.ttf';
// @ts-ignore
import Cairo_600SemiBold from '@expo-google-fonts/cairo/600SemiBold/Cairo_600SemiBold.ttf';
// @ts-ignore
import Cairo_700Bold from '@expo-google-fonts/cairo/700Bold/Cairo_700Bold.ttf';

// Keep the splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

/**
 * Hook to load all app fonts
 * Returns true when fonts are loaded and splash screen is hidden
 */
export function useAppFonts() {
  const [fontsLoaded, fontError] = useFonts({
    // Poppins (English & French)
    Poppins_100Thin,
    Poppins_200ExtraLight,
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
    // Cairo (Arabic) - imported directly to avoid broken package
    Cairo_300Light,
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  return {
    fontsLoaded,
    fontError,
  };
}

// Font family mapping for easy use
export const Fonts = {
  // Poppins weights
  thin: 'Poppins_100Thin',
  extraLight: 'Poppins_200ExtraLight',
  light: 'Poppins_300Light',
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extraBold: 'Poppins_800ExtraBold',
  black: 'Poppins_900Black',
  // Arabic font weights
  arabicLight: 'Cairo_300Light',
  arabicRegular: 'Cairo_400Regular',
  arabicMedium: 'Cairo_500Medium',
  arabicSemiBold: 'Cairo_600SemiBold',
  arabicBold: 'Cairo_700Bold',
} as const;

// Get appropriate font based on language
export const getFont = (
  language: 'en' | 'fr' | 'ar',
  weight: 'regular' | 'medium' | 'semiBold' | 'bold' = 'regular'
): string => {
  if (language === 'ar') {
    switch (weight) {
      case 'regular':
        return Fonts.arabicRegular;
      case 'medium':
        return Fonts.arabicMedium;
      case 'semiBold':
        return Fonts.arabicSemiBold;
      case 'bold':
        return Fonts.arabicBold;
      default:
        return Fonts.arabicRegular;
    }
  }
  switch (weight) {
    case 'regular':
      return Fonts.regular;
    case 'medium':
      return Fonts.medium;
    case 'semiBold':
      return Fonts.semiBold;
    case 'bold':
      return Fonts.bold;
    default:
      return Fonts.regular;
  }
};
