import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { QuizQuestion, socialService } from '@/services/socialService';
import { useAppSelector } from '@/store/hooks';

const { width } = Dimensions.get('window');

export default function QuizGameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); // This will be the Category ID or Quiz ID
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [quizComplete, setQuizComplete] = useState(false);

  // Animations
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    loadQuiz();
  }, [id]);

  useEffect(() => {
    if (questions.length > 0) {
      const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
      progressWidth.value = withTiming(progress, { duration: 500 });
    }
  }, [currentQuestionIndex, questions.length]);

  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);

  const loadQuiz = async () => {
    setLoading(true);
    // Fetch questions specifically for this category
    const data = await socialService.getQuestionsByCategoryId(id);
    
    let activeQuestions = data;
    let activeQuizId = data.length > 0 ? data[0].quiz_id : null;

    // If no data found (fallback)
    if (data.length === 0) {
        // Fallback logic kept for safety
        const generalData = await socialService.getQuestions();
        const adapted: QuizQuestion[] = generalData.map((q: any) => ({
            id: q.id,
            quiz_id: 'temp_quiz_id', // Needs acts like a real ID for consistency
            question: q.question,
            options: q.answers || q.options || [],
            correct_answer: q.correct_answer
        }));
        activeQuestions = adapted.slice(0, 5);
        activeQuizId = 'temp_quiz_id';
    }
    
    setQuestions(activeQuestions);
    if (activeQuizId) {
        setCurrentQuizId(activeQuizId);
        
        // Restore Progress
        const progress = await socialService.getQuizProgress(activeQuizId);
        if (progress && progress.status === 'in_progress') {
            setCurrentQuestionIndex(progress.current_question_index);
            setScore(progress.score);
        }
    }
    
    setLoading(false);
  };

  const handleOptionPress = async (option: string) => {
    if (selectedOption) return; // Prevent multiple guesses

    const currentQ = questions[currentQuestionIndex];
    const currentCorrect = currentLanguage === 'fr' ? (currentQ.correct_answer_fr || currentQ.correct_answer) : currentQ.correct_answer;

    setSelectedOption(option);
    const correct = option === currentCorrect;
    setIsCorrect(correct);

    const newScore = correct ? score + 1 : score;
    if (correct) setScore(newScore);

    // Save Progress
    if (currentQuizId) {
        await socialService.saveQuizProgress(
            currentQuizId, 
            currentQuestionIndex + 1, 
            newScore, 
            currentQuestionIndex >= questions.length - 1 ? 'completed' : 'in_progress'
        );
    }

    // Auto advance
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedOption(null);
        setIsCorrect(null);
      } else {
        setQuizComplete(true);
      }
    }, 1500);
  };

  const currentQuestion = questions[currentQuestionIndex];

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#FFF" />
      </View>
    );
  }

  if (quizComplete) {
    return (
      <View style={styles.container}>
        <LinearGradient
            colors={['#4C1D95', '#7C3AED']}
            style={styles.background}
        />
        <View style={[styles.content, { paddingTop: insets.top + 40, alignItems: 'center' }]}>
            <Ionicons name="trophy" size={80} color="#FBBF24" />
            <Text style={styles.scoreTitle}>Quiz Complete!</Text>
            <Text style={styles.scoreText}>You scored {score} / {questions.length}</Text>
            
            <Pressable onPress={() => router.back()} style={styles.button}>
                <Text style={styles.buttonText}>Back to Categories</Text>
            </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8B5CF6', '#4C1D95']}
        style={styles.background}
      />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={24} color="#FFF" />
        </Pressable>
        <View style={styles.progressBarBg}>
            <Animated.View style={[styles.progressBarFill, progressStyle]} />
        </View>
        <Text style={styles.progressText}>{currentQuestionIndex + 1}/{questions.length}</Text>
      </View>

      {/* Question */}
      <View style={styles.content}>
        {currentQuestion && (
            <Animated.View key={currentQuestion.id}>
                <Text style={styles.questionText}>
                    {currentLanguage === 'fr' ? (currentQuestion.question_fr || currentQuestion.question) : currentQuestion.question}
                </Text>
                
                <View style={styles.optionsContainer}>
                    {(currentLanguage === 'fr' && currentQuestion.options_fr ? currentQuestion.options_fr : currentQuestion.options).map((option, index) => {
                        const isSelected = selectedOption === option;
                        // For validation, we need to compare against the correct answer in the CURRENT language
                        const currentCorrect = currentLanguage === 'fr' ? (currentQuestion.correct_answer_fr || currentQuestion.correct_answer) : currentQuestion.correct_answer;
                        const isCorrectOption = option === currentCorrect;
                        
                        let backgroundColor = 'rgba(255,255,255,0.15)';
                        if (isSelected) {
                            backgroundColor = isCorrect ? '#10B981' : '#EF4444';
                        } else if (selectedOption && isCorrectOption) {
                            backgroundColor = '#10B981'; // Show correct answer if wrong one picked
                        }

                        return (
                            <Pressable 
                                key={index} 
                                style={[styles.optionButton, { backgroundColor }]}
                                onPress={() => handleOptionPress(option)}
                            >
                                <Text style={styles.optionText}>{option}</Text>
                                {isSelected && (
                                    <Ionicons 
                                        name={isCorrect ? "checkmark-circle" : "close-circle"} 
                                        size={24} 
                                        color="#FFF" 
                                    />
                                )}
                            </Pressable>
                        )
                    })}
                </View>
            </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4C1D95',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  center: {
      justifyContent: 'center',
      alignItems: 'center',
  },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 20,
      gap: 12,
  },
  backButton: {
      padding: 8,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 20,
  },
  progressBarBg: {
      flex: 1,
      height: 8,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 4,
      overflow: 'hidden',
  },
  progressBarFill: {
      height: '100%',
      backgroundColor: '#FBBF24',
      borderRadius: 4,
  },
  progressText: {
      color: '#FFF',
      fontWeight: 'bold',
  },
  content: {
      flex: 1,
      paddingHorizontal: 24,
      justifyContent: 'center',
  },
  questionText: {
      fontSize: 24,
      color: '#FFF',
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 40,
      lineHeight: 32,
  },
  optionsContainer: {
      gap: 16,
  },
  optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
  },
  optionText: {
      color: '#FFF',
      fontSize: 18,
      fontWeight: '600',
  },
  scoreTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#FFF',
      marginTop: 20,
      marginBottom: 10,
  },
  scoreText: {
      fontSize: 20,
      color: 'rgba(255,255,255,0.8)',
      marginBottom: 40,
  },
  button: {
      backgroundColor: '#FBBF24',
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: 30,
  },
  buttonText: {
      color: '#4C1D95',
      fontWeight: 'bold',
      fontSize: 18,
  }
});
