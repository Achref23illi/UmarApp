import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toast } from '@/components/ui/Toast';
import { Colors } from '@/config/colors';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { QuizMode, quizSessionService } from '@/services/quizSessionService';
import { useAppSelector } from '@/store/hooks';

type ModeCard = {
  id: QuizMode;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

export default function QuizzScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const { colors } = useTheme();

  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  const tr = useCallback(
    (key: string, fallback: string) => {
      const translated = t(key);
      return translated === key ? fallback : translated;
    },
    [t]
  );

  const modeCards: ModeCard[] = [
    {
      id: 'solo',
      title: tr('quiz.v2.solo_title', 'Solo Online'),
      subtitle: tr('quiz.v2.solo_desc', 'Play instantly with backend scoring'),
      icon: 'person',
      color: Colors.palette.purple.primary,
    },
    {
      id: 'duo',
      title: tr('quiz.v2.duo_title', 'Duo Online'),
      subtitle: tr('quiz.v2.duo_desc', 'Create a room and play with one friend'),
      icon: 'people',
      color: Colors.palette.purple.dark,
    },
    {
      id: 'group',
      title: tr('quiz.v2.group_title', 'Group Online'),
      subtitle: tr('quiz.v2.group_desc', 'Live group quiz for 3 to 8 players'),
      icon: 'people-circle',
      color: Colors.palette.gold.dark,
    },
    {
      id: 'hotseat',
      title: tr('quiz.v2.hotseat_title', 'Offline Hot-seat'),
      subtitle: tr('quiz.v2.hotseat_desc', '2 to 8 players on one device, sync later'),
      icon: 'phone-portrait',
      color: '#0EA5E9',
    },
  ];

  const runOfflineSync = useCallback(async () => {
    try {
      const result = await quizSessionService.syncOfflineQueue();
      if (result.synced > 0) {
        const msg = t('quiz.v2.sync_success', { count: result.synced });
        toast.show({
          type: 'success',
          message: msg === 'quiz.v2.sync_success'
            ? `Synced ${result.synced} offline game(s).`
            : msg,
        });
      }
    } catch (error) {
      console.error('Offline sync failed:', error);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void runOfflineSync();
    }, [runOfflineSync])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void runOfflineSync();
      }
    });

    return () => subscription.remove();
  }, [runOfflineSync]);

  const handleModePress = (mode: QuizMode) => {
    if (!FEATURE_FLAGS.quizV2) {
      router.push('/quiz/level-selection');
      return;
    }
    router.push({ pathname: '/quiz/game-settings', params: { mode } });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={[styles.headerTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
            {tr('quiz.v2.title', 'Quiz Arena')}
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { fontFamily: fontRegular, color: colors.text.secondary },
            ]}
          >
            {tr(
              'quiz.v2.subtitle',
              'Realtime backend sessions for solo, duo, group and offline hot-seat'
            )}
          </Text>
        </View>

        <Pressable
          style={[styles.joinButton, { backgroundColor: colors.surface }]}
          onPress={() => router.push('/quiz/join-room')}
        >
          <Ionicons name="log-in-outline" size={20} color={colors.primary} />
          <Text style={[styles.joinButtonText, { fontFamily: fontMedium, color: colors.primary }]}>
            {tr('quiz.v2.join_room', 'Join room')}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {modeCards.map((mode) => (
          <Pressable
            key={mode.id}
            style={[
              styles.modeCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => handleModePress(mode.id)}
          >
            <View style={[styles.iconBox, { backgroundColor: `${mode.color}22` }]}>
              <Ionicons name={mode.icon} size={28} color={mode.color} />
            </View>

            <View style={styles.modeContent}>
              <Text
                style={[styles.modeTitle, { fontFamily: fontBold, color: colors.text.primary }]}
              >
                {mode.title}
              </Text>
              <Text
                style={[
                  styles.modeSubtitle,
                  { fontFamily: fontRegular, color: colors.text.secondary },
                ]}
              >
                {mode.subtitle}
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={22} color={colors.text.secondary} />
          </Pressable>
        ))}

        <View style={[styles.noteCard, { backgroundColor: colors.surfaceHighlight || '#F3F4F6' }]}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text
            style={[styles.noteText, { fontFamily: fontRegular, color: colors.text.secondary }]}
          >
            {tr(
              'quiz.v2.note',
              'Online modes use Supabase Realtime. Offline mode stores local results and syncs automatically when connected.'
            )}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 14,
  },
  headerTitle: {
    fontSize: 30,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  joinButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  joinButtonText: {
    fontSize: 14,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 34,
    gap: 12,
  },
  modeCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeContent: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 17,
    marginBottom: 4,
  },
  modeSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  noteCard: {
    marginTop: 6,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
