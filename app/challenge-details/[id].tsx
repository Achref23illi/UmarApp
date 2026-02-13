import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/config/colors';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { ChallengeLevelWithUserState, challengeDetailsService } from '@/services/challengeDetailsService';
import { useAppSelector } from '@/store/hooks';

export default function ChallengeDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  const slug = useMemo(() => (typeof id === 'string' ? id : Array.isArray(id) ? id[0] : ''), [id]);

  const [challengeTitle, setChallengeTitle] = useState<string>('Challenge');
  const [levels, setLevels] = useState<ChallengeLevelWithUserState[]>([]);
  const [configuredLevelIds, setConfiguredLevelIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        if (!slug) {
          setChallengeTitle('Challenge');
          setLevels([]);
          setConfiguredLevelIds(new Set());
          return;
        }

        const data = await challengeDetailsService.getChallengeCategoryWithLevels(slug, currentLanguage);
        if (!isActive) return;

        if (!data) {
          setChallengeTitle('Challenge');
          setLevels([]);
          setConfiguredLevelIds(new Set());
          setLoadError('Challenge not found');
          return;
        }

        const configuredIds = await challengeDetailsService.getConfiguredLevelIds(
          data.levels.map((level) => level.id)
        );
        if (!isActive) return;

        setChallengeTitle(data.category.title);
        setLevels(data.levels);
        setConfiguredLevelIds(new Set(configuredIds));
      } catch (error) {
        console.error('Failed to load challenge details:', error);
        if (!isActive) return;
        setLoadError('Unable to load challenge');
        setConfiguredLevelIds(new Set());
      } finally {
        if (!isActive) return;
        setIsLoading(false);
      }
    };

    load();

    return () => {
      isActive = false;
    };
  }, [slug, currentLanguage]);

  const handleLevelPress = (level: ChallengeLevelWithUserState) => {
    if (level.status === 'locked') return;

    if (level.status === 'active' || level.status === 'completed') {
      router.push({
        pathname: '/challenge-details/level/[id]',
        params: { id: level.id, challengeSlug: slug },
      });
      return;
    }

    router.push({
      pathname: '/challenge-details/config',
      params: { levelId: level.id, challengeSlug: slug },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.navigate('/(tabs)/challenges')} style={styles.backButton}>
           <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
          {challengeTitle}
        </Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.palette.purple.primary} />
          </View>
        ) : loadError ? (
          <View style={{ paddingVertical: 24 }}>
            <Text style={{ fontFamily: fontBold, color: colors.text.primary }}>{loadError}</Text>
          </View>
        ) : null}

        <Text style={[styles.introTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
          Votre Parcours
        </Text>
        <Text style={[styles.introSubtitle, { fontFamily: fontRegular, color: colors.text.secondary }]}>
          Complétez chaque niveau pour débloquer le suivant.
        </Text>

        {/* Level Map */}
        <View style={styles.mapContainer}>
           {levels.map((level, index) => {
             const isLocked = level.status === 'locked';
             const isActive = level.status === 'active';
             const isCompleted = level.status === 'completed';
             const isLast = index === levels.length - 1;

             return (
               <Animated.View 
                  key={level.id}
                  entering={FadeInDown.delay(index * 100).springify()}
                  style={styles.levelRow}
               >
                 {/* Timeline Line */}
                 {!isLast && (
                   <View style={[
                      styles.timelineLine, 
                      { 
                        backgroundColor: isCompleted ? Colors.palette.purple.primary : colors.surfaceHighlight,
                        left: 24, // Center of circle (width 48/2 = 24)
                      } 
                    ]} 
                   />
                 )}

                 {/* Level Icon/Circle */}
                 <View style={[
                    styles.levelIndicator,
                    { 
                      backgroundColor: isLocked ? colors.surfaceHighlight : (isActive ? Colors.palette.purple.primary : colors.surface),
                      borderColor: isActive ? Colors.palette.purple.primary : (isLocked ? 'transparent' : Colors.palette.gold.primary),
                      borderWidth: isActive || isCompleted ? 0 : 2,
                    }
                 ]}>
                    {isLocked ? (
                      <Ionicons name="lock-closed" size={20} color={colors.text.secondary} />
                    ) : (
                      <Ionicons name={isCompleted || isActive ? "star" : "play"} size={20} color={isActive ? '#FFF' : Colors.palette.gold.primary} />
                    )}
                 </View>
                 
                 {/* Level Card */}
                 <Pressable
                    style={[
                      styles.levelCard,
                      { 
                        backgroundColor: colors.surface,
                        opacity: isLocked ? 0.7 : 1,
                        shadowColor: colors.text.primary,
                      },
                      isActive && { 
                        borderColor: Colors.palette.purple.primary,
                        borderWidth: 1.5,
                        transform: [{ scale: 1.02 }]
                      }
                    ]}
                    onPress={() => handleLevelPress(level)}
                    disabled={isLocked}
                 >
                    <View style={styles.cardHeader}>
                      <Text style={[styles.levelTitle, { fontFamily: fontBold, color: isLocked ? colors.text.secondary : colors.text.primary }]}>
                        {level.title}
                      </Text>
                     {isActive && (
                         <View style={[styles.activeBadge, { backgroundColor: Colors.palette.purple.light }]}>
                           <Text style={[styles.activeBadgeText, { fontFamily: fontMedium, color: Colors.palette.purple.primary }]}>
                             En cours
                           </Text>
                         </View>
                      )}
                    </View>
                    
                    <Text style={[styles.levelSubtitle, { fontFamily: fontMedium, color: Colors.palette.purple.primary }]}>
                      {level.subtitle}
                    </Text>
                    
                    <Text style={[styles.levelDesc, { fontFamily: fontRegular, color: colors.text.secondary }]} numberOfLines={2}>
                      {level.description}
                    </Text>

                    <View style={styles.cardFooter}>
                       <View style={styles.footerMetaRow}>
                         <View style={styles.durationBadge}>
                            <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
                            <Text style={[styles.durationText, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                              {level.durationDays} jours
                            </Text>
                         </View>
                         {configuredLevelIds.has(level.id) ? (
                           <View style={[styles.configBadge, { backgroundColor: 'rgba(76, 175, 80, 0.12)' }]}>
                             <Ionicons name="checkmark-circle" size={12} color={Colors.palette.semantic.success} />
                             <Text
                               style={[
                                 styles.configBadgeText,
                                 { fontFamily: fontMedium, color: Colors.palette.semantic.success },
                               ]}
                               numberOfLines={1}
                             >
                               Reglages enregistres
                             </Text>
                           </View>
                         ) : null}
                       </View>
                       
                       {!isLocked && (
                         <Ionicons name="chevron-forward" size={20} color={colors.text.primary} />
                       )}
                    </View>
                 </Pressable>
               </Animated.View>
             );
           })}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  introTitle: {
    fontSize: 24,
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 16,
    marginBottom: 32,
    lineHeight: 22,
  },
  mapContainer: {
    gap: 0, 
  },
  levelRow: {
    flexDirection: 'row',
    marginBottom: 24,
    minHeight: 140,
  },
  timelineLine: {
    position: 'absolute',
    top: 48,
    bottom: -24, 
    width: 2,
    zIndex: -1,
  },
  levelIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  levelCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  levelTitle: {
    fontSize: 18,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 10,
  },
  levelSubtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  levelDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    gap: 8,
  },
  footerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 12,
  },
  configBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '100%',
  },
  configBadgeText: {
    fontSize: 11,
  },
});
