import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setLanguage } from '@/store/slices/languageSlice'; // Assuming this exists or will need to create
import { setTheme } from '@/store/slices/userSlice';

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { colors, theme } = useTheme();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const themePreference = useAppSelector((state) => state.user.preferences.theme);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'ar', label: 'العربية' },
  ];

  const themes = [
    { code: 'light', labelKey: 'settings.theme.light', icon: 'sunny-outline' },
    { code: 'dark', labelKey: 'settings.theme.dark', icon: 'moon-outline' },
    { code: 'system', labelKey: 'settings.theme.system', icon: 'phone-portrait-outline' },
  ] as const;

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
          {t('settings.appearance')}
        </Text>
        
        <View style={styles.optionsRow}>
          {themes.map((item) => {
            const isActive = themePreference === item.code;
            return (
              <Pressable
                key={item.code}
                onPress={() => dispatch(setTheme(item.code))}
                style={[
                  styles.themeOption,
                  { 
                    backgroundColor: isActive ? colors.primary : 'transparent',
                    borderColor: colors.border,
                  }
                ]}
              >
                <Ionicons 
                  name={item.icon as any} 
                  size={24} 
                  color={isActive ? colors.text.inverse : colors.text.primary} 
                />
                <Text style={[
                  styles.themeLabel, 
                  { color: isActive ? colors.text.inverse : colors.text.primary }
                ]}>
                  {t(item.labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
          {t('settings.language')}
        </Text>
        
        {languages.map((item) => (
          <Pressable
            key={item.code}
            onPress={() => dispatch(setLanguage(item.code as any))}
            style={[styles.languageItem, { borderBottomColor: colors.divider }]}
          >
             <Text style={[styles.languageLabel, { color: colors.text.primary }]}>
               {item.label}
             </Text>
             {currentLanguage === item.code && (
               <Ionicons name="checkmark" size={24} color={colors.primary} />
             )}
          </Pressable>
        ))}
      </View>
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 24,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  languageLabel: {
    fontSize: 16,
  },
});
