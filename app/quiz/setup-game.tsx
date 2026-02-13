/**
 * Quiz Setup Game Screen (Multiplayer)
 * =====================================
 * Select level and theme for multiplayer quiz
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/config/colors';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/store/hooks';

// Define levels and themes with translation keys
const LEVELS = [
  { id: 'debutant', labelKey: 'quiz.levels.beginner', icon: 'bicycle-outline' },
  { id: 'intermediaire', labelKey: 'quiz.levels.intermediate', icon: 'car-sport-outline' },
  { id: 'expert', labelKey: 'quiz.levels.expert', icon: 'airplane-outline' },
];

const THEMES = [
  { id: 'prophethood', labelKey: 'quiz.themes.prophethood', icon: 'book-outline' },
  { id: 'companions', labelKey: 'quiz.themes.companions', icon: 'people-outline' },
  { id: 'quran', labelKey: 'quiz.themes.quran', icon: 'book-outline' },
  { id: 'sunnah', labelKey: 'quiz.themes.sunnah', icon: 'sunny-outline' },
  { id: 'ramadan', labelKey: 'quiz.themes.ramadan', icon: 'moon-outline' },
  { id: 'pillars', labelKey: 'quiz.themes.pillars', icon: 'list-outline' },
  { id: 'random', labelKey: 'quiz.themes.random', icon: 'shuffle-outline' },
];

export default function SetupGameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const { participantCount } = useLocalSearchParams<{ participantCount: string }>();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);

  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');

  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  const handleStart = () => {
    if (!selectedLevel || !selectedTheme) {
      // Alert handled by disabled button visual state usually, but can add alert
      return;
    }

    const parsedCount = Number(participantCount || 0);
    const multiplayerMode = parsedCount <= 2 ? 'duo' : 'group';

    router.push({
      pathname: '/quiz/game-settings',
      params: {
        mode: multiplayerMode,
        level: selectedLevel,
        theme: selectedTheme,
        participants: participantCount,
      },
    });
  };

  const isReady = selectedLevel && selectedTheme;

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        {participantCount && (
          <View
            style={[
              styles.participantBadge,
              { backgroundColor: colors.surfaceHighlight || '#F3F4F6' },
            ]}
          >
            <Ionicons name="people" size={16} color={Colors.palette.purple.primary} />
            <Text
              style={[
                styles.participantCount,
                { fontFamily: fontMedium, color: colors.text.primary },
              ]}
            >
              {t('quiz.setup.participants_count_plural', { count: Number(participantCount || 0) })}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Level Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
            {t('quiz.setup.select_level')}
          </Text>
          <View style={styles.optionsGrid}>
            {LEVELS.map((level, index) => (
              <Animated.View
                key={level.id}
                entering={FadeInDown.delay(index * 50).springify()}
                style={styles.optionWrapper}
              >
                <Pressable
                  style={[
                    styles.optionCard,
                    { backgroundColor: colors.surface, borderColor: 'transparent', borderWidth: 2 },
                    selectedLevel === level.id && {
                      borderColor: Colors.palette.purple.primary,
                      backgroundColor: colors.surfaceHighlight || '#F3F4F6',
                    },
                  ]}
                  onPress={() => setSelectedLevel(level.id)}
                >
                  <Ionicons
                    name={level.icon as any}
                    size={28}
                    color={selectedLevel === level.id ? Colors.palette.purple.primary : colors.icon}
                    style={{ marginBottom: 8 }}
                  />
                  <Text
                    style={[
                      styles.optionLabel,
                      {
                        fontFamily: fontMedium,
                        color:
                          selectedLevel === level.id
                            ? Colors.palette.purple.primary
                            : colors.text.primary,
                      },
                    ]}
                  >
                    {t(level.labelKey)}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Theme Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
            {t('quiz.setup.select_theme')}
          </Text>
          <View style={styles.optionsGrid}>
            {THEMES.map((theme, index) => (
              <Animated.View
                key={theme.id}
                entering={FadeInDown.delay(index * 50 + 200).springify()}
                style={styles.optionWrapper}
              >
                <Pressable
                  style={[
                    styles.optionCard,
                    { backgroundColor: colors.surface, borderColor: 'transparent', borderWidth: 2 },
                    selectedTheme === theme.id && {
                      borderColor: Colors.palette.purple.primary,
                      backgroundColor: colors.surfaceHighlight || '#F3F4F6',
                    },
                  ]}
                  onPress={() => setSelectedTheme(theme.id)}
                >
                  <Ionicons
                    name={theme.icon as any}
                    size={28}
                    color={selectedTheme === theme.id ? Colors.palette.purple.primary : colors.icon}
                    style={{ marginBottom: 8 }}
                  />
                  <Text
                    style={[
                      styles.optionLabel,
                      {
                        fontFamily: fontMedium,
                        color:
                          selectedTheme === theme.id
                            ? Colors.palette.purple.primary
                            : colors.text.primary,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {t(theme.labelKey)}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Custom Bottom Nav / Start Button */}
      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + 20, backgroundColor: colors.background },
        ]}
      >
        <Pressable
          style={[
            styles.startButton,
            { backgroundColor: isReady ? Colors.palette.purple.primary : colors.text.disabled },
          ]}
          onPress={handleStart}
          disabled={!isReady}
        >
          <Text style={[styles.startButtonText, { fontFamily: fontBold }]}>
            {t('quiz.setup.start')}
          </Text>
          <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  participantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  participantCount: {
    fontSize: 14,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionWrapper: {
    width: '30%', // Approx 3 columns
    flexGrow: 1,
  },
  optionCard: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
});
