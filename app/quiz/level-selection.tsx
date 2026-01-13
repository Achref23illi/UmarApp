import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/config/colors';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/store/hooks';

export default function LevelSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors } = useTheme();
  
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  const levels = [
    {
      id: 'debutant',
      title: t('quiz.levels.debutant'),
      subtitle: t('quiz.levels.debutant_desc'),
      // Use slightly different shades or same color
      color: Colors.palette.purple.light, 
    },
    {
      id: 'intermediaire',
      title: t('quiz.levels.intermediaire'),
      subtitle: t('quiz.levels.intermediaire_desc'),
      color: Colors.palette.purple.primary,
    },
    {
      id: 'expert',
      title: t('quiz.levels.expert'),
      subtitle: t('quiz.levels.expert_desc'),
      color: Colors.palette.purple.dark,
    },
  ];

  const handleLevelSelect = (levelId: string) => {
    router.push({
      pathname: '/quiz/level-validation',
      params: { level: levelId },
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
            {t('quiz.levels.title')}
          </Text>
          <Text style={[styles.subtitle, { fontFamily: fontRegular, color: colors.text.secondary }]}>
            {t('quiz.levels.subtitle')}
          </Text>
        </View>

        <View style={styles.levelsContainer}>
          {levels.map((level, index) => (
            <Animated.View
              key={level.id}
              entering={FadeInDown.delay(index * 100).springify()}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.levelButton,
                  { 
                    backgroundColor: level.color,
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  }
                ]}
                onPress={() => handleLevelSelect(level.id)}
              >
                <Text style={[styles.levelTitle, { fontFamily: fontBold }]}>
                  {level.title}
                </Text>
                <Text style={[styles.levelSubtitle, { fontFamily: fontMedium }]}>
                  {level.subtitle}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </View>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  titleContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
  },
  levelsContainer: {
    gap: 16,
  },
  levelButton: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  levelTitle: {
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  levelSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
});
