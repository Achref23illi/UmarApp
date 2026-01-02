import i18n from '@/locales/i18n';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define LanguageCode type locally to avoid circular dependency with i18n
export type LanguageCode = 'en' | 'fr' | 'ar';

interface LanguageState {
  currentLanguage: LanguageCode;
  isRTL: boolean;
}

const initialState: LanguageState = {
  currentLanguage: 'fr',
  isRTL: false,
};

export const languageSlice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<LanguageCode>) => {
      state.currentLanguage = action.payload;
      state.isRTL = action.payload === 'ar';
      // Also update i18n language
      i18n.changeLanguage(action.payload);
    },
  },
});

export const { setLanguage } = languageSlice.actions;
export default languageSlice.reducer;

