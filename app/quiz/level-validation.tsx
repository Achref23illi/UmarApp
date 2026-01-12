/**
 * Quiz Level Validation Screen
 * =============================
 * Users answer questions to validate their selected level
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFont } from '@/hooks/use-fonts';
import { useAppSelector } from '@/store/hooks';

export default function LevelValidationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { level } = useLocalSearchParams<{ level: string }>();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);

  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  const [showLevelConfirmation, setShowLevelConfirmation] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(1);

  const levelTitles: Record<string, string> = {
    debutant: 'DÉBUTANT',
    intermediaire: 'INTERMÉDIAIRE',
    expert: 'EXPERT',
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
    <View style={styles.container}>
      {/* Background Pattern */}
      <Image
        source={require('@/assets/images/quizz_background.png')}
        style={styles.backgroundImage}
        contentFit="cover"
      />

      {/* Curved Header */}
      <View style={styles.curvedHeader}>
        <LinearGradient
          colors={['#7C3AED', '#A855F7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <Ionicons name="star" size={60} color="#FCD34D" style={styles.starLeft} />
          <Ionicons name="star" size={40} color="#FCD34D" style={styles.starRight} />
          
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <View style={styles.logoContainer}>
              <Text style={[styles.logo, { fontFamily: fontBold }]}>QUIZZ</Text>
            </View>
            <Pressable 
              style={styles.settingsButton}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings-outline" size={28} color="#FFF" />
            </Pressable>
          </View>
        </LinearGradient>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { fontFamily: fontRegular }]}>
            Voyons si vous ne vous
          </Text>
          <Text style={[styles.title, { fontFamily: fontRegular }]}>
            êtes pas trompé
          </Text>
          <Text style={[styles.title, { fontFamily: fontRegular }]}>
            de chemin
          </Text>
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>😊</Text>
          </View>
        </View>

        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={[styles.questionLabel, { fontFamily: fontBold }]}>
            Q{currentQuestion}
          </Text>
          <Text style={[styles.questionText, { fontFamily: fontRegular }]}>
            Question {currentQuestion}........................ ?
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
                  { transform: [{ scale: pressed ? 0.98 : 1 }] }
                ]}
                onPress={handleAnswer}
              >
                <Text style={[styles.answerText, { fontFamily: fontBold }]}>
                  Réponse {answer}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        {/* Back Button */}
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { fontFamily: fontMedium }]}>
            Revenir
          </Text>
        </Pressable>
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
            style={styles.modalContent}
          >
            <View style={styles.modalCard}>
              {/* Decorative Stars */}
              <Ionicons name="star-outline" size={30} color="#8B5CF6" style={styles.modalStarTopLeft} />
              <Ionicons name="star" size={24} color="#8B5CF6" style={styles.modalStarTopRight} />
              <Ionicons name="star-outline" size={20} color="#8B5CF6" style={styles.modalStarBottomLeft} />
              <Ionicons name="star" size={28} color="#8B5CF6" style={styles.modalStarBottomRight} />
              <View style={styles.modalCircle1} />
              <View style={styles.modalCircle2} />

              <Text style={[styles.modalWelcome, { fontFamily: fontRegular }]}>
                BIENVENUE DANS
              </Text>
              <Text style={[styles.modalWelcome, { fontFamily: fontRegular }]}>
                LE NIVEAU
              </Text>
              <Text style={[styles.modalLevel, { fontFamily: fontBold }]}>
                {levelTitles[level || 'intermediaire']}
              </Text>

              <Pressable
                style={styles.modalContinueButton}
                onPress={handleLevelConfirmed}
              >
                <Text style={[styles.modalContinueText, { fontFamily: fontMedium }]}>
                  Continuer
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
    backgroundColor: '#F5F5F5',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.4,
  },
  curvedHeader: {
    width: '100%',
    height: 200,
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
    paddingBottom: 30,
    position: 'relative',
  },
  starLeft: {
    position: 'absolute',
    top: 30,
    left: 80,
    opacity: 0.9,
    transform: [{ rotate: '-15deg' }],
  },
  starRight: {
    position: 'absolute',
    top: 20,
    right: 60,
    opacity: 0.9,
    transform: [{ rotate: '15deg' }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    color: '#FFFFFF',
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 20,
    top: 0,
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
    fontSize: 20,
    color: '#374151',
    textAlign: 'center',
  },
  emojiContainer: {
    marginTop: 10,
  },
  emoji: {
    fontSize: 40,
  },
  questionContainer: {
    marginBottom: 30,
  },
  questionLabel: {
    fontSize: 28,
    color: '#FCD34D',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    color: '#374151',
  },
  answersContainer: {
    gap: 16,
    marginBottom: 30,
  },
  answerButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  answerText: {
    fontSize: 18,
    color: '#FCD34D',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FCD34D',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  modalStarTopLeft: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  modalStarTopRight: {
    position: 'absolute',
    top: 30,
    right: 30,
  },
  modalStarBottomLeft: {
    position: 'absolute',
    bottom: 40,
    left: 30,
  },
  modalStarBottomRight: {
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
  modalCircle1: {
    position: 'absolute',
    top: 80,
    left: 40,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  modalCircle2: {
    position: 'absolute',
    bottom: 80,
    right: 50,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  modalWelcome: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
  modalLevel: {
    fontSize: 32,
    color: '#8B5CF6',
    textAlign: 'center',
    marginVertical: 16,
  },
  modalContinueButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 10,
  },
  modalContinueText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});
