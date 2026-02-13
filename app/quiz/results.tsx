import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/config/colors';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { QuizSessionSnapshot, quizSessionService } from '@/services/quizSessionService';
import { useAppSelector } from '@/store/hooks';

type ResultPlayer = {
  id: string;
  name: string;
  score: number;
  isCurrentUser: boolean;
};

type ResultSummary = {
  mode: string;
  totalQuestions: number;
  players: ResultPlayer[];
  winner: string;
  themeLabel: string;
};

export default function QuizResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const { sessionId, summary } = useLocalSearchParams<{ sessionId?: string; summary?: string }>();

  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const currentUser = useAppSelector((state) => state.user);

  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  const [isLoading, setIsLoading] = useState(true);
  const [resultSummary, setResultSummary] = useState<ResultSummary | null>(null);

  const tr = useCallback(
    (key: string, fallback: string) => {
      const translated = t(key);
      return translated === key ? fallback : translated;
    },
    [t]
  );

  useEffect(() => {
    let isMounted = true;

    const buildOnlineSummary = async (snapshot: QuizSessionSnapshot): Promise<ResultSummary> => {
      let themeLabel = 'Quiz';

      if (snapshot.session.category_id) {
        const { data } = await supabase
          .from('quiz_categories')
          .select('name, name_fr')
          .eq('id', snapshot.session.category_id)
          .single();

        if (data) {
          themeLabel = currentLanguage === 'fr' && data.name_fr ? data.name_fr : data.name;
        }
      }

      const players = [...snapshot.players]
        .filter((player) => player.status !== 'left')
        .sort((a, b) => b.score - a.score || a.seat_order - b.seat_order)
        .map((player) => ({
          id: player.id,
          name: player.display_name,
          score: player.score,
          isCurrentUser: player.user_id === currentUser.id,
        }));

      return {
        mode: snapshot.session.mode,
        totalQuestions: snapshot.session.question_ids.length,
        players,
        winner: players[0]?.name || '',
        themeLabel,
      };
    };

    const load = async () => {
      try {
        setIsLoading(true);

        if (summary) {
          const parsed = JSON.parse(decodeURIComponent(summary)) as {
            mode: string;
            totalQuestions: number;
            players: { id: string; displayName: string; score: number }[];
            winner: string;
          };

          const players: ResultPlayer[] = parsed.players
            .map((player) => ({
              id: player.id,
              name: player.displayName,
              score: player.score,
              isCurrentUser: false,
            }))
            .sort((a, b) => b.score - a.score);

          if (!isMounted) return;
          setResultSummary({
            mode: parsed.mode,
            totalQuestions: parsed.totalQuestions,
            players,
            winner: parsed.winner,
            themeLabel: tr('quiz.v2.hotseat_title', 'Offline Hot-seat'),
          });
          return;
        }

        if (sessionId) {
          const snapshot = await quizSessionService.getSessionSnapshot(sessionId);
          const onlineSummary = await buildOnlineSummary(snapshot);
          if (!isMounted) return;
          setResultSummary(onlineSummary);
          return;
        }

        if (!isMounted) return;
        setResultSummary(null);
      } catch (error) {
        console.error('Failed to load results', error);
        if (isMounted) {
          setResultSummary(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [sessionId, summary, currentLanguage, currentUser.id, tr]);

  const currentUserScore = useMemo(() => {
    if (!resultSummary) return null;
    return (
      resultSummary.players.find((player) => player.isCurrentUser) ||
      resultSummary.players[0] ||
      null
    );
  }, [resultSummary]);

  if (isLoading) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Colors.palette.purple.primary} />
      </View>
    );
  }

  if (!resultSummary) {
    return (
      <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text.secondary, marginBottom: 12 }}>
          {tr('quiz.results.no_data', 'No result data available.')}
        </Text>
        <Pressable
          style={[styles.simpleButton, { backgroundColor: Colors.palette.purple.primary }]}
          onPress={() => router.replace('/(tabs)/quizz')}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>
            {tr('quiz.results.back_to_menu', 'Back to quiz menu')}
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.palette.purple.dark, Colors.palette.purple.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 30 },
          ]}
        >
          <View style={styles.winnerRow}>
            <Ionicons name="trophy" size={30} color={Colors.palette.gold.primary} />
            <Text style={[styles.winnerTitle, { fontFamily: fontBold }]}>
              {tr('quiz.results.congrats', 'Congratulations')}
            </Text>
          </View>

          <Text style={[styles.winnerName, { fontFamily: fontBold }]}>
            {resultSummary.winner || '-'}
          </Text>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { fontFamily: fontRegular }]}>
                {tr('quiz.results.mode_label', 'Mode')}
              </Text>
              <Text style={[styles.statValue, { fontFamily: fontBold }]}>
                {resultSummary.mode.toUpperCase()}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { fontFamily: fontRegular }]}>
                {tr('quiz.results.theme_label', 'Theme')}
              </Text>
              <Text style={[styles.statValue, { fontFamily: fontBold }]}>
                {resultSummary.themeLabel}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { fontFamily: fontRegular }]}>
                {tr('quiz.results.questions_label', 'Questions')}
              </Text>
              <Text style={[styles.statValue, { fontFamily: fontBold }]}>
                {resultSummary.totalQuestions}
              </Text>
            </View>
          </View>

          <View style={styles.scoreCard}>
            <Text style={[styles.scoreTitle, { fontFamily: fontMedium }]}>
              {tr('quiz.results.leaderboard', 'Leaderboard')}
            </Text>

            {resultSummary.players.map((player, index) => (
              <View
                key={player.id}
                style={[styles.scoreRow, player.isCurrentUser && styles.scoreRowCurrent]}
              >
                <Text style={[styles.rankText, { fontFamily: fontBold }]}>{index + 1}</Text>
                <Text
                  style={[
                    styles.playerText,
                    { fontFamily: player.isCurrentUser ? fontBold : fontRegular },
                  ]}
                >
                  {player.name}
                </Text>
                <Text style={[styles.playerScore, { fontFamily: fontBold }]}>{player.score}</Text>
              </View>
            ))}
          </View>

          {currentUserScore ? (
            <Text style={[styles.currentScore, { fontFamily: fontMedium }]}>
              {tr('quiz.results.score_label', 'Score')}: {currentUserScore.score}
            </Text>
          ) : null}

          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: '#fff' }]}
              onPress={() =>
                router.replace({
                  pathname: '/quiz/game-settings',
                  params: { mode: resultSummary.mode },
                })
              }
            >
              <Text
                style={[
                  styles.actionButtonText,
                  { fontFamily: fontBold, color: Colors.palette.purple.primary },
                ]}
              >
                {tr('quiz.results.new_game', 'New game')}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.actionButton, styles.ghostButton]}
              onPress={() => router.replace('/(tabs)/quizz')}
            >
              <Text style={[styles.actionButtonText, { fontFamily: fontMedium, color: '#fff' }]}>
                {tr('quiz.results.menu', 'Quiz menu')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
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
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simpleButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  winnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  winnerTitle: {
    fontSize: 28,
    color: '#fff',
  },
  winnerName: {
    fontSize: 22,
    color: '#fff',
    marginBottom: 18,
  },
  statsGrid: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    gap: 8,
  },
  statItem: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginBottom: 3,
  },
  statValue: {
    color: '#fff',
    fontSize: 13,
    textAlign: 'center',
  },
  scoreCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 14,
  },
  scoreTitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  scoreRowCurrent: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  rankText: {
    width: 22,
    color: '#fff',
    fontSize: 14,
  },
  playerText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  playerScore: {
    color: '#fff',
    fontSize: 15,
  },
  currentScore: {
    color: '#fff',
    fontSize: 15,
    marginBottom: 14,
  },
  actionButtons: {
    width: '100%',
    gap: 10,
  },
  actionButton: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ghostButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: 'transparent',
  },
  actionButtonText: {
    fontSize: 15,
  },
});
