import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import ActiveChallengeCard from './ActiveChallengeCard';
import CompletedChallengeCard from './CompletedChallengeCard';
import { challengeDetailsService } from '@/services/challengeDetailsService';
import { ChallengeCategory } from '@/services/challengeService';
import { useTheme } from '@/hooks/use-theme';
import { getFont } from '@/hooks/use-fonts';
import { useAppSelector } from '@/store/hooks';

const BG_IMAGE = require('@/assets/images/bg-wa.jpg');

type Props = { onSwitchToChallenges?: () => void };

export default function MyChallengesView({ onSwitchToChallenges }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const fontBold = getFont(currentLanguage, 'bold');

  const [active, setActive] = useState<Array<{ level: { id: string; title: string; durationDays: number }; category: ChallengeCategory; progress: number }>>([]);
  const [completed, setCompleted] = useState<Array<{ level: { id: string; title: string }; category: ChallengeCategory; completedAt?: string }>>([]);
  const [loading, setLoading] = useState(true);

  const loadMyChallenges = useCallback(async () => {
    try {
      setLoading(true);
      const result = await challengeDetailsService.getMyChallenges();
      setActive(result.active);
      setCompleted(result.completed);
    } catch (error) {
      console.error('Failed to load my challenges:', error);
      setActive([]);
      setCompleted([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyChallenges();
  }, [loadMyChallenges]);

  if (loading) {
    return (
      <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const hasAny = active.length > 0 || completed.length > 0;
  if (!hasAny) {
    return (
      <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.text.primary }]}>Aucun challenge en cours</Text>
        <Text style={[styles.emptySubText, { color: colors.text.secondary }]}>
          Commencez un challenge depuis l’onglet Challenge pour le retrouver ici.
        </Text>
        <Pressable
          onPress={onSwitchToChallenges}
          style={{ marginTop: 16, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.primary }}
        >
          <Text style={{ color: '#fff', fontFamily: fontBold }}>Voir les challenges</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {active.length > 0 && (
        <View style={styles.section}>
          {active.map(({ level, category, progress }) => (
            <Pressable key={level.id} onPress={() => router.push(`/challenge-details/level/${level.id}`)}>
              <ActiveChallengeCard
                title={category.title}
                duration={category.duration}
                levels={category.levels}
                prerequisite={category.prerequisite}
                imageSource={category.imageUrl ? { uri: category.imageUrl } : BG_IMAGE}
              />
            </Pressable>
          ))}
        </View>
      )}

      {completed.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Challenges terminés</Text>
          <View style={styles.grid}>
            {completed.map(({ level, category, completedAt }) => (
              <CompletedChallengeCard
                key={level.id}
                title={category.title}
                date={completedAt ? new Date(completedAt).toLocaleDateString('fr-FR') : '—'}
                progress={100}
                imageSource={category.imageUrl ? { uri: category.imageUrl } : BG_IMAGE}
              />
            ))}
          </View>
        </View>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Metropolis-Bold',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
