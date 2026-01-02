import { LANGUAGES, LanguageCode, changeLanguage } from '@/locales/i18n';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setLanguage } from '@/store/slices/languageSlice';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { I18nManager } from 'react-native';

/**
 * Custom hook for handling translations and language switching
 *
 * Usage:
 * const { t, currentLanguage, isRTL, switchLanguage, languages } = useAppTranslation();
 *
 * // In component:
 * <Text>{t('common.welcome')}</Text>
 * <Pressable onPress={() => switchLanguage('fr')}>
 *   <Text>Switch to French</Text>
 * </Pressable>
 */
export function useAppTranslation() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const isRTL = useAppSelector((state) => state.language.isRTL);

  const switchLanguage = useCallback(
    async (lang: LanguageCode) => {
      await changeLanguage(lang);
      dispatch(setLanguage(lang));

      // Handle RTL for Arabic
      if (lang === 'ar' && !I18nManager.isRTL) {
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(true);
      } else if (lang !== 'ar' && I18nManager.isRTL) {
        I18nManager.allowRTL(false);
        I18nManager.forceRTL(false);
      }
    },
    [dispatch]
  );

  return {
    t,
    i18n,
    currentLanguage,
    isRTL,
    switchLanguage,
    languages: LANGUAGES,
    languageCodes: Object.keys(LANGUAGES) as LanguageCode[],
  };
}
