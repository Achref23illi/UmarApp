/**
 * Quiz Setup Game Screen
 * ======================
 * Select level and theme for the multiplayer quiz
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QuizBottomNav } from '@/components/quiz/QuizBottomNav';
import { QuizHeader } from '@/components/quiz/QuizHeader';
import { getFont } from '@/hooks/use-fonts';
import { useAppSelector } from '@/store/hooks';

const levels = [
  { id: 'debutant', title: 'DÉBUTANT' },
  { id: 'intermediaire', title: 'INTERMÉDIAIRE' },
  { id: 'expert', title: 'EXPERT' },
];

const themes = [
  { id: 1, name: 'La vie du Prophète sws' },
  { id: 2, name: "Les piliers de l'islam" },
  { id: 3, name: 'La foi' },
  { id: 4, name: 'Le Coran' },
  { id: 5, name: 'Jurisprudence' },
];

export default function SetupGameScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { participantCount } = useLocalSearchParams<{ participantCount: string }>();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);

  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<number | null>(null);

  const handleStartGame = () => {
    if (!selectedLevel) {
      Alert.alert('Erreur', 'Veuillez sélectionner un niveau');
      return;
    }
    if (!selectedTheme) {
      Alert.alert('Erreur', 'Veuillez sélectionner un thème');
      return;
    }

    // Navigate to new quiz game screen
    const selectedThemeName = themes.find(t => t.id === selectedTheme)?.name || '';
    router.push({
      pathname: '/quiz/game',
      params: {
        theme: selectedThemeName,
        level: selectedLevel || '',
        responseTime: '30',
        numberOfQuestions: '20',
        numberOfJokers: '1',
        numberOfHelps: '3',
      },
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

      {/* Header */}
      <QuizHeader />

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Participants Info */}
        <View style={styles.infoSection}>
          <Text style={[styles.infoText, { fontFamily: fontRegular }]}>
            {participantCount} participant{parseInt(participantCount || '0') > 1 ? 's' : ''}
          </Text>
          <Text style={styles.emoji}>😊</Text>
        </View>

        {/* Level Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: fontBold }]}>
            Sélectionnez le niveau :
          </Text>
          
          <View style={styles.levelButtons}>
            {levels.map((level, index) => (
              <Animated.View
                key={level.id}
                entering={FadeInDown.delay(index * 50).springify()}
              >
                <Pressable
                  style={[
                    styles.levelButton,
                    selectedLevel === level.id && styles.levelButtonSelected
                  ]}
                  onPress={() => setSelectedLevel(level.id)}
                >
                  <Text style={[
                    styles.levelButtonText,
                    { fontFamily: fontBold },
                    selectedLevel === level.id && styles.levelButtonTextSelected
                  ]}>
                    {level.title}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Theme Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: fontBold }]}>
            Choisissez un thème :
          </Text>
          
          <View style={styles.themeButtons}>
            {themes.map((theme, index) => (
              <Animated.View
                key={theme.id}
                entering={FadeInDown.delay(index * 50).springify()}
              >
                <Pressable
                  style={[
                    styles.themeButton,
                    selectedTheme === theme.id && styles.themeButtonSelected
                  ]}
                  onPress={() => setSelectedTheme(theme.id)}
                >
                  <Text style={[
                    styles.themeButtonText,
                    { fontFamily: fontRegular },
                    selectedTheme === theme.id && styles.themeButtonTextSelected
                  ]}>
                    {theme.name}
                  </Text>
                  {selectedTheme === theme.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#8B5CF6" />
                  )}
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Custom Bottom Navigation */}
      <QuizBottomNav
        onBack={() => router.back()}
        onNext={handleStartGame}
        nextLabel="Commencer"
      />
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
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 30,
  },
  infoText: {
    fontSize: 18,
    color: '#374151',
  },
  emoji: {
    fontSize: 24,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#374151',
    marginBottom: 16,
  },
  levelButtons: {
    gap: 12,
  },
  levelButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: '#8B5CF6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  levelButtonSelected: {
    backgroundColor: '#6D28D9',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  levelButtonText: {
    fontSize: 18,
    color: '#FCD34D',
    textAlign: 'center',
  },
  levelButtonTextSelected: {
    color: '#FFFFFF',
  },
  themeButtons: {
    gap: 12,
  },
  themeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  themeButtonSelected: {
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  themeButtonText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  themeButtonTextSelected: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
});
