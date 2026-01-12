/**
 * Quiz Game Screen
 * ================
 * Main quiz gameplay screen with questions, answers, and footer controls
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFont } from '@/hooks/use-fonts';
import { useAppSelector } from '@/store/hooks';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

// Mock questions for now - replace with actual data
const mockQuestions: QuizQuestion[] = [
  {
    id: '1',
    question: "Quel sont les prénoms des quatre fille du Prophète ﷺ ?",
    options: [
      "Khadidja, Umm Kheltoum, Fatima, Rokia",
      "Zainab, Fatima, Umm Kheltoum, Rokia",
      "Zainab, Fatima, Umm Habiba, Rokia",
      "Fatima, Umm Habiba, Rokia, Khadidja",
    ],
    correctAnswer: "Zainab, Fatima, Umm Kheltoum, Rokia",
  },
  // Add more questions...
];

export default function QuizGameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
  const [questions] = useState<QuizQuestion[]>(mockQuestions.slice(0, parseInt(numberOfQuestions)));

  const currentQuestion = questions[currentQuestionIndex];

  // Timer countdown
  useEffect(() => {
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
      setPoints(points + 1);
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
          theme: theme || '',
        },
      });
    }
  };

  const handleJoker = () => {
    if (jokers > 0 && !selectedOption) {
      // Remove 2 wrong answers
      setJokers(jokers - 1);
      // TODO: Implement joker logic
    }
  };

  const handleHelp = () => {
    if (helps > 0 && !selectedOption) {
      // Show hint or remove one wrong answer
      setHelps(helps - 1);
      // TODO: Implement help logic
    }
  };

  const isCorrect = selectedOption === currentQuestion.correctAnswer;

  return (
    <View style={styles.container}>
      {/* Background Pattern */}
      <Image
        source={require('@/assets/images/quizz_background.png')}
        style={styles.backgroundImage}
        contentFit="cover"
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="#000000" />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: fontBold }]}>
          Thème : {theme || 'Histoire'}
        </Text>
        <View style={styles.closeButton} />
      </View>

      {/* Player Scores (for multiplayer) */}
      <View style={styles.playersRow}>
        {[1, 2, 3, 4].map((player) => (
          <View key={player} style={styles.playerAvatar}>
            <View style={styles.avatarCircle} />
            <View style={styles.scoreBadge}>
              <Text style={[styles.scoreText, { fontFamily: fontMedium }]}>11</Text>
            </View>
          </View>
        ))}
        <View style={styles.lifelinesRow}>
          <View style={styles.lifelineItem}>
            <Ionicons name="lifebuoy-outline" size={20} color="#6B7280" />
            <Text style={[styles.lifelineCount, { fontFamily: fontRegular }]}>0</Text>
          </View>
          <View style={styles.lifelineItem}>
            <Ionicons name="happy-outline" size={20} color="#6B7280" />
            <Text style={[styles.lifelineCount, { fontFamily: fontRegular }]}>0</Text>
          </View>
          <View style={styles.lifelineItem}>
            <Ionicons name="people-outline" size={20} color="#6B7280" />
            <Text style={[styles.lifelineCount, { fontFamily: fontRegular }]}>7</Text>
          </View>
        </View>
      </View>

      {/* Question Section */}
      <View style={styles.questionSection}>
        <Text style={[styles.questionNumber, { fontFamily: fontBold }]}>
          Question {currentQuestionIndex + 1}/{questions.length}
        </Text>
        <Text style={[styles.questionText, { fontFamily: fontRegular }]}>
          {currentQuestion.question}
        </Text>

        {/* Answer Options */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            const letter = String.fromCharCode(97 + index); // a, b, c, d
            const isSelected = selectedOption === option;
            const isCorrectOption = option === currentQuestion.correctAnswer;

            let optionStyle = styles.option;
            if (isSelected) {
              optionStyle = isCorrect ? styles.optionCorrect : styles.optionWrong;
            } else if (selectedOption && isCorrectOption) {
              optionStyle = styles.optionCorrect;
            }

            return (
              <Pressable
                key={index}
                style={optionStyle}
                onPress={() => handleOptionSelect(option)}
                disabled={!!selectedOption}
              >
                <View style={styles.optionLetter}>
                  <Text style={[styles.optionLetterText, { fontFamily: fontMedium }]}>
                    {letter}
                  </Text>
                </View>
                <Text style={[styles.optionText, { fontFamily: fontRegular }]}>
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
        {/* Points */}
        <View style={styles.footerItem}>
          <View style={styles.pointsContainer}>
            <Ionicons name="trophy" size={28} color="#8B5CF6" />
            <Text style={[styles.pointsText, { fontFamily: fontBold }]}>
              {String(points).padStart(2, '0')} Points
            </Text>
          </View>
        </View>

        {/* Joker */}
        <Pressable
          style={[styles.footerItem, jokers === 0 && styles.footerItemDisabled]}
          onPress={handleJoker}
          disabled={jokers === 0}
        >
          <Ionicons name="happy" size={32} color={jokers > 0 ? '#F59E0B' : '#D1D5DB'} />
        </Pressable>

        {/* Timer */}
        <View style={styles.timerContainer}>
          <View style={styles.timerCircle}>
            <Text style={[styles.timerText, { fontFamily: fontBold }]}>
              {timeLeft}s
            </Text>
          </View>
        </View>

        {/* Help */}
        <Pressable
          style={[styles.footerItem, helps === 0 && styles.footerItemDisabled]}
          onPress={handleHelp}
          disabled={helps === 0}
        >
          <Ionicons name="lifebuoy" size={32} color={helps > 0 ? '#F59E0B' : '#D1D5DB'} />
        </Pressable>

        {/* Next Button */}
        <Pressable
          style={[styles.nextButton, !selectedOption && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!selectedOption}
        >
          <Ionicons name="chevron-forward" size={28} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    position: 'relative',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  scoreBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 10,
    color: '#FFFFFF',
  },
  lifelinesRow: {
    flexDirection: 'row',
    marginLeft: 'auto',
    gap: 16,
  },
  lifelineItem: {
    alignItems: 'center',
    gap: 4,
  },
  lifelineCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  questionSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  questionNumber: {
    fontSize: 24,
    color: '#000000',
    marginBottom: 16,
  },
  questionText: {
    fontSize: 18,
    color: '#000000',
    marginBottom: 24,
    lineHeight: 26,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionCorrect: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  optionWrong: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  optionLetter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLetterText: {
    fontSize: 14,
    color: '#6B7280',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerItemDisabled: {
    opacity: 0.4,
  },
  pointsContainer: {
    alignItems: 'center',
    gap: 4,
  },
  pointsText: {
    fontSize: 10,
    color: '#8B5CF6',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  timerText: {
    fontSize: 16,
    color: '#8B5CF6',
  },
  nextButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButtonDisabled: {
    backgroundColor: '#D1D5DB',
    opacity: 0.5,
  },
});
