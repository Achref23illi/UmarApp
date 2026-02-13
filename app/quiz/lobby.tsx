import { Ionicons } from '@expo/vector-icons';
import Clipboard from '@react-native-clipboard/clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toast } from '@/components/ui/Toast';
import { Colors } from '@/config/colors';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import {
    QuizPresenceUser,
    QuizSessionSnapshot,
    quizSessionService,
} from '@/services/quizSessionService';
import { useAppSelector } from '@/store/hooks';

export default function QuizLobbyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const currentUser = useAppSelector((state) => state.user);
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);

  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  const [snapshot, setSnapshot] = useState<QuizSessionSnapshot | null>(null);
  const [presence, setPresence] = useState<QuizPresenceUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  const unsubscribeRef = useRef<null | (() => Promise<void>)>(null);

  const tr = (key: string, fallback: string, options?: any): string => {
    const translated = t(key, options) as string;
    return translated === key ? fallback : translated;
  };

  const activePlayers = useMemo(
    () => (snapshot?.players || []).filter((player) => player.status !== 'left'),
    [snapshot?.players]
  );

  const isHost = useMemo(
    () =>
      Boolean(snapshot?.session?.host_user_id && snapshot.session.host_user_id === currentUser.id),
    [snapshot?.session?.host_user_id, currentUser.id]
  );

  useEffect(() => {
    if (snapshot?.session?.host_user_id) {
        console.log('[Lobby] Auth Check:', {
            currentUserId: currentUser.id,
            hostId: snapshot.session.host_user_id,
            isHost,
            activePlayers: activePlayers.length
        });
    }
  }, [currentUser.id, snapshot?.session?.host_user_id, isHost, activePlayers.length]);

  const minPlayersRequired = useMemo(() => {
    const mode = snapshot?.session.mode;
    if (mode === 'duo') return 2;
    if (mode === 'group') return 3;
    return 1;
  }, [snapshot?.session.mode]);

  const canStart = Boolean(
    isHost && snapshot?.session.state === 'lobby' && activePlayers.length >= minPlayersRequired
  );

  useEffect(() => {
    if (!sessionId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const initialize = async () => {
      try {
        setIsLoading(true);

        const freshSnapshot = await quizSessionService.getSessionSnapshot(sessionId);
        if (!isMounted) return;
        setSnapshot(freshSnapshot);

        unsubscribeRef.current = quizSessionService.subscribeSession(sessionId, {
          onSessionChange: (session) => {
            setSnapshot((prev) => (prev ? { ...prev, session } : prev));
          },
          onPlayersChange: (players) => {
            setSnapshot((prev) => (prev ? { ...prev, players } : prev));
          },
          onAnswersChange: (answers) => {
            setSnapshot((prev) => (prev ? { ...prev, answers } : prev));
          },
          onPresenceChange: (nextPresence) => {
            setPresence(nextPresence);
          },
          onError: (error) => {
            console.error('Lobby realtime error:', error);
          },
        });
      } catch (error) {
        console.error('Failed to open lobby', error);
        Alert.alert('Error', 'Unable to load lobby session.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void initialize();

    return () => {
      isMounted = false;
      if (unsubscribeRef.current) {
        void unsubscribeRef.current();
      }
    };
  }, [sessionId]);

  useEffect(() => {
    if (!snapshot?.session || !sessionId) return;

    console.log('[Lobby] Session State Update:', snapshot.session.state);

    if (snapshot.session.state === 'in_progress') {
      console.log('[Lobby] Navigating to Game');
      router.replace({ pathname: '/quiz/game', params: { sessionId } });
    } else if (snapshot.session.state === 'finished') {
      console.log('[Lobby] Navigating to Results');
      router.replace({ pathname: '/quiz/results', params: { sessionId } });
    }
  }, [snapshot?.session, sessionId, router]);

  const handleCopyCode = () => {
    if (!snapshot?.session.access_code) return;
    Clipboard.setString(snapshot.session.access_code);
    toast.show({
      type: 'success',
      message: tr('quiz.v2.code_copied', 'Room code copied'),
    });
  };

  const handleStartSession = async () => {
    if (!sessionId || !canStart || isStarting) return;

    console.log('[Lobby] Starting session...');
    try {
      setIsStarting(true);
      const updatedSession = await quizSessionService.startSession(sessionId);
      console.log('[Lobby] Session start command sent successfully. Updated state:', updatedSession.state);
      
      // Manually update snapshot to ensure immediate navigation if realtime is slow
      setSnapshot((prev) => (prev ? { ...prev, session: updatedSession } : prev));
    } catch (error: any) {
      console.error('Failed to start session', error);
      Alert.alert('Error', error?.message || 'Unable to start the game right now.');
    } finally {
      setIsStarting(false);
    }
  };

  if (!sessionId) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
        ]}
      >
        <Text style={{ color: colors.text.secondary }}>Missing session ID.</Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
      </View>

      {isLoading || !snapshot ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.palette.purple.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.title, { fontFamily: fontBold, color: colors.text.primary }]}>
            {snapshot.session.mode === 'duo'
              ? tr('quiz.v2.duo_lobby', 'Duo Lobby')
              : tr('quiz.v2.group_lobby', 'Group Lobby')}
          </Text>

          <Text
            style={[styles.subtitle, { fontFamily: fontRegular, color: colors.text.secondary }]}
          >
            {tr('quiz.v2.lobby_waiting', 'Share the code and wait for players.')}
          </Text>

          {snapshot.session.access_code ? (
            <Pressable
              style={[styles.codeCard, { backgroundColor: colors.surface }]}
              onPress={handleCopyCode}
            >
              <Text
                style={[
                  styles.codeLabel,
                  { fontFamily: fontRegular, color: colors.text.secondary },
                ]}
              >
                {tr('quiz.settings.room_code', 'Room code')}
              </Text>
              <Text
                style={[
                  styles.codeValue,
                  { fontFamily: fontBold, color: Colors.palette.purple.primary },
                ]}
              >
                {snapshot.session.access_code}
              </Text>
              <Text
                style={[styles.copyHint, { fontFamily: fontRegular, color: colors.text.secondary }]}
              >
                {tr('quiz.v2.code_copied', 'Tap to copy')}
              </Text>
            </Pressable>
          ) : null}

          <View style={styles.playersHeader}>
            <Text
              style={[styles.playersTitle, { fontFamily: fontMedium, color: colors.text.primary }]}
            >
              Players ({activePlayers.length})
            </Text>
            <Text
              style={[
                styles.playersHint,
                { fontFamily: fontRegular, color: colors.text.secondary },
              ]}
            >
              {tr('quiz.v2.min_players', `Need at least ${minPlayersRequired}`, { count: minPlayersRequired })}
            </Text>
          </View>

          <View style={styles.playersList}>
            {activePlayers.map((player) => {
              const online = Boolean(
                player.user_id &&
                presence.some((presenceItem) => presenceItem.userId === player.user_id)
              );
              const host = player.user_id === snapshot.session.host_user_id;

              return (
                <View
                  key={player.id}
                  style={[styles.playerCard, { backgroundColor: colors.surface }]}
                >
                  <View style={styles.playerNameRow}>
                    <Text
                      style={[
                        styles.playerName,
                        { fontFamily: fontMedium, color: colors.text.primary },
                      ]}
                    >
                      {player.display_name}
                    </Text>
                    {host ? (
                      <View style={[styles.hostPill, { backgroundColor: 'rgba(103,15,164,0.15)' }]}>
                        <Text
                          style={{
                            color: Colors.palette.purple.primary,
                            fontSize: 11,
                            fontWeight: '700',
                          }}
                        >
                          HOST
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.playerMetaRow}>
                    <View
                      style={[
                        styles.dot,
                        {
                          backgroundColor: player.user_id
                            ? online
                              ? '#10B981'
                              : '#9CA3AF'
                            : '#9CA3AF',
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.playerMeta,
                        { fontFamily: fontRegular, color: colors.text.secondary },
                      ]}
                    >
                      {player.user_id
                        ? online
                          ? tr('quiz.v2.online', 'Online')
                          : tr('quiz.v2.offline', 'Offline')
                        : tr('quiz.v2.local_player', 'Local player')}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {isHost ? (
            <Pressable
              style={[
                styles.startButton,
                {
                  backgroundColor: canStart ? Colors.palette.purple.primary : colors.text.disabled,
                  opacity: isStarting ? 0.75 : 1,
                },
              ]}
              onPress={handleStartSession}
              disabled={!canStart || isStarting}
            >
              {isStarting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.startButtonText, { fontFamily: fontBold }]}>
                  {tr('quiz.v2.start_game', 'Start game')}
                </Text>
              )}
            </Pressable>
          ) : (
            <View
              style={[
                styles.waitingCard,
                { backgroundColor: colors.surfaceHighlight || '#F3F4F6' },
              ]}
            >
              <Text
                style={[
                  styles.waitingText,
                  { fontFamily: fontRegular, color: colors.text.secondary },
                ]}
              >
                {tr('quiz.v2.waiting_host', 'Waiting for host to start the match...')}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 30,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  codeCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 18,
  },
  codeLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  codeValue: {
    fontSize: 34,
    letterSpacing: 4,
  },
  copyHint: {
    fontSize: 12,
    marginTop: 4,
  },
  playersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  playersTitle: {
    fontSize: 16,
  },
  playersHint: {
    fontSize: 12,
  },
  playersList: {
    gap: 10,
  },
  playerCard: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  playerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  playerName: {
    fontSize: 15,
  },
  hostPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  playerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  playerMeta: {
    fontSize: 12,
  },
  startButton: {
    marginTop: 20,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  waitingCard: {
    marginTop: 20,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  waitingText: {
    fontSize: 13,
  },
});
