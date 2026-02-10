import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/config/colors';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { GameQuizQuestion, quizService } from '@/services/quizService';
import { useAppSelector } from '@/store/hooks';

export default function QuizGameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const {
    theme,
    level,
    responseTime = '30',
    numberOfQuestions = '20',
    numberOfJokers = '1',
    numberOfHelps = '3',
  } = useLocalSearchParams<{
    theme?: string;
    level?: string;
    responseTime?: string;
    numberOfQuestions?: string;
    numberOfJokers?: string;
    numberOfHelps?: string;
  }>();

  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [jokers, setJokers] = useState(parseInt(numberOfJokers));
  const [helps, setHelps] = useState(parseInt(numberOfHelps));
  const [timeLeft, setTimeLeft] = useState(parseInt(responseTime));
  const [questions, setQuestions] = useState<GameQuizQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  const currentQuestion = questions[currentQuestionIndex];

  // Helper to translate theme title
  const getThemeTitle = (themeId: string) => {
      if (!themeId) return 'Quiz';
      const key = `quiz.themes.${themeId}`;
      const translated = t(key);
      return translated !== key ? translated : themeId;
  };
  const themeTitle = getThemeTitle(theme || '');

  const loadQuestions = async () => {
    try {
      setIsLoadingQuestions(true);
      setQuestionsError(null);

      const limit = Math.max(1, parseInt(numberOfQuestions));
      const data = await quizService.getGameQuestions({
        theme: theme || 'random',
        limit,
        language: currentLanguage,
      });

      setQuestions(data);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setPoints(0);
      setTimeLeft(parseInt(responseTime));
    } catch (error) {
      console.error('Failed to load quiz questions:', error);
      setQuestionsError(t('errors.networkError'));
      setQuestions([]);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Load questions once on mount (and when theme or language changes)
  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, currentLanguage, numberOfQuestions]);

  // Timer countdown
  useEffect(() => {
    if (isLoadingQuestions || questions.length === 0) return;
    if (timeLeft <= 0) {
      // Time's up - move to next question
      handleNext();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleOptionSelect = (option: string) => {
    if (selectedOption) return; // Already answered
    setSelectedOption(option);
    
    if (option === currentQuestion.correctAnswer) {
      setPoints((p) => p + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setTimeLeft(parseInt(responseTime));
    } else {
      // Quiz complete - navigate to results
      router.push({
        pathname: '/quiz/results',
        params: {
          points: points.toString(),
          totalQuestions: questions.length.toString(),
          theme: themeTitle,
        },
      });
    }
  };

  const handleJoker = () => {
    if (jokers > 0 && !selectedOption) {
      setJokers(jokers - 1);
      // TODO: Implement joker logic
    }
  };

  const handleHelp = () => {
    if (helps > 0 && !selectedOption) {
      setHelps(helps - 1);
      // TODO: Implement help logic
    }
  };

  const isCorrect = selectedOption === currentQuestion?.correctAnswer;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={colors.text.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
          {t('quiz.game.theme_label')} {themeTitle}
        </Text>
        <View style={styles.closeButton} />
      </View>

      {isLoadingQuestions ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          <Text style={{ fontFamily: fontMedium, color: colors.text.secondary }}>Loading questions...</Text>
        </View>
      ) : questionsError || !currentQuestion ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 12 }}>
          <Text style={{ fontFamily: fontBold, color: colors.text.primary }}>{t('errors.somethingWentWrong')}</Text>
          <Text style={{ fontFamily: fontRegular, color: colors.text.secondary, textAlign: 'center' }}>
            {questionsError || t('errors.networkError')}
          </Text>
          <Pressable
            onPress={loadQuestions}
            style={{
              marginTop: 8,
              paddingHorizontal: 18,
              paddingVertical: 12,
              borderRadius: 14,
              backgroundColor: Colors.palette.purple.primary,
            }}
          >
            <Text style={{ fontFamily: fontMedium, color: '#fff' }}>{t('errors.tryAgain')}</Text>
          </Pressable>
        </View>
      ) : (
      <>
      {/* Top Indicators - Kept small but updated with Emojis for consistency? 
          Actually, let's just make them simple text counts for now, or match Footer.
      */}
      <View style={[styles.playersRow]}>
        <View style={styles.lifelinesRow}>
          <View style={styles.lifelineItem}>
            <Text style={{ fontSize: 16 }}>💡</Text>
            <Text style={[styles.lifelineCount, { fontFamily: fontRegular, color: colors.text.secondary }]}>{helps}</Text>
          </View>
          <View style={styles.lifelineItem}>
            <Text style={{ fontSize: 16 }}>🃏</Text>
            <Text style={[styles.lifelineCount, { fontFamily: fontRegular, color: colors.text.secondary }]}>{jokers}</Text>
          </View>
        </View>
      </View>

      {/* Question Section */}
      <View style={styles.questionSection}>
        <Text style={[styles.questionNumber, { fontFamily: fontBold, color: Colors.palette.purple.primary }]}>
          {t('quiz.game.question_label')} {currentQuestionIndex + 1}/{questions.length}
        </Text>
        <Text style={[styles.questionText, { fontFamily: fontRegular, color: colors.text.primary }]}>
          {currentQuestion.question}
        </Text>

        {/* Answer Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            const letter = String.fromCharCode(97 + index); // a, b, c, d
            const isSelected = selectedOption === option;
            const isCorrectOption = option === currentQuestion.correctAnswer;

            // Determine border and background colors based on state
            let borderColor = colors.surfaceHighlight || '#E5E7EB';
            let backgroundColor = colors.surface;
            
            if (isSelected) {
              if (isCorrect) {
                  borderColor = '#10B981';
                  backgroundColor = '#D1FAE5';
              } else {
                  borderColor = '#EF4444';
                  backgroundColor = '#FEE2E2';
              }
            } else if (selectedOption && isCorrectOption) {
                borderColor = '#10B981';
                backgroundColor = '#D1FAE5';
            }

            return (
              <Pressable
                key={index}
                style={[
                    styles.option, 
                    { 
                        borderColor: borderColor, 
                        backgroundColor: backgroundColor,
                        shadowColor: colors.text.primary,
                        borderBottomWidth: 4, // Button depth
                    }
                ]}
                onPress={() => handleOptionSelect(option)}
                disabled={!!selectedOption}
              >
                <View style={[styles.optionLetter, { backgroundColor: selectedOption && (isSelected || isCorrectOption) ? 'rgba(255,255,255,0.5)' : colors.surfaceHighlight }]}>
                  <Text style={[styles.optionLetterText, { fontFamily: fontMedium, color: colors.text.secondary }]}>
                    {letter}
                  </Text>
                </View>
                <Text style={[styles.optionText, { fontFamily: fontRegular, color: colors.text.primary }]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10, backgroundColor: colors.surface, borderTopColor: colors.surfaceHighlight }]}>
        {/* Points */}
        <View style={styles.footerItem}>
           <Text style={{ fontSize: 24 }}>🏆</Text>
           <Text style={[styles.pointsText, { fontFamily: fontBold, color: Colors.palette.purple.primary }]}>
             {points} Pts
           </Text>
        </View>

        {/* Joker Button */}
        <Pressable
          style={[styles.footerButton, jokers === 0 && styles.footerButtonDisabled]}
          onPress={handleJoker}
          disabled={jokers === 0}
        >
          <Text style={styles.footerEmoji}>🃏</Text>
        </Pressable>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <View style={[styles.timerCircle, { borderColor: Colors.palette.purple.primary, backgroundColor: colors.background }]}>
            <Text style={[styles.timerText, { fontFamily: fontBold, color: Colors.palette.purple.primary }]}>
              {timeLeft}
            </Text>
             <Text style={[styles.timerLabel, { fontFamily: fontRegular, color: Colors.palette.purple.primary, fontSize: 10 }]}>
              sec
            </Text>
          </View>
        </View>

        {/* Help Button */}
        <Pressable
          style={[styles.footerButton, helps === 0 && styles.footerButtonDisabled]}
          onPress={handleHelp}
          disabled={helps === 0}
        >
           <Text style={styles.footerEmoji}>💡</Text>
        </Pressable>

        {/* Next Button */}
        <Pressable
          style={[styles.nextButton, !selectedOption && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!selectedOption}
        >
          <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
        </Pressable>
      </View>
      </>
      )}
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
    paddingBottom: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    flex: 1,
    textAlign: 'center',
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
    marginBottom: 0,
  },
  lifelinesRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  lifelineItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  lifelineCount: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  questionSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  questionNumber: {
    fontSize: 22,
    marginBottom: 12,
  },
  questionText: {
    fontSize: 18,
    marginBottom: 24,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 14,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  optionLetter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLetterText: {
    fontSize: 14,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  footerItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  footerButtonDisabled: {
    opacity: 0.3, 
    backgroundColor: '#F9FAFB',
  },
  footerEmoji: {
      fontSize: 24,
  },
  pointsText: {
    fontSize: 12,
    marginTop: 2,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 20,
    lineHeight: 22,
  },
  timerLabel: {
      marginTop: -2,
  },
  nextButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
});
