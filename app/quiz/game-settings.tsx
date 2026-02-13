import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/config/colors';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import {
    QuizMode,
    QuizSettings,
    QuizThemeAvailability,
    quizSessionService,
} from '@/services/quizSessionService';
import { useAppSelector } from '@/store/hooks';

const QUESTION_COUNT_OPTIONS = [5, 10, 15, 20] as const;

export default function GameSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const currentUser = useAppSelector((state) => state.user);

  const params = useLocalSearchParams<{ mode?: string; theme?: string; level?: string }>();

  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  const mode: QuizMode = useMemo(() => {
    if (params.mode === 'duo' || params.mode === 'group' || params.mode === 'hotseat') {
      return params.mode;
    }
    return 'solo';
  }, [params.mode]);

  const [settings, setSettings] = useState<QuizSettings>({
    ...quizSessionService.defaultSettings,
  });

  const [themes, setThemes] = useState<QuizThemeAvailability[]>([]);
  const [selectedThemeSlug, setSelectedThemeSlug] = useState<string>(params.theme || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const [playerCount, setPlayerCount] = useState(2);
  const [hotseatNames, setHotseatNames] = useState<string[]>(['Player 1', 'Player 2']);

  const [loadingThemes, setLoadingThemes] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  const tr = (key: string, fallback: string) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  useEffect(() => {
    let isMounted = true;

    const loadThemes = async () => {
      try {
        setLoadingThemes(true);
        let resolvedQuestionCount = settings.question_count;
        let availability = await quizSessionService.getThemeAvailability({
          questionCount: resolvedQuestionCount,
          language: currentLanguage,
        });

        if (availability.length === 0) {
          const fallbackCounts = [...new Set([...QUESTION_COUNT_OPTIONS, settings.question_count])]
            .filter((count) => count < settings.question_count)
            .sort((a, b) => b - a);

          for (const fallbackCount of fallbackCounts) {
            const fallbackAvailability = await quizSessionService.getThemeAvailability({
              questionCount: fallbackCount,
              language: currentLanguage,
            });

            if (fallbackAvailability.length > 0) {
              resolvedQuestionCount = fallbackCount;
              availability = fallbackAvailability;
              break;
            }
          }
        }

        if (!isMounted) return;

        if (resolvedQuestionCount !== settings.question_count) {
          setSettings((prev) =>
            prev.question_count === settings.question_count
              ? { ...prev, question_count: resolvedQuestionCount }
              : prev
          );
        }

        setThemes(availability);

        const normalizedFromParams = params.theme
          ? quizSessionService.normalizeCategorySlug(params.theme)
          : '';

        const fallbackTheme = normalizedFromParams || availability[0]?.slug || '';

        if (!selectedThemeSlug || !availability.some((theme) => theme.slug === selectedThemeSlug)) {
          setSelectedThemeSlug(fallbackTheme);
        }

        const selectedTheme = availability.find(
          (theme) => theme.slug === (selectedThemeSlug || fallbackTheme)
        );
        setSelectedCategoryId(selectedTheme?.categoryId || null);
      } catch (error) {
        console.error('Failed to load quiz themes', error);
        if (isMounted) {
          setThemes([]);
          setSelectedThemeSlug('');
          setSelectedCategoryId(null);
        }
      } finally {
        if (isMounted) setLoadingThemes(false);
      }
    };

    void loadThemes();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.question_count, currentLanguage]);

  useEffect(() => {
    const selectedTheme = themes.find((theme) => theme.slug === selectedThemeSlug) || null;
    setSelectedCategoryId(selectedTheme?.categoryId || null);
  }, [selectedThemeSlug, themes]);

  useEffect(() => {
    setHotseatNames((prev) => {
      const next = Array.from(
        { length: playerCount },
        (_, index) => prev[index] || `Player ${index + 1}`
      );
      return next;
    });
  }, [playerCount]);

  const updateSetting = (key: keyof QuizSettings, value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateHotseatName = (index: number, value: string) => {
    setHotseatNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const startDisabled = useMemo(() => {
    if (!selectedThemeSlug || !selectedCategoryId) return true;
    if (mode === 'hotseat') {
      const validNames = hotseatNames.filter((name) => name.trim().length > 0);
      return validNames.length < 2;
    }
    return false;
  }, [selectedThemeSlug, selectedCategoryId, mode, hotseatNames]);

  const handleStart = async () => {
    if (startDisabled || isStarting) return;

    try {
      setIsStarting(true);

      if (mode === 'hotseat') {
        const session = await quizSessionService.createOfflineHotseatSession({
          categorySlug: selectedThemeSlug,
          categoryId: selectedCategoryId,
          settings,
          playerNames: hotseatNames.map((name, index) => name.trim() || `Player ${index + 1}`),
          language: currentLanguage,
        });

        router.replace({
          pathname: '/quiz/game',
          params: {
            mode: 'hotseat',
            localSessionId: session.id,
          },
        });
        return;
      }

      const displayName = currentUser.name || 'Host';
      const result = await quizSessionService.createSession({
        mode,
        categorySlug: selectedThemeSlug,
        settings,
        hostDisplayName: displayName,
      });

      if (mode === 'solo') {
        router.replace({ pathname: '/quiz/game', params: { sessionId: result.sessionId } });
      } else {
        router.replace({ pathname: '/quiz/lobby', params: { sessionId: result.sessionId } });
      }
    } catch (error: any) {
      console.error('Failed to start quiz flow', error);
      Alert.alert('Error', error?.message || 'Unable to start this game configuration.');
    } finally {
      setIsStarting(false);
    }
  };

  const settingsList = [
    {
      id: 'response_time' as const,
      label: tr('quiz.settings.response_time', 'Response time'),
      icon: 'time-outline' as const,
      value: `${settings.response_time}s`,
      options: [15, 30, 45, 60],
      current: settings.response_time,
    },
    {
      id: 'question_count' as const,
      label: tr('quiz.settings.questions_count', 'Questions'),
      icon: 'help-circle-outline' as const,
      value: settings.question_count.toString(),
      options: [...QUESTION_COUNT_OPTIONS] as number[],
      current: settings.question_count,
    },
    {
      id: 'jokers' as const,
      label: tr('quiz.settings.jokers_count', 'Jokers'),
      icon: 'happy-outline' as const,
      value: settings.jokers.toString(),
      options: [0, 1, 2, 3],
      current: settings.jokers,
    },
    {
      id: 'helps' as const,
      label: tr('quiz.settings.helps_count', 'Helps'),
      icon: 'bulb-outline' as const,
      value: settings.helps.toString(),
      options: [0, 1, 2, 3],
      current: settings.helps,
    },
  ];

  const modeTitle =
    mode === 'solo'
      ? tr('quiz.v2.solo_title', 'Solo Online')
      : mode === 'duo'
        ? tr('quiz.v2.duo_title', 'Duo Online')
        : mode === 'group'
          ? tr('quiz.v2.group_title', 'Group Online')
          : tr('quiz.v2.hotseat_title', 'Offline Hot-seat');

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
          {tr('quiz.settings.title', 'Game settings')}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={[styles.modeBadge, { backgroundColor: colors.surfaceHighlight || '#F3F4F6' }]}>
          <Ionicons
            name="game-controller-outline"
            size={18}
            color={Colors.palette.purple.primary}
          />
          <Text
            style={[
              styles.modeBadgeText,
              { fontFamily: fontMedium, color: Colors.palette.purple.primary },
            ]}
          >
            {modeTitle}
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { fontFamily: fontMedium, color: colors.text.primary }]}>
          {tr('quiz.settings.theme', 'Theme')}
        </Text>

        {loadingThemes ? (
          <View style={styles.loadingThemes}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : themes.length === 0 ? (
          <View style={[styles.emptyThemes, { backgroundColor: colors.surface }]}>
            <Text style={{ color: colors.text.secondary, fontFamily: fontRegular }}>
              {tr('quiz.v2.no_themes', 'No themes have enough active questions for this setup.')}
            </Text>
          </View>
        ) : (
          <View style={styles.themeGrid}>
            {themes.map((theme) => {
              const selected = theme.slug === selectedThemeSlug;
              return (
                <Pressable
                  key={theme.categoryId}
                  onPress={() => setSelectedThemeSlug(theme.slug)}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: selected ? Colors.palette.purple.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: selected ? Colors.palette.purple.primary : colors.text.primary,
                      fontFamily: fontMedium,
                      fontSize: 14,
                    }}
                  >
                    {theme.label}
                  </Text>
                  <Text style={{ color: colors.text.secondary, fontSize: 12 }}>
                    {theme.availableQuestionCount} {tr('quiz.settings.available', 'available')}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <Text
          style={[
            styles.sectionTitle,
            { fontFamily: fontMedium, color: colors.text.primary, marginTop: 16 },
          ]}
        >
          {tr('quiz.settings.rules', 'Rules')}
        </Text>

        <View style={styles.settingsList}>
          {settingsList.map((setting) => (
            <View
              key={setting.id}
              style={[
                styles.settingItem,
                { backgroundColor: colors.surface, shadowColor: colors.text.primary },
              ]}
            >
              <View style={styles.settingLeft}>
                <Ionicons name={setting.icon} size={22} color={colors.text.secondary} />
                <Text
                  style={[
                    styles.settingLabel,
                    { fontFamily: fontRegular, color: colors.text.primary },
                  ]}
                >
                  {setting.label}
                </Text>
              </View>

              <View style={styles.settingRight}>
                <Text
                  style={[
                    styles.settingValue,
                    { fontFamily: fontBold, color: Colors.palette.purple.primary },
                  ]}
                >
                  {setting.value}
                </Text>

                <View style={styles.valueButtons}>
                  <Pressable
                    style={[
                      styles.valueButton,
                      { backgroundColor: colors.surfaceHighlight || '#F3F4F6' },
                    ]}
                    onPress={() => {
                      const currentIndex = setting.options.indexOf(setting.current);
                      const prevIndex = Math.max(0, currentIndex - 1);
                      updateSetting(setting.id, setting.options[prevIndex]);
                    }}
                  >
                    <Ionicons name="remove" size={18} color={colors.text.secondary} />
                  </Pressable>

                  <Pressable
                    style={[
                      styles.valueButton,
                      { backgroundColor: colors.surfaceHighlight || '#F3F4F6' },
                    ]}
                    onPress={() => {
                      const currentIndex = setting.options.indexOf(setting.current);
                      const nextIndex = Math.min(setting.options.length - 1, currentIndex + 1);
                      updateSetting(setting.id, setting.options[nextIndex]);
                    }}
                  >
                    <Ionicons name="add" size={18} color={colors.text.secondary} />
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>

        {mode === 'hotseat' ? (
          <View style={styles.hotseatSection}>
            <Text
              style={[styles.sectionTitle, { fontFamily: fontMedium, color: colors.text.primary }]}
            >
              {tr('quiz.settings.offline_players', 'Offline players')}
            </Text>

            <View style={[styles.settingItem, { backgroundColor: colors.surface }]}>
              <View style={styles.settingLeft}>
                <Ionicons name="people-outline" size={22} color={colors.text.secondary} />
                <Text
                  style={[
                    styles.settingLabel,
                    { fontFamily: fontRegular, color: colors.text.primary },
                  ]}
                >
                  {tr('quiz.settings.player_count', 'Player count')}
                </Text>
              </View>

              <View style={styles.settingRight}>
                <Text
                  style={[
                    styles.settingValue,
                    { fontFamily: fontBold, color: Colors.palette.purple.primary },
                  ]}
                >
                  {playerCount}
                </Text>

                <View style={styles.valueButtons}>
                  <Pressable
                    style={[
                      styles.valueButton,
                      { backgroundColor: colors.surfaceHighlight || '#F3F4F6' },
                    ]}
                    onPress={() => setPlayerCount((count) => Math.max(2, count - 1))}
                  >
                    <Ionicons name="remove" size={18} color={colors.text.secondary} />
                  </Pressable>

                  <Pressable
                    style={[
                      styles.valueButton,
                      { backgroundColor: colors.surfaceHighlight || '#F3F4F6' },
                    ]}
                    onPress={() => setPlayerCount((count) => Math.min(8, count + 1))}
                  >
                    <Ionicons name="add" size={18} color={colors.text.secondary} />
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.hotseatNamesContainer}>
              {hotseatNames.map((name, index) => (
                <TextInput
                  key={`hotseat-player-${index}`}
                  style={[
                    styles.nameInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text.primary,
                      fontFamily: fontRegular,
                    },
                  ]}
                  value={name}
                  onChangeText={(value) => updateHotseatName(index, value)}
                  placeholder={`Player ${index + 1}`}
                  placeholderTextColor={colors.text.secondary}
                />
              ))}
            </View>
          </View>
        ) : null}

        <Pressable
          style={[
            styles.startButton,
            {
              backgroundColor: startDisabled ? colors.text.disabled : Colors.palette.purple.primary,
              opacity: isStarting ? 0.75 : 1,
            },
          ]}
          onPress={handleStart}
          disabled={startDisabled || isStarting}
        >
          {isStarting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.startButtonText, { fontFamily: fontBold }]}>
              {tr('quiz.settings.start', 'Start')}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: {
    fontSize: 19,
  },
  content: {
    paddingHorizontal: 20,
    gap: 12,
  },
  modeBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modeBadgeText: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  loadingThemes: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyThemes: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: '47%',
    gap: 4,
  },
  settingsList: {
    gap: 10,
  },
  settingItem: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingLabel: {
    fontSize: 14,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingValue: {
    fontSize: 16,
  },
  valueButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  valueButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hotseatSection: {
    marginTop: 4,
    gap: 8,
  },
  hotseatNamesContainer: {
    gap: 8,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  startButton: {
    marginTop: 8,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  startButtonText: {
    fontSize: 16,
    color: '#fff',
  },
});
