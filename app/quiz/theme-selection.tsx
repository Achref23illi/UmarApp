import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/config/colors';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/store/hooks';

const themes = [
  { id: 1, key: 'prophet' },
  { id: 2, key: 'pillars' },
  { id: 3, key: 'faith' },
  { id: 4, key: 'quran' },
  { id: 5, key: 'fiqh' },
];

export default function ThemeSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { level } = useLocalSearchParams<{ level: string }>();

  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [selectedThemeKey, setSelectedThemeKey] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleThemeSelect = (themeKey: string) => {
    setSelectedThemeKey(themeKey);
    // Store the translated name for display/params if needed, or just key
    setSelectedTheme(t(`quiz.themes.${themeKey}`)); 
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    setShowConfirmation(false);
    router.push({
      pathname: '/quiz/game-settings',
      params: { theme: selectedTheme || '', level: level || '' }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          onPress={() => router.back()} 
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { fontFamily: fontBold, color: colors.text.primary }]}>
            {t('quiz.themes.title')}
          </Text>
        </View>

        <View style={styles.themesContainer}>
          {themes.map((theme, index) => (
            <Animated.View
              key={theme.id}
              entering={FadeInRight.delay(index * 50).springify()}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.themeButton,
                  { 
                    backgroundColor: colors.surface,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                    shadowColor: colors.text.primary
                  }
                ]}
                onPress={() => handleThemeSelect(theme.key)}
              >
                <Text style={[styles.themeText, { fontFamily: fontMedium, color: colors.text.primary }]}>
                  {t(`quiz.themes.${theme.key}`)}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmation(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            entering={FadeIn.duration(200)}
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <View style={styles.modalHeader}>
                 <Text style={[styles.modalTitle, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                    {t('quiz.selected_theme_label')}
                 </Text>
                 <Pressable onPress={() => setShowConfirmation(false)}>
                    <Ionicons name="close" size={24} color={colors.text.secondary} />
                 </Pressable>
            </View>
            
            <Text style={[styles.modalTheme, { fontFamily: fontBold, color: Colors.palette.purple.primary }]}>
                {selectedTheme}
            </Text>

            <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.button, styles.cancelButton, { backgroundColor: colors.surfaceHighlight || '#E5E7EB' }]}
                  onPress={() => setShowConfirmation(false)}
                >
                  <Text style={[styles.buttonText, { fontFamily: fontMedium, color: colors.text.primary }]}>
                    {t('quiz.back')}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.button, styles.confirmButton, { backgroundColor: Colors.palette.purple.primary }]}
                  onPress={handleConfirm}
                >
                  <Text style={[styles.buttonText, { fontFamily: fontMedium, color: '#FFF' }]}>
                     {t('quiz.validate')}
                  </Text>
                </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
  },
  themesContainer: {
    gap: 16,
  },
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  themeText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 14,
    textAlign: 'center',
    flex: 1,
  },
  modalTheme: {
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 30,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {},
  confirmButton: {},
  buttonText: {
    fontSize: 16,
  }
});
