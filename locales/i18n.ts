import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import ar from './ar.json';
import en from './en.json';
import fr from './fr.json';

// Define supported languages
export const LANGUAGES = {
  en: { name: 'English', nativeName: 'English', rtl: false },
  fr: { name: 'French', nativeName: 'Français', rtl: false },
  ar: { name: 'Arabic', nativeName: 'العربية', rtl: true },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

// Get device language or default to English
const getDeviceLanguage = (): LanguageCode => {
  const deviceLocale = Localization.getLocales()[0]?.languageCode;
  if (deviceLocale && deviceLocale in LANGUAGES) {
    return deviceLocale as LanguageCode;
  }
  return 'en';
};

// Initialize i18next
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    ar: { translation: ar },
  },
  lng: 'fr',
  fallbackLng: 'fr',
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  react: {
    useSuspense: false, // Disable suspense for React Native
  },
});

// Helper function to check if current language is RTL
export const isRTL = (): boolean => {
  const currentLang = i18n.language as LanguageCode;
  return LANGUAGES[currentLang]?.rtl ?? false;
};

// Helper function to change language
export const changeLanguage = async (lang: LanguageCode): Promise<void> => {
  await i18n.changeLanguage(lang);
};

export default i18n;
