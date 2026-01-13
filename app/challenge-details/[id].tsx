import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/config/colors';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/store/hooks';

// Mock Levels Data
const LEVELS = [
  {
    id: '1',
    title: 'Niveau 1',
    subtitle: 'Initiation',
    description: 'Apprendre les bases et commencer la lecture régulière.',
    duration: '1 Semaine',
    status: 'active', // active, locked, completed
    progress: 0,
  },
  {
    id: '2',
    title: 'Niveau 2',
    subtitle: 'Intermédiaire',
    description: 'Augmenter le volume de lecture et la compréhension.',
    duration: '2 Semaines',
    status: 'locked',
    progress: 0,
  },
  {
    id: '3',
    title: 'Niveau 3',
    subtitle: 'Avancé',
    description: 'Maîtrise et méditation profonde.',
    duration: '3 Semaines',
    status: 'locked',
    progress: 0,
  },
];

export default function ChallengeDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  // Hardcoded challenge info for demo
  const challengeTitle = id === '1' ? 'Challenge Coran' : 'Challenge';

  const handleLevelPress = (level: typeof LEVELS[0]) => {
    if (level.status === 'locked') return;
    
    if (id === '1') {
      router.push({
        pathname: '/challenge-details/config',
        params: { levelId: level.id, challengeId: id }
      });
    } else {
      // Navigate to the dashboard for this level
      router.push({
        pathname: '/challenge-details/level/[id]',
        params: { id: level.id, challengeId: id }
      });
    }
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
        <Text style={[styles.introTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
          Votre Parcours
        </Text>
        <Text style={[styles.introSubtitle, { fontFamily: fontRegular, color: colors.text.secondary }]}>
          Complétez chaque niveau pour débloquer le suivant.
        </Text>

        {/* Level Map */}
        <View style={styles.mapContainer}>
           {LEVELS.map((level, index) => {
             const isLocked = level.status === 'locked';
             const isActive = level.status === 'active';
             const isCompleted = level.status === 'completed';
             const isLast = index === LEVELS.length - 1;

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
                       <View style={styles.durationBadge}>
                          <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
                          <Text style={[styles.durationText, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                            {level.duration}
                          </Text>
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
});
