/**
 * Quiz Results Screen
 * ===================
 * Shows quiz completion results with score, stats, and action buttons
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFont } from '@/hooks/use-fonts';
import { useAppSelector } from '@/store/hooks';

export default function QuizResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    points = '0',
    totalQuestions = '20',
    theme = 'Histoire',
  } = useLocalSearchParams<{
    points?: string;
    totalQuestions?: string;
    theme?: string;
  }>();

  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const currentUser = useAppSelector((state) => state.user);
  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  const score = parseInt(points);
  const total = parseInt(totalQuestions);
  const percentage = Math.round((score / total) * 100);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FCD34D', '#F59E0B', '#7C3AED', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Background Decorations */}
        <Ionicons name="balloon" size={60} color="rgba(255,255,255,0.3)" style={styles.decorTopLeft} />
        <Ionicons name="sparkles" size={50} color="rgba(255,255,255,0.3)" style={styles.decorTopRight} />
        <Ionicons name="sparkles" size={40} color="rgba(255,255,255,0.3)" style={styles.decorMidRight} />
        <Ionicons name="sparkles" size={45} color="rgba(255,255,255,0.3)" style={styles.decorBottomLeft} />
        <Ionicons name="balloon" size={55} color="rgba(255,255,255,0.3)" style={styles.decorBottomRight} />

        <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
          {/* User Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={60} color="#E5E7EB" />
            </View>
          </View>

          {/* User Name */}
          <Text style={[styles.userName, { fontFamily: fontMedium }]}>
            {currentUser.name || 'Mounir B.'}
          </Text>

          {/* Congratulations */}
          <View style={styles.congratsContainer}>
            <Ionicons name="trophy" size={40} color="#FFFFFF" />
            <Text style={[styles.congratsText, { fontFamily: fontBold }]}>
              Félicitation
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="grid" size={24} color="#FFFFFF" />
              <Text style={[styles.statLabel, { fontFamily: fontRegular }]}>SCORE</Text>
              <Text style={[styles.statValue, { fontFamily: fontBold }]}>{score}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="lifebuoy" size={24} color="#FFFFFF" />
              <Text style={[styles.statLabel, { fontFamily: fontRegular }]}>2</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="happy" size={24} color="#FFFFFF" />
              <Text style={[styles.statLabel, { fontFamily: fontRegular }]}>1</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="people" size={24} color="#FFFFFF" />
              <Text style={[styles.statLabel, { fontFamily: fontRegular }]}>7</Text>
            </View>
          </View>

          {/* Theme */}
          <View style={styles.themeContainer}>
            <Text style={[styles.themeLabel, { fontFamily: fontRegular }]}>Thème :</Text>
            <Text style={[styles.themeValue, { fontFamily: fontMedium }]}>{theme}</Text>
          </View>

          {/* View Ranking */}
          <Pressable style={styles.rankingButton}>
            <Text style={[styles.rankingText, { fontFamily: fontMedium }]}>
              Voir le classement
            </Text>
          </Pressable>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable
              style={styles.actionButton}
              onPress={() => router.push('/quiz/level-selection')}
            >
              <Text style={[styles.actionButtonText, { fontFamily: fontMedium }]}>
                Nouvelle partie
              </Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/quizz')}
            >
              <Text style={[styles.actionButtonText, { fontFamily: fontMedium }]}>
                Retour au menu
              </Text>
            </Pressable>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  decorTopLeft: {
    position: 'absolute',
    top: 40,
    left: 20,
  },
  decorTopRight: {
    position: 'absolute',
    top: 30,
    right: 30,
  },
  decorMidRight: {
    position: 'absolute',
    top: '40%',
    right: 20,
  },
  decorBottomLeft: {
    position: 'absolute',
    bottom: 100,
    left: 30,
  },
  decorBottomRight: {
    position: 'absolute',
    bottom: 80,
    right: 25,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 24,
  },
  congratsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
  },
  congratsText: {
    fontSize: 32,
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 32,
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  statValue: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  themeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  themeLabel: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  themeValue: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  rankingButton: {
    marginBottom: 32,
  },
  rankingText: {
    fontSize: 16,
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#8B5CF6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#8B5CF6',
  },
});
