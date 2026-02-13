
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    FadeIn,
    SlideInRight,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ContentTab from '@/components/challenge-details/ContentTab';
import { toast } from '@/components/ui/Toast';
import { Colors } from '@/config/colors';
import { ChallengeLevelNumber, QURAN_PLANS, SADAQA_PLANS, clampDay, getPlanForDay } from '@/config/challengeContent';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { ChallengeLevel, ChallengeLevelDashboard, challengeDetailsService } from '@/services/challengeDetailsService';
import { challengeService } from '@/services/challengeService';
import { SURAHS } from '@/services/quranData';
import { useAppSelector } from '@/store/hooks';

// Types for Tabs
type DashboardTab = 'content' | 'progression' | 'group' | 'details';
type AdvanceBadgeState = {
  message: string;
  nextLevelId?: string;
  challengeCompleted?: boolean;
};
type QuranTodayStatus = {
  readCount: number;
  requiredCount: number;
  completedToday: boolean;
};

export default function LevelDashboardScreen() {
  const { id, challengeSlug } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  const levelId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : '';
  const slugParam = typeof challengeSlug === 'string' ? challengeSlug : Array.isArray(challengeSlug) ? challengeSlug[0] : '';

  const [activeTab, setActiveTab] = useState<DashboardTab>('content');
  const [selectedDay, setSelectedDay] = useState<number | null>(6); // Default to last day (Sun)
  const [level, setLevel] = useState<ChallengeLevel | null>(null);
  const [dashboard, setDashboard] = useState<ChallengeLevelDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resolvedChallengeSlug, setResolvedChallengeSlug] = useState<string>(slugParam);
  const [advanceBadge, setAdvanceBadge] = useState<AdvanceBadgeState | null>(null);
  const [quranTodayStatus, setQuranTodayStatus] = useState<QuranTodayStatus | null>(null);

  const challengeKind = resolvedChallengeSlug || slugParam;

  const load = useCallback(async () => {
    try {
      if (!levelId) {
        setLevel(null);
        setDashboard(null);
        setResolvedChallengeSlug(slugParam);
        setQuranTodayStatus(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      const [lvl, dash] = await Promise.all([
        challengeDetailsService.getLevelById(levelId),
        challengeDetailsService.getLevelDashboard(levelId, currentLanguage),
      ]);

      // Prefer the slug derived from the level's category_id (source of truth).
      let nextSlug = slugParam;
      if (lvl?.categoryId) {
        const category = await challengeService.getCategoryById(lvl.categoryId);
        nextSlug = category?.slug ?? nextSlug;
      }

      let nextQuranStatus: QuranTodayStatus | null = null;
      if (lvl && nextSlug === 'quran') {
        const levelNumber = (lvl.levelNumber ?? 1) as ChallengeLevelNumber;
        const plans = QURAN_PLANS[levelNumber] ?? [];
        const duration = lvl.durationDays ?? 0;
        const computedDay = duration
          ? clampDay(Math.max(0, duration - (dash?.daysLeft ?? duration)) + 1, duration)
          : 1;
        const plan = getPlanForDay(plans, computedDay);
        const requiredSurahs = [
          ...new Set(
            (plan?.surahs ?? []).filter(
              (surah) => Number.isInteger(surah) && surah >= 1 && surah <= 114
            )
          ),
        ].sort((a, b) => a - b);

        if (requiredSurahs.length > 0) {
          const progress = await challengeDetailsService.getTodayQuranReadProgress({
            levelId: lvl.id,
            requiredSurahs,
          });
          nextQuranStatus = {
            readCount: progress.readSurahs.filter((surah) => requiredSurahs.includes(surah)).length,
            requiredCount: requiredSurahs.length,
            completedToday: progress.completedToday,
          };
        } else {
          nextQuranStatus = {
            readCount: 0,
            requiredCount: 0,
            completedToday: dash.doneToday,
          };
        }
      }

      setResolvedChallengeSlug(nextSlug);
      setLevel(lvl);
      setDashboard(dash);
      setQuranTodayStatus(nextQuranStatus);
      setSelectedDay(6);
    } catch (error) {
      console.error('Failed to load level dashboard:', error);
      setLoadError('Unable to load level');
      setLevel(null);
      setDashboard(null);
      setQuranTodayStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [levelId, slugParam, currentLanguage]);

  useFocusEffect(
    useCallback(() => {
      load();
      return undefined;
    }, [load])
  );

  const levelNumber = (level?.levelNumber ?? 1) as ChallengeLevelNumber;

  const currentDayNumber = useMemo(() => {
    const duration = level?.durationDays ?? 0;
    if (!duration) return 1;
    const completedDays = Math.max(0, duration - (dashboard?.daysLeft ?? duration));
    return clampDay(completedDays + 1, duration);
  }, [level?.durationDays, dashboard?.daysLeft]);

  const quranPlanToday = useMemo(() => {
    if (challengeKind !== 'quran') return null;
    const plans = QURAN_PLANS[levelNumber] ?? [];
    const d = clampDay(currentDayNumber, plans.length || 1);
    return getPlanForDay(plans, d);
  }, [challengeKind, levelNumber, currentDayNumber]);

  const sadaqaPlanToday = useMemo(() => {
    if (challengeKind !== 'sadaqa') return null;
    const plans = SADAQA_PLANS[levelNumber] ?? [];
    const d = clampDay(currentDayNumber, plans.length || 1);
    return getPlanForDay(plans, d);
  }, [challengeKind, levelNumber, currentDayNumber]);

  const activityUnitLabel = challengeKind === 'quran' ? 'pages' : 'actions';

  const actionTitle =
    challengeKind === 'quran'
      ? 'Lecture du jour'
      : challengeKind === 'salat_obligatoire'
        ? 'Objectif du jour'
        : challengeKind === 'sadaqa'
          ? 'Acte du jour'
          : "Aujourd'hui";

  const actionButtonLabel =
    challengeKind === 'quran'
      ? 'Lire le Coran'
      : challengeKind === 'salat_obligatoire'
        ? 'Mes Prières'
        : challengeKind === 'sadaqa'
          ? 'Mon Acte du Jour'
          : 'Continuer';

  const actionIconName: keyof typeof Ionicons.glyphMap =
    challengeKind === 'quran'
      ? 'book-outline'
      : challengeKind === 'salat_obligatoire'
        ? 'time-outline'
        : challengeKind === 'sadaqa'
          ? 'heart-outline'
          : 'sparkles-outline';

  const actionColor =
    challengeKind === 'quran'
      ? Colors.palette.purple.primary
      : challengeKind === 'salat_obligatoire'
        ? Colors.palette.gold.dark
        : challengeKind === 'sadaqa'
          ? Colors.palette.semantic.success
          : Colors.palette.purple.primary;

  const handlePrimaryAction = async () => {
    try {
      if (challengeKind === 'quran') {
        const firstSurah = quranPlanToday?.surahs?.[0];
        if (firstSurah) {
          const meta = SURAHS.find((s) => s.number === firstSurah);
          router.push({
            pathname: '/quran/french-reader',
            params: {
              chapterId: String(firstSurah),
              chapterName: meta?.transliteration ?? `Surah ${firstSurah}`,
              challengeLevelId: levelId,
              challengeRequiredSurahs: (quranPlanToday?.surahs ?? []).join(','),
            },
          });
          return;
        }
        router.push('/quran');
        return;
      }

      if (challengeKind === 'salat_obligatoire') {
        router.push('/(tabs)/salat');
        return;
      }

      if (challengeKind === 'sadaqa') {
        const items = sadaqaPlanToday?.items ?? [];
        const message =
          items.length > 0
            ? `Sadaqa du jour (الصدقة)\n\n${items.map((i) => `- ${i}`).join('\n')}\n\nAlhamdulillah.`
            : `Aujourd'hui, je fais une sadaqa (الصدقة).`;

        await Share.share({ message });
      }
    } catch (error) {
      console.error('Primary action failed:', error);
    }
  };


  // --- Views for each Tab ---

  const ContentView = () => (
    <Animated.View entering={SlideInRight} style={styles.tabContent}>
      <View style={{ gap: 16 }}>
        <View style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.actionTitle, { fontFamily: fontBold, color: colors.text.primary }]}>{actionTitle}</Text>
          <Text style={[styles.actionDesc, { fontFamily: fontRegular, color: colors.text.secondary }]}>
            {level?.description || 'Votre objectif du jour est prêt.'}
          </Text>

          <Pressable style={[styles.primaryButton, { backgroundColor: actionColor }]} onPress={handlePrimaryAction}>
            <Ionicons name={actionIconName} size={20} color="#FFF" />
            <Text style={[styles.primaryButtonText, { fontFamily: fontBold }]}>{actionButtonLabel}</Text>
          </Pressable>
        </View>

        <View style={[styles.statusCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.statusTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
            {"Statut d’aujourd’hui"}
          </Text>
          {challengeKind === 'quran' ? (
            <View
              style={[
                styles.quranStatusBox,
                {
                  borderColor:
                    quranTodayStatus?.completedToday || dashboard?.doneToday
                      ? Colors.palette.semantic.success
                      : colors.border,
                  backgroundColor:
                    quranTodayStatus?.completedToday || dashboard?.doneToday
                      ? 'rgba(76, 175, 80, 0.1)'
                      : colors.surfaceHighlight,
                },
              ]}
            >
              <View style={styles.quranStatusTop}>
                <Ionicons
                  name={
                    quranTodayStatus?.completedToday || dashboard?.doneToday
                      ? 'checkmark-circle'
                      : 'book-outline'
                  }
                  size={18}
                  color={
                    quranTodayStatus?.completedToday || dashboard?.doneToday
                      ? Colors.palette.semantic.success
                      : colors.text.secondary
                  }
                />
                <Text
                  style={[
                    styles.quranStatusText,
                    {
                      fontFamily: fontMedium,
                      color:
                        quranTodayStatus?.completedToday || dashboard?.doneToday
                          ? Colors.palette.semantic.success
                          : colors.text.secondary,
                    },
                  ]}
                >
                  {quranTodayStatus
                    ? `${quranTodayStatus.readCount}/${quranTodayStatus.requiredCount} sourates lues`
                    : 'Progression de lecture en cours...'}
                </Text>
              </View>
              <Text style={[styles.quranStatusHint, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                {quranTodayStatus?.completedToday || dashboard?.doneToday
                  ? "Objectif validé automatiquement. Qu’Allah accepte."
                  : 'La validation se fait automatiquement après lecture complète des sourates du jour.'}
              </Text>
            </View>
          ) : (
            <Pressable
              style={[
                styles.checkButton,
                {
                  borderColor: dashboard?.doneToday ? Colors.palette.semantic.success : Colors.palette.gold.primary,
                  backgroundColor: dashboard?.doneToday ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                },
              ]}
              onPress={async () => {
                try {
                  if (!levelId) return;
                  const result = await challengeDetailsService.toggleTodayCompletion(levelId);

                  if (result.autoAdvancedToNextLevel) {
                    const message = result.nextLevelTitle
                      ? `Niveau débloqué: ${result.nextLevelTitle}`
                      : 'Nouveau niveau débloqué.';
                    toast.show({ message, type: 'success' });
                    setAdvanceBadge({
                      message,
                      nextLevelId: result.nextLevelId,
                      challengeCompleted: false,
                    });
                  } else if (result.challengeCompleted && result.doneToday) {
                    const message = 'MashaAllah, vous avez terminé ce challenge.';
                    toast.show({ message, type: 'success' });
                    setAdvanceBadge({
                      message,
                      challengeCompleted: true,
                    });
                  }

                  await load();
                } catch (error) {
                  console.error('Failed to toggle completion:', error);
                }
              }}
            >
              <Text
                style={[
                  styles.checkText,
                  {
                    fontFamily: fontMedium,
                    color: dashboard?.doneToday ? Colors.palette.semantic.success : colors.text.secondary,
                  },
                ]}
              >
                {dashboard?.doneToday ? "Terminé, Mash'Allah ! ✅" : 'Marquer comme terminé'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <ContentTab challengeSlug={challengeKind} levelId={levelId} embedded />
    </Animated.View>
  );

  // Animated Bar Component
  const Bar = ({ index, value, label, full, isSelected, onPress }: any) => {
    const height = useSharedValue(0);
    const maxHeight = 100; // px
    const barHeight = (value / 2) * maxHeight; // Assuming max 2 pages/day

    useEffect(() => {
        height.value = withDelay(index * 100, withSpring(barHeight, { damping: 12 }));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        height: height.value,
        backgroundColor: full ? actionColor : (value > 0 ? Colors.palette.gold.primary : colors.surfaceHighlight)
    }));

    return (
        <TouchableOpacity style={styles.barContainer} onPress={onPress} activeOpacity={0.8}>
            <View style={styles.barWrapper}>
                <Animated.View style={[styles.bar, animatedStyle, isSelected && styles.selectedBar]} />
            </View>
            <Text style={[styles.barLabel, { fontFamily: fontRegular, color: isSelected ? Colors.palette.purple.primary : colors.text.secondary }]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
  };

  const ProgressionView = () => (
    <Animated.View entering={SlideInRight} style={styles.tabContent}>
        
        {/* Weekly Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionHeader, { fontFamily: fontBold, color: colors.text.primary, marginBottom: 20 }]}>
                Activité Hebdomadaire
            </Text>
            
            <View style={styles.chartContainer}>
                {(dashboard?.weeklyActivity || []).map((day, index) => (
                    <Bar 
                        key={index} 
                        index={index}
                        value={day.value}
                        label={day.day}
                        full={day.full}
                        isSelected={selectedDay === index}
                        onPress={() => setSelectedDay(index)}
                    />
                ))}
            </View>

            {/* Tooltip / Info for selected day */}
            {selectedDay !== null && dashboard?.weeklyActivity?.[selectedDay] && (
                <Animated.View entering={FadeIn} style={[styles.dayInfo, { backgroundColor: colors.surfaceHighlight }]}>
                    <Text style={[styles.dayInfoText, { fontFamily: fontMedium, color: colors.text.primary }]}>
                        {dashboard.weeklyActivity[selectedDay].day}: {dashboard.weeklyActivity[selectedDay].value} {activityUnitLabel}
                    </Text>
                </Animated.View>
            )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
             <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <Ionicons
                  name={challengeKind === 'quran' ? 'book' : challengeKind === 'salat_obligatoire' ? 'time' : challengeKind === 'sadaqa' ? 'heart' : 'checkmark-circle'}
                  size={24}
                  color={actionColor}
                  style={{ marginBottom: 8 }}
                />
                <Text style={[styles.statValue, { fontFamily: fontBold, color: colors.text.primary }]}>
                   {dashboard?.totalRead ?? 0}
                </Text>
                <Text style={[styles.statLabel, { fontFamily: fontMedium, color: colors.text.secondary }]}>
                   {challengeKind === 'quran' ? 'Pages Totales' : 'Actions Totales'}
                </Text>
             </View>

             <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <Ionicons name="flame" size={24} color={Colors.palette.gold.primary} style={{ marginBottom: 8 }} />
                <Text style={[styles.statValue, { fontFamily: fontBold, color: colors.text.primary }]}>
                   {dashboard?.streak ?? 0} j
                </Text>
                <Text style={[styles.statLabel, { fontFamily: fontMedium, color: colors.text.secondary }]}>
                   Série Actuelle
                </Text>
             </View>

             <View style={[styles.statCard, { backgroundColor: colors.surface, flexBasis: '100%', flexDirection: 'column', alignItems: 'center' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'center' }}>
                     <View style={{ height: 8, flex: 1, backgroundColor: colors.surfaceHighlight, borderRadius: 4, overflow: 'hidden' }}>
                         <View style={{ width: `${dashboard?.completionRate ?? 0}%`, height: '100%', backgroundColor: Colors.palette.semantic.success }} />
                     </View>
                     <Text style={[styles.statValue, { fontFamily: fontBold, color: colors.text.primary, fontSize: 18 }]}>
                        {dashboard?.completionRate ?? 0}%
                     </Text>
                </View>
                <Text style={[styles.statLabel, { fontFamily: fontMedium, color: colors.text.secondary, marginTop: 8 }]}>
                    Taux de complétion global
                </Text>
             </View>
        </View>

    </Animated.View>
  );

  const GroupView = () => (
    <Animated.View entering={SlideInRight} style={styles.tabContent}>
       <Text style={[styles.sectionHeader, { fontFamily: fontBold, color: colors.text.primary }]}>
         Classement du Groupe
       </Text>
       <View style={[styles.memberRow, { backgroundColor: colors.surface }]}>
         <View style={styles.memberAvatar}>
           <Text>—</Text>
         </View>
         <View style={{ flex: 1 }}>
           <Text style={{ fontFamily: fontBold, color: colors.text.primary }}>Bientôt disponible</Text>
           <Text style={{ fontFamily: fontRegular, color: colors.text.secondary }}>
             Le classement de groupe arrivera dans une prochaine version.
           </Text>
         </View>
       </View>
    </Animated.View>
  );

  const DetailsView = () => (
     <Animated.View entering={SlideInRight} style={styles.tabContent}>
        <Text style={[styles.detailText, { fontFamily: fontRegular, color: colors.text.primary }]}>
           {level?.description || 'Détails du niveau indisponibles pour le moment.'}
        </Text>
     </Animated.View>
  );


  // --- Render ---

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: actionColor }]}>
        <View style={styles.headerTop}>
            <Pressable onPress={() => router.navigate({
              pathname: '/challenge-details/[id]',
              params: { id: challengeKind }
            })} style={styles.backButton}>
                 <Ionicons name="arrow-back" size={24} color="#FFF" />
            </Pressable>
            <Text style={[styles.headerTitle, { fontFamily: fontBold }]}>{level?.title || 'Niveau'}</Text>
            <Pressable onPress={() => router.push({
              pathname: '/challenge-details/config',
              params: { challengeSlug: challengeKind, levelId: levelId, source: 'level' }
            })} style={styles.backButton}>
              <Ionicons name="settings-outline" size={24} color="#FFF" />
            </Pressable>
        </View>

        {/* Level Stats Summary */}
        <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
               <Text style={[styles.summaryEmoji]}>🔥</Text>
               <Text style={[styles.summaryValue, { fontFamily: fontBold }]}>{dashboard?.streak ?? 0}</Text>
               <Text style={[styles.summaryLabel, { fontFamily: fontRegular }]}>Jours streak</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.summaryItem}>
               <Text style={[styles.summaryEmoji]}>⏳</Text>
               <Text style={[styles.summaryValue, { fontFamily: fontBold }]}>{dashboard?.daysLeft ?? 0}</Text>
               <Text style={[styles.summaryLabel, { fontFamily: fontRegular }]}>Jours restants</Text>
            </View>
        </View>

        {advanceBadge ? (
          <Pressable
            style={styles.advanceBadge}
            onPress={() => {
              if (advanceBadge.nextLevelId) {
                router.replace({
                  pathname: '/challenge-details/level/[id]',
                  params: { id: advanceBadge.nextLevelId, challengeSlug: challengeKind },
                });
              }
              setAdvanceBadge(null);
            }}
          >
            <Ionicons
              name={advanceBadge.challengeCompleted ? 'trophy' : 'ribbon'}
              size={16}
              color="#FFF"
            />
            <Text style={[styles.advanceBadgeText, { fontFamily: fontMedium }]}>
              {advanceBadge.message}
            </Text>
            {advanceBadge.nextLevelId ? (
              <Text style={[styles.advanceBadgeAction, { fontFamily: fontBold }]}>Ouvrir</Text>
            ) : (
              <Ionicons name="close" size={16} color="rgba(255,255,255,0.9)" />
            )}
          </Pressable>
        ) : null}
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.surface, shadowColor: '#000' }]}>
          {(['content', 'progression', 'group', 'details'] as DashboardTab[]).map((tab) => {
             const isActive = activeTab === tab;
             const contentIcon =
               challengeKind === 'quran' ? 'book' : challengeKind === 'salat_obligatoire' ? 'time' : challengeKind === 'sadaqa' ? 'heart' : 'book';
             const icons: Record<string, any> = {
                content: contentIcon,
                progression: 'stats-chart',
                group: 'people',
                details: 'information-circle'
             };
             
             // Custom Labels
             const contentLabel =
               challengeKind === 'quran' ? 'Coran' : challengeKind === 'salat_obligatoire' ? 'Salat' : challengeKind === 'sadaqa' ? 'Sadaqa' : 'Contenu';
             const labels: Record<string, string> = {
                content: contentLabel,
                progression: 'Stats',
                group: 'Groupe',
                details: 'Infos'
             };

             return (
               <Pressable 
                  key={tab} 
                  style={[styles.tabItem, isActive && styles.activeTabItem]}
                  onPress={() => setActiveTab(tab)}
               >
                  <Ionicons 
                     name={isActive ? icons[tab] : icons[tab] + '-outline'} 
                     size={22} 
                     color={isActive ? actionColor : colors.text.secondary} 
                  />
                  <Text style={[
                     styles.tabLabel, 
                     { fontFamily: isActive ? fontBold : fontMedium, color: isActive ? actionColor : colors.text.secondary }
                  ]}>
                     {labels[tab]}
                  </Text>
                  {isActive && <View style={[styles.activeIndicator, { backgroundColor: actionColor }]} />}
               </Pressable>
             );
          })}
      </View>

      {/* Content Area */}
      {activeTab === 'content' ? (
        <ScrollView
          contentContainerStyle={[styles.contentArea, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={actionColor} />
            </View>
          ) : loadError ? (
            <View style={{ paddingVertical: 24, paddingHorizontal: 20 }}>
              <Text style={{ fontFamily: fontBold, color: colors.text.primary }}>{loadError}</Text>
            </View>
          ) : null}

          {!loadError ? <ContentView /> : null}
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.contentArea, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={{ paddingVertical: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={actionColor} />
            </View>
          ) : loadError ? (
            <View style={{ paddingVertical: 24 }}>
              <Text style={{ fontFamily: fontBold, color: colors.text.primary }}>{loadError}</Text>
            </View>
          ) : null}
          {activeTab === 'progression' && <ProgressionView />}
          {activeTab === 'group' && <GroupView />}
          {activeTab === 'details' && <DetailsView />}
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
    paddingBottom: 40,
    borderBottomLeftRadius: 30, // Also varying radius slightly for smoother look
    borderBottomRightRadius: 30,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 20,
    color: '#FFF',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  advanceBadge: {
    marginTop: 14,
    marginHorizontal: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  advanceBadgeText: {
    flex: 1,
    color: '#FFF',
    fontSize: 12,
  },
  advanceBadgeAction: {
    color: '#FFF',
    fontSize: 12,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    color: '#FFF',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  verticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: -20, // Overlap header
    borderRadius: 16,
    padding: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  activeTabItem: {
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4, 
    width: 20,
    height: 3,
    borderRadius: 2,
    display: 'none', 
  },
  contentArea: {
    padding: 20,
    paddingTop: 24,
  },
  tabContent: {
    gap: 16,
  },
  // Active Tab Styles
  actionCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 18,
    textAlign: 'center',
  },
  actionDesc: {
    textAlign: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  statusCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  statusTitle: {
    marginBottom: 12,
  },
  checkButton: {
    borderWidth: 1,
    borderRadius: 12,
    borderStyle: 'dashed',
    paddingVertical: 14,
    alignItems: 'center',
  },
  checkText: {
    fontSize: 14,
  },
  quranStatusBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  quranStatusTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quranStatusText: {
    fontSize: 14,
  },
  quranStatusHint: {
    fontSize: 12,
    lineHeight: 18,
  },
  // Stats Styles
  chartCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 8,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginBottom: 12,
  },
  barContainer: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  barWrapper: {
    height: 100,
    width: 6, // Thin bars
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 3,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 3,
  },
  selectedBar: {
    opacity: 0.8,
  },
  barLabel: {
    fontSize: 10,
  },
  dayInfo: {
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  dayInfoText: {
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: 140, // Ensure 2 per row
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  // Group Styles (unchanged)
  sectionHeader: {
    fontSize: 18,
    marginBottom: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    lineHeight: 24,
    fontSize: 16,
  },
});
