import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { Colors } from '@/config/colors';
import {
  ChallengeLevelNumber,
  QURAN_PLANS,
  SALAT_PLANS,
  SADAQA_PLANS,
  clampDay,
  getPlanForDay,
} from '@/config/challengeContent';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { ChallengeLevelDashboard, ChallengeLevel, challengeDetailsService } from '@/services/challengeDetailsService';
import { challengeService } from '@/services/challengeService';
import { SURAHS } from '@/services/quranData';
import { getFrenchSurah } from '@/services/quranFrench';
import { useAppSelector } from '@/store/hooks';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

type Article = {
  id: string;
  title: string;
  content: string;
  level_id?: string | null;
};

type ContentTabProps = {
  challengeSlug?: string;
  levelId?: string;
};

export default function ContentTab({ challengeSlug, levelId }: ContentTabProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams();

  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  const resolvedSlug = useMemo(() => {
    const raw = challengeSlug ?? (params as any)?.challengeSlug ?? (params as any)?.challengeId ?? '';
    return typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
  }, [challengeSlug, params]);

  const resolvedLevelId = useMemo(() => {
    const raw = levelId ?? (params as any)?.levelId ?? (params as any)?.id ?? '';
    return typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
  }, [levelId, params]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const [articlesError, setArticlesError] = useState<string | null>(null);

  const [level, setLevel] = useState<ChallengeLevel | null>(null);
  const [dashboard, setDashboard] = useState<ChallengeLevelDashboard | null>(null);
  const [dayNumber, setDayNumber] = useState(1);
  const [isLoadingDay, setIsLoadingDay] = useState(false);

  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const [quranPreviewBySurah, setQuranPreviewBySurah] = useState<Record<number, string>>({});
  const [isLoadingQuranPreview, setIsLoadingQuranPreview] = useState(false);
  const [readSurahsToday, setReadSurahsToday] = useState<number[]>([]);
  const [isLoadingQuranProgress, setIsLoadingQuranProgress] = useState(false);

  useEffect(() => {
    // Reset local checklist when the day context changes
    setChecked({});
  }, [resolvedSlug, resolvedLevelId, dayNumber]);

  useEffect(() => {
    let isActive = true;

    const loadDayContext = async () => {
      try {
        if (!resolvedLevelId) {
          setLevel(null);
          setDashboard(null);
          setDayNumber(1);
          return;
        }

        setIsLoadingDay(true);
        const [lvl, dash] = await Promise.all([
          challengeDetailsService.getLevelById(resolvedLevelId),
          challengeDetailsService.getLevelDashboard(resolvedLevelId, currentLanguage),
        ]);

        if (!isActive) return;

        setLevel(lvl);
        setDashboard(dash);

        const duration = lvl?.durationDays ?? 0;
        if (!duration) {
          setDayNumber(1);
          return;
        }

        const completedDays = Math.max(0, duration - (dash?.daysLeft ?? duration));
        setDayNumber(clampDay(completedDays + 1, duration));
      } catch (e) {
        console.error('Failed to load content day context:', e);
        if (!isActive) return;
        setLevel(null);
        setDashboard(null);
        setDayNumber(1);
      } finally {
        if (!isActive) return;
        setIsLoadingDay(false);
      }
    };

    loadDayContext();
    return () => {
      isActive = false;
    };
  }, [resolvedLevelId, currentLanguage]);

  const levelNumber = (level?.levelNumber ?? 1) as ChallengeLevelNumber;
  const totalDays = level?.durationDays ?? 0;

  const quranPlanToday = useMemo(() => {
    if (resolvedSlug !== 'quran') return null;
    const plans = QURAN_PLANS[levelNumber] ?? [];
    const d = clampDay(dayNumber, plans.length || 1);
    return getPlanForDay(plans, d) ?? null;
  }, [resolvedSlug, levelNumber, dayNumber]);

  const quranRequiredSurahsToday = useMemo(
    () =>
      [...new Set((quranPlanToday?.surahs ?? []).filter((surah) => Number.isInteger(surah) && surah >= 1 && surah <= 114))].sort(
        (a, b) => a - b
      ),
    [quranPlanToday]
  );

  const quranRequiredSurahsKey = useMemo(
    () => quranRequiredSurahsToday.join(','),
    [quranRequiredSurahsToday]
  );

  const salatPlanToday = useMemo(() => {
    if (resolvedSlug !== 'salat_obligatoire') return null;
    const plans = SALAT_PLANS[levelNumber] ?? [];
    const d = clampDay(dayNumber, plans.length || 1);
    return getPlanForDay(plans, d) ?? null;
  }, [resolvedSlug, levelNumber, dayNumber]);

  const sadaqaPlanToday = useMemo(() => {
    if (resolvedSlug !== 'sadaqa') return null;
    const plans = SADAQA_PLANS[levelNumber] ?? [];
    const d = clampDay(dayNumber, plans.length || 1);
    return getPlanForDay(plans, d) ?? null;
  }, [resolvedSlug, levelNumber, dayNumber]);

  useEffect(() => {
    let isActive = true;

    const loadQuranPreviews = async () => {
      if (resolvedSlug !== 'quran') {
        setQuranPreviewBySurah({});
        return;
      }
      if (!quranPlanToday?.surahs?.length) {
        setQuranPreviewBySurah({});
        return;
      }

      try {
        setIsLoadingQuranPreview(true);
        const next: Record<number, string> = {};

        // Load previews only for the surahs of the day
        await Promise.all(
          quranPlanToday.surahs.map(async (surahNumber) => {
            const surah = await getFrenchSurah(surahNumber);
            const firstVerse = surah?.verses?.[0]?.text?.trim() ?? '';
            next[surahNumber] = firstVerse ? `“${firstVerse.slice(0, 140)}${firstVerse.length > 140 ? '…' : ''}”` : '';
          })
        );

        if (!isActive) return;
        setQuranPreviewBySurah(next);
      } catch (e) {
        console.error('Failed to load Quran previews:', e);
        if (!isActive) return;
        setQuranPreviewBySurah({});
      } finally {
        if (!isActive) return;
        setIsLoadingQuranPreview(false);
      }
    };

    loadQuranPreviews();
    return () => {
      isActive = false;
    };
  }, [resolvedSlug, quranPlanToday]);

  const loadQuranProgress = useCallback(async () => {
    if (resolvedSlug !== 'quran' || !resolvedLevelId) {
      setReadSurahsToday([]);
      setIsLoadingQuranProgress(false);
      return;
    }

    const requiredSurahs = quranRequiredSurahsKey
      .split(',')
      .map((value) => Number.parseInt(value, 10))
      .filter((surah) => Number.isInteger(surah) && surah >= 1 && surah <= 114);

    if (!requiredSurahs.length) {
      setReadSurahsToday([]);
      setIsLoadingQuranProgress(false);
      return;
    }

    try {
      setIsLoadingQuranProgress(true);
      const progress = await challengeDetailsService.getTodayQuranReadProgress({
        levelId: resolvedLevelId,
        requiredSurahs,
      });
      setReadSurahsToday(progress.readSurahs);
    } catch (error) {
      console.error('Failed to load Quran daily progress:', error);
      setReadSurahsToday([]);
    } finally {
      setIsLoadingQuranProgress(false);
    }
  }, [resolvedSlug, resolvedLevelId, quranRequiredSurahsKey]);

  useEffect(() => {
    loadQuranProgress();
  }, [loadQuranProgress]);

  useFocusEffect(
    useCallback(() => {
      loadQuranProgress();
      return undefined;
    }, [loadQuranProgress])
  );

  useEffect(() => {
    let isActive = true;

    const loadArticles = async () => {
      try {
        setIsLoadingArticles(true);
        setArticlesError(null);

        let categoryId: string | null = null;
        if (resolvedSlug) {
          const category = await challengeService.getCategoryBySlug(resolvedSlug);
          categoryId = category?.id ?? null;
        }

        let query = supabase
          .from('challenge_articles')
          .select('id, title, content, level_id')
          .order('sort_order', { ascending: true });

        if (categoryId) query = query.eq('category_id', categoryId);

        // If we know the level, include both general + level-specific articles.
        if (resolvedLevelId) {
          query = query.or(`level_id.is.null,level_id.eq.${resolvedLevelId}`);
        } else {
          query = query.is('level_id', null);
        }

        let { data, error } = await query;
        if (error && String((error as any).message || '').includes('level_id')) {
          // Backward compatibility: DB may not have challenge_articles.level_id yet.
          let fallbackQuery = supabase
            .from('challenge_articles')
            .select('id, title, content')
            .order('sort_order', { ascending: true });
          if (categoryId) fallbackQuery = fallbackQuery.eq('category_id', categoryId);
          const fallback = await fallbackQuery;
          data = (fallback.data ?? []).map((item: any) => ({ ...item, level_id: null }));
          error = fallback.error;
        }
        if (error) throw error;

        if (!isActive) return;
        setArticles((data as Article[]) ?? []);
      } catch (e) {
        console.error('Failed to load challenge articles:', e);
        if (!isActive) return;
        setArticles([]);
        setArticlesError('Impossible de charger le contenu');
      } finally {
        if (!isActive) return;
        setIsLoadingArticles(false);
      }
    };

    loadArticles();
    return () => {
      isActive = false;
    };
  }, [resolvedSlug, resolvedLevelId]);

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleCheck = (key: string) => {
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderDailySection = () => {
    if (!resolvedSlug) return null;

    const showDay = totalDays > 0;
    const dayLabel = showDay ? `Jour ${dayNumber}/${totalDays}` : `Jour ${dayNumber}`;

    if (resolvedSlug === 'quran' && quranPlanToday) {
      return (
        <View style={[styles.dailyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.dailyHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.dailyTitle, { fontFamily: fontBold, color: colors.text.primary }]}>Lecture du jour</Text>
              <Text style={[styles.dailySubtitle, { fontFamily: fontRegular, color: colors.text.secondary }]}>{dayLabel}</Text>
            </View>
            <View style={[styles.dailyPill, { backgroundColor: Colors.palette.purple.muted }]}>
              <Ionicons name="book-outline" size={16} color={Colors.palette.purple.primary} />
              <Text style={[styles.dailyPillText, { fontFamily: fontMedium, color: Colors.palette.purple.primary }]}>
                {quranPlanToday.title}
              </Text>
            </View>
          </View>

          {quranPlanToday.note ? (
            <Text style={[styles.dailyNote, { fontFamily: fontRegular, color: colors.text.secondary }]}>{quranPlanToday.note}</Text>
          ) : null}

          <View style={styles.quranProgressRow}>
            {isLoadingQuranProgress ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons
                  name={readSurahsToday.length >= quranRequiredSurahsToday.length ? 'checkmark-circle' : 'radio-button-off-outline'}
                  size={16}
                  color={
                    readSurahsToday.length >= quranRequiredSurahsToday.length
                      ? Colors.palette.semantic.success
                      : colors.text.secondary
                  }
                />
                <Text
                  style={[
                    styles.quranProgressText,
                    {
                      fontFamily: fontMedium,
                      color:
                        readSurahsToday.length >= quranRequiredSurahsToday.length
                          ? Colors.palette.semantic.success
                          : colors.text.secondary,
                    },
                  ]}
                >
                  {`${Math.min(readSurahsToday.length, quranRequiredSurahsToday.length)}/${quranRequiredSurahsToday.length} sourates lues`}
                </Text>
              </>
            )}
          </View>

          <View style={{ gap: 10, marginTop: 12 }}>
            {quranPlanToday.surahs.map((surahNumber) => {
              const meta = SURAHS.find((s) => s.number === surahNumber);
              const preview = quranPreviewBySurah[surahNumber];
              const isRead = readSurahsToday.includes(surahNumber);
              return (
                <Pressable
                  key={surahNumber}
                  onPress={() =>
                    router.push({
                      pathname: '/quran/french-reader',
                      params: {
                        chapterId: String(surahNumber),
                        chapterName: meta?.transliteration ?? `Surah ${surahNumber}`,
                        challengeLevelId: resolvedLevelId,
                        challengeRequiredSurahs: quranRequiredSurahsToday.join(','),
                      },
                    })
                  }
                  style={[
                    styles.surahCard,
                    { backgroundColor: colors.surfaceHighlight, borderColor: colors.border },
                    isRead && { backgroundColor: colors.divider, borderColor: colors.border, opacity: 0.85 },
                  ]}
                >
                  <View style={styles.surahTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.surahArabic, { color: isRead ? colors.text.secondary : Colors.palette.purple.primary }]}>
                        {meta?.name ?? ''}
                      </Text>
                      <Text
                        style={[
                          styles.surahName,
                          {
                            fontFamily: fontBold,
                            color: isRead ? colors.text.secondary : colors.text.primary,
                          },
                        ]}
                      >
                        {meta?.transliteration ?? `Sourate ${surahNumber}`}
                      </Text>
                      <Text
                        style={[
                          styles.surahMeta,
                          {
                            fontFamily: fontRegular,
                            color: colors.text.secondary,
                          },
                        ]}
                      >
                        {meta?.verses ? `${meta.verses} versets` : ''}
                      </Text>
                    </View>
                    {isRead ? (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.palette.semantic.success} />
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color={colors.text.secondary} />
                    )}
                  </View>

                  {isLoadingQuranPreview ? (
                    <View style={{ marginTop: 8 }}>
                      <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                  ) : preview ? (
                    <Text
                      style={[
                        styles.surahPreview,
                        {
                          fontFamily: fontRegular,
                          color: colors.text.secondary,
                        },
                      ]}
                      numberOfLines={3}
                    >
                      {preview}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      );
    }

    if (resolvedSlug === 'salat_obligatoire' && salatPlanToday) {
      return (
        <View style={[styles.dailyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.dailyHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.dailyTitle, { fontFamily: fontBold, color: colors.text.primary }]}>Objectif du jour</Text>
              <Text style={[styles.dailySubtitle, { fontFamily: fontRegular, color: colors.text.secondary }]}>{dayLabel}</Text>
            </View>
            <View style={[styles.dailyPill, { backgroundColor: Colors.palette.gold.muted }]}>
              <Ionicons name="time-outline" size={16} color={Colors.palette.gold.dark} />
              <Text style={[styles.dailyPillText, { fontFamily: fontMedium, color: Colors.palette.gold.dark }]}>{salatPlanToday.title}</Text>
            </View>
          </View>

          {salatPlanToday.note ? (
            <Text style={[styles.dailyNote, { fontFamily: fontRegular, color: colors.text.secondary }]}>{salatPlanToday.note}</Text>
          ) : null}

          <View style={{ marginTop: 12, gap: 10 }}>
            {salatPlanToday.items.map((item, idx) => {
              const key = `${dayNumber}-${idx}`;
              const isDone = !!checked[key];
              return (
                <Pressable
                  key={key}
                  onPress={() => toggleCheck(key)}
                  style={[
                    styles.checkRow,
                    { backgroundColor: colors.surfaceHighlight, borderColor: colors.border },
                    isDone && { borderColor: Colors.palette.semantic.success },
                  ]}
                >
                  <Ionicons
                    name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={isDone ? Colors.palette.semantic.success : colors.text.secondary}
                  />
                  <Text style={[styles.checkText, { fontFamily: fontRegular, color: colors.text.primary }]}>{item}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      );
    }

    if (resolvedSlug === 'sadaqa' && sadaqaPlanToday) {
      return (
        <View style={[styles.dailyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.dailyHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.dailyTitle, { fontFamily: fontBold, color: colors.text.primary }]}>Acte du jour</Text>
              <Text style={[styles.dailySubtitle, { fontFamily: fontRegular, color: colors.text.secondary }]}>{dayLabel}</Text>
            </View>
            <View style={[styles.dailyPill, { backgroundColor: 'rgba(76, 175, 80, 0.12)' }]}>
              <Ionicons name="heart-outline" size={16} color={Colors.palette.semantic.success} />
              <Text style={[styles.dailyPillText, { fontFamily: fontMedium, color: Colors.palette.semantic.success }]}>
                {sadaqaPlanToday.title}
              </Text>
            </View>
          </View>

          {sadaqaPlanToday.note ? (
            <Text style={[styles.dailyNote, { fontFamily: fontRegular, color: colors.text.secondary }]}>{sadaqaPlanToday.note}</Text>
          ) : null}

          <View style={{ marginTop: 12, gap: 10 }}>
            {sadaqaPlanToday.items.map((item, idx) => {
              const key = `${dayNumber}-${idx}`;
              const isDone = !!checked[key];
              return (
                <Pressable
                  key={key}
                  onPress={() => toggleCheck(key)}
                  style={[
                    styles.checkRow,
                    { backgroundColor: colors.surfaceHighlight, borderColor: colors.border },
                    isDone && { borderColor: Colors.palette.semantic.success },
                  ]}
                >
                  <Ionicons
                    name={isDone ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={isDone ? Colors.palette.semantic.success : colors.text.secondary}
                  />
                  <Text style={[styles.checkText, { fontFamily: fontRegular, color: colors.text.primary }]}>{item}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {isLoadingDay ? (
        <View style={{ paddingVertical: 16, alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}

      {isLoadingArticles && articles.length === 0 ? (
        <View style={{ paddingVertical: 30, alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : articlesError && articles.length === 0 ? (
        <View style={{ paddingVertical: 16 }}>
          <Text style={{ fontFamily: fontRegular, color: colors.text.secondary }}>{articlesError}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 16 }}>
          {renderDailySection()}

          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { fontFamily: fontBold, color: colors.text.primary }]}>Contenu</Text>
            <Text style={[styles.sectionSubtitle, { fontFamily: fontRegular, color: colors.text.secondary }]}>
              Articles et rappels (clique pour développer)
            </Text>
          </View>
        </View>

        <View style={{ height: 16 }} />

        {articles.map((item, idx) => {
          const isExpanded = expandedId === item.id;
          const isLevelSpecific = !!item.level_id;

          return (
            <View key={item.id}>
              <Pressable
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, isExpanded && styles.cardExpanded]}
                onPress={() => toggleExpand(item.id)}
              >
                <View style={[styles.indicatorBar, { backgroundColor: isLevelSpecific ? Colors.palette.purple.primary : Colors.palette.gold.dark }]} />
                <View style={styles.cardContent}>
                  <View style={styles.headerRow}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text
                          style={[
                            styles.cardTitle,
                            {
                              fontFamily: isExpanded ? fontBold : fontMedium,
                              color: isExpanded ? Colors.palette.purple.primary : colors.text.primary,
                            },
                          ]}
                        >
                          {item.title}
                        </Text>
                        {isLevelSpecific ? (
                          <View style={[styles.badge, { backgroundColor: Colors.palette.purple.muted }]}>
                            <Text style={[styles.badgeText, { fontFamily: fontMedium, color: Colors.palette.purple.primary }]}>Niveau</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={isExpanded ? Colors.palette.purple.primary : colors.text.secondary}
                    />
                  </View>

                  {isExpanded ? (
                    <View style={[styles.bodyContainer, { borderTopColor: colors.divider }]}>
                      <Text style={[styles.bodyText, { fontFamily: fontRegular, color: colors.text.secondary }]}>{item.content}</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>

              {idx < articles.length - 1 ? <View style={{ height: 12 }} /> : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },

  sectionHeaderRow: {
    gap: 2,
  },
  sectionTitle: {
    fontSize: 18,
  },
  sectionSubtitle: {
    fontSize: 12,
  },

  dailyCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  dailyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  dailyTitle: {
    fontSize: 18,
  },
  dailySubtitle: {
    marginTop: 2,
    fontSize: 12,
  },
  dailyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  dailyPillText: {
    fontSize: 12,
  },
  dailyNote: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
  },
  quranProgressRow: {
    marginTop: 12,
    minHeight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quranProgressText: {
    fontSize: 12,
  },

  surahCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  surahTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  surahArabic: {
    fontSize: 18,
  },
  surahName: {
    marginTop: 2,
    fontSize: 14,
  },
  surahMeta: {
    marginTop: 2,
    fontSize: 12,
  },
  surahPreview: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  checkText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },

  card: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingRight: 16,
    paddingLeft: 0, // Left padding handled by indicator/margin
    flexDirection: 'row',
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardExpanded: {
    // subtle emphasis
  },
  indicatorBar: {
    width: 4,
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 11,
  },
  bodyContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
