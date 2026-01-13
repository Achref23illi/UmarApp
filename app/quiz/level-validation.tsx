/**
 * Quiz Level Validation Screen
 * =============================
 * Users answer questions to validate their selected level
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/config/colors';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/store/hooks';

export default function LevelValidationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors } = useTheme();
  
  const { level } = useLocalSearchParams<{ level: string }>();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);

  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  const [showLevelConfirmation, setShowLevelConfirmation] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(1);

  // Map levels to translation keys if possible, or just raw
  const levelKeys: Record<string, string> = {
    debutant: 'quiz.levels.beginner',
    intermediaire: 'quiz.levels.intermediate',
    expert: 'quiz.levels.expert',
  };

  const handleAnswer = () => {
    // After answering all questions, show confirmation
    setShowLevelConfirmation(true);
  };

  const handleLevelConfirmed = () => {
    setShowLevelConfirmation(false);
    // Navigate to theme selection
    router.push({
      pathname: '/quiz/theme-selection',
      params: { level: level }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
         <View style={{ flex: 1 }} />
         <Pressable 
            style={[styles.settingsButton, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/settings')}
        >
            <Ionicons name="settings-outline" size={24} color={colors.text.primary} />
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { fontFamily: fontRegular, color: colors.text.primary }]}>
             {t('quiz.validation.title')}
          </Text>
           <Text style={[styles.subtitle, { fontFamily: fontRegular, color: colors.text.secondary }]}>
             {t('quiz.validation.subtitle')}
          </Text>
        </View>

        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={[styles.questionLabel, { fontFamily: fontBold, color: Colors.palette.purple.primary }]}>
            Q{currentQuestion}
          </Text>
          <Text style={[styles.questionText, { fontFamily: fontRegular, color: colors.text.primary }]}>
            {t('quiz.validation.question', { number: currentQuestion })}
          </Text>
        </View>

        {/* Answer Buttons */}
        <View style={styles.answersContainer}>
          {[1, 2, 3].map((answer, index) => (
            <Animated.View
              key={answer}
              entering={FadeInDown.delay(index * 100).springify()}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.answerButton,
                  { backgroundColor: colors.surface, shadowColor: colors.text.primary, transform: [{ scale: pressed ? 0.98 : 1 }] }
                ]}
                onPress={handleAnswer}
              >
                <Text style={[styles.answerText, { fontFamily: fontMedium, color: colors.text.primary }]}>
                  {t('quiz.validation.answer', { number: answer })}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Level Confirmation Modal */}
      <Modal
        visible={showLevelConfirmation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLevelConfirmation(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            entering={FadeIn.duration(200)}
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <View style={styles.modalCard}>
              <Ionicons name="school-outline" size={48} color={Colors.palette.purple.primary} style={{ marginBottom: 16 }} />
              
              <Text style={[styles.modalWelcome, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                {t('quiz.validation.welcome_level')}
              </Text>
              <Text style={[styles.modalLevel, { fontFamily: fontBold, color: Colors.palette.purple.primary }]}>
                {t(levelKeys[level || 'intermediaire'] || 'quiz.levels.intermediate').toUpperCase()}
              </Text>

              <Pressable
                style={[styles.modalContinueButton, { backgroundColor: Colors.palette.purple.primary }]}
                onPress={handleLevelConfirmed}
              >
                <Text style={[styles.modalContinueText, { fontFamily: fontMedium }]}>
                  {t('quiz.validation.continue')}
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
    flexDirection: 'row',
    alignItems: 'center',
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
  settingsButton: {
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
    paddingTop: 40,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  questionContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  questionLabel: {
    fontSize: 24,
    marginBottom: 12,
  },
  questionText: {
    fontSize: 18,
    textAlign: 'center',
  },
  answersContainer: {
    gap: 16,
    marginBottom: 30,
  },
  answerButton: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  answerText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalCard: {
    padding: 30,
    alignItems: 'center',
  },
  modalWelcome: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalLevel: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalContinueButton: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  modalContinueText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});
