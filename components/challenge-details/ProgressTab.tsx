import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { toast } from '@/components/ui/Toast';
import { Colors } from '@/config/colors';
import { useTheme } from '@/hooks/use-theme';
import { challengeDetailsService, ChallengeLevelDashboard } from '@/services/challengeDetailsService';
import { useAppSelector } from '@/store/hooks';

export default function ProgressTab({ levelId }: { levelId?: string }) {
  const { colors } = useTheme();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);

  const params = useLocalSearchParams();
  const levelIdFromParams = useMemo(() => {
    const raw = (params as any)?.id ?? (params as any)?.levelId;
    return typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
  }, [params]);

  const resolvedLevelId = levelId || levelIdFromParams;

  const [dashboard, setDashboard] = useState<ChallengeLevelDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      if (!resolvedLevelId) return;
      setIsLoading(true);
      setError(null);
      const dash = await challengeDetailsService.getLevelDashboard(resolvedLevelId, currentLanguage);
      setDashboard(dash);
    } catch (e) {
      console.error('Failed to load progress tab:', e);
      setDashboard(null);
      setError('Unable to load progress');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedLevelId, currentLanguage]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {isLoading ? (
        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error ? (
        <View style={{ paddingVertical: 20 }}>
          <Text style={{ color: colors.text.secondary }}>{error}</Text>
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text.primary }]}>Progression</Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          {dashboard ? `${dashboard.completionRate}% • ${dashboard.streak} jours streak • ${dashboard.daysLeft} jours restants` : '—'}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text.primary }]}>7 derniers jours</Text>
        <View style={styles.weekRow}>
          {(dashboard?.weeklyActivity ?? []).map((d) => (
            <View key={d.dateISO} style={styles.dayCol}>
              <View
                style={[
                  styles.dayDot,
                  { backgroundColor: d.value > 0 ? Colors.palette.purple.primary : colors.surfaceHighlight },
                ]}
              />
              <Text style={[styles.dayLabel, { color: colors.text.secondary }]}>{d.day}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={async () => {
            try {
              if (!resolvedLevelId) return;
              const result = await challengeDetailsService.toggleTodayCompletion(resolvedLevelId);
              if (result.autoAdvancedToNextLevel) {
                toast.show({
                  type: 'success',
                  message: result.nextLevelTitle
                    ? `Niveau débloqué: ${result.nextLevelTitle}`
                    : 'Nouveau niveau débloqué.',
                });
              } else if (result.challengeCompleted && result.doneToday) {
                toast.show({
                  type: 'success',
                  message: 'MashaAllah, challenge terminé.',
                });
              }
              await load();
            } catch (e) {
              console.error('Failed to toggle today completion:', e);
            }
          }}
          style={[styles.button, { backgroundColor: Colors.palette.purple.primary }]}
        >
          <Text style={styles.buttonText}>{dashboard?.doneToday ? "Annuler aujourd'hui" : "Marquer aujourd'hui"}</Text>
        </Pressable>
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  dayCol: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  dayDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dayLabel: {
    fontSize: 10,
  },
  button: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
});
