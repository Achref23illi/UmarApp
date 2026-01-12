/**
 * Quiz Level Selection Screen
 * ============================
 * User selects their knowledge level: DÉBUTANT, INTERMÉDIAIRE, or EXPERT
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFont } from '@/hooks/use-fonts';
import { useAppSelector } from '@/store/hooks';

const levels = [
  {
    id: 'debutant',
    title: 'DÉBUTANT',
    subtitle: "J'ai peu ou pas de connaissances",
    color: '#8B5CF6',
  },
  {
    id: 'intermediaire',
    title: 'INTERMÉDIAIRE',
    subtitle: "J'étudie couci-couça",
    color: '#8B5CF6',
  },
  {
    id: 'expert',
    title: 'EXPERT',
    subtitle: 'Vas-y test moi',
    color: '#8B5CF6',
  },
];

export default function LevelSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);

  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  const handleLevelSelect = (levelId: string) => {
    // Navigate to level validation quiz
    router.push({
      pathname: '/quiz/level-validation',
      params: { level: levelId }
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
            Évaluons votre niveau
          </Text>
          <Text style={[styles.title, { fontFamily: fontRegular }]}>
            vous êtes :
          </Text>
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>😊</Text>
          </View>
        </View>

        {/* Level Buttons */}
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
                <Text style={[styles.levelSubtitle, { fontFamily: fontRegular }]}>
                  {level.subtitle}
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
    marginBottom: 40,
  },
  title: {
    fontSize: 22,
    color: '#374151',
    textAlign: 'center',
  },
  emojiContainer: {
    marginTop: 10,
  },
  emoji: {
    fontSize: 40,
  },
  levelsContainer: {
    gap: 16,
    marginBottom: 30,
  },
  levelButton: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  levelTitle: {
    fontSize: 22,
    color: '#FCD34D',
    textAlign: 'center',
    marginBottom: 4,
  },
  levelSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
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
});
