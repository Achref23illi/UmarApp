import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/config/colors';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/store/hooks';

export default function QuizResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors } = useTheme();
  
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

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.palette.purple.dark, Colors.palette.purple.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
          {/* User Avatar */}
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.surface }]}>
              <Ionicons name="person" size={60} color={colors.text.secondary} />
            </View>
          </View>

          {/* User Name */}
          <Text style={[styles.userName, { fontFamily: fontMedium }]}>
            {currentUser.name || 'User'}
          </Text>

          {/* Congratulations */}
          <View style={styles.congratsContainer}>
            <Ionicons name="trophy" size={32} color={Colors.palette.gold.primary} />
            <Text style={[styles.congratsText, { fontFamily: fontBold }]}>
              {t('quiz.results.congrats')}
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="grid" size={24} color="#FFFFFF" />
              <Text style={[styles.statLabel, { fontFamily: fontRegular }]}>{t('quiz.results.score_label')}</Text>
              <Text style={[styles.statValue, { fontFamily: fontBold }]}>{score}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="bulb" size={24} color="#FFFFFF" />
              <Text style={[styles.statLabel, { fontFamily: fontRegular }]}>2</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="happy" size={24} color="#FFFFFF" />
              <Text style={[styles.statLabel, { fontFamily: fontRegular }]}>1</Text>
            </View>
          </View>

          {/* Theme */}
          <View style={styles.themeContainer}>
            <Text style={[styles.themeLabel, { fontFamily: fontRegular }]}>{t('quiz.results.theme_label')}</Text>
            <Text style={[styles.themeValue, { fontFamily: fontMedium }]}>{theme}</Text>
          </View>

          {/* View Ranking */}
          <Pressable style={styles.rankingButton}>
            <Text style={[styles.rankingText, { fontFamily: fontMedium }]}>
              {t('quiz.results.ranking')}
            </Text>
          </Pressable>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.surface }]}
              onPress={() => router.push('/quiz/level-selection')}
            >
              <Text style={[styles.actionButtonText, { fontFamily: fontMedium, color: Colors.palette.purple.primary }]}>
                {t('quiz.results.new_game')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, { backgroundColor: 'transparent', borderColor: '#FFF', borderWidth: 1 }]}
              onPress={() => router.push('/(tabs)/quizz')}
            >
              <Text style={[styles.actionButtonText, { fontFamily: fontMedium, color: '#FFF' }]}>
                {t('quiz.results.menu')}
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
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  congratsText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 30,
    marginBottom: 32,
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
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
    color: 'rgba(255,255,255,0.9)',
  },
  themeValue: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  rankingButton: {
    marginBottom: 'auto',
  },
  rankingText: {
    fontSize: 16,
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    marginBottom: 40,
  },
  actionButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 16,
  },
});
