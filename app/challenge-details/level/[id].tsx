
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    FadeIn,
    SlideInRight,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/config/colors';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/store/hooks';

// Mock Data for Dashboard
const DASHBOARD_DATA = {
  streak: 5,
  daysLeft: 2,
  progress: 0.7,
  totalRead: 142,
  completionRate: 85,
  weeklyActivity: [
    { day: 'Lun', value: 2, full: true },
    { day: 'Mar', value: 2, full: true },
    { day: 'Mer', value: 1, full: false },
    { day: 'Jeu', value: 2, full: true },
    { day: 'Ven', value: 0, full: false },
    { day: 'Sam', value: 2, full: true },
    { day: 'Dim', value: 2, full: true }, // Today
  ]
};

// Types for Tabs
type DashboardTab = 'content' | 'progression' | 'group' | 'details';

export default function LevelDashboardScreen() {
  const { id, challengeId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  const [activeTab, setActiveTab] = useState<DashboardTab>('content');
  const [isDone, setIsDone] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(6); // Default to last day (Sun)


  // --- Views for each Tab ---

  const ContentView = () => (
    <Animated.View entering={SlideInRight} style={styles.tabContent}>
       <View style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: 'rgba(0,0,0,0.05)', borderWidth: 1 }]}>
          <Text style={[styles.actionTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
             Lecture du jour
          </Text>
          <Text style={[styles.actionDesc, { fontFamily: fontRegular, color: colors.text.secondary }]}>
             Sourate Al-Baqarah, Versets 1-10
          </Text>
          
          <Pressable 
            style={[styles.primaryButton, { backgroundColor: Colors.palette.purple.primary }]}
            onPress={() => router.push('/quran')}
          >
             <Ionicons name="book-outline" size={20} color="#FFF" />
             <Text style={[styles.primaryButtonText, { fontFamily: fontBold }]}>Lire le Coran</Text>
          </Pressable>
       </View>

       <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.statusTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
             Statut d'aujourd'hui
          </Text>
           <Pressable 
              style={[
                styles.checkButton, 
                { 
                  borderColor: isDone ? Colors.palette.semantic.success : Colors.palette.gold.primary,
                  backgroundColor: isDone ? 'rgba(76, 175, 80, 0.1)' : 'transparent'
                }
              ]}
              onPress={() => setIsDone(!isDone)}
           >
               <Text style={[
                  styles.checkText, 
                  { 
                    fontFamily: fontMedium, 
                    color: isDone ? Colors.palette.semantic.success : colors.text.secondary 
                  }
               ]}>
                  {isDone ? "Terminé, Mash'Allah ! ✅" : "Marquer comme terminé"}
               </Text>
           </Pressable>
       </View>
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
        backgroundColor: full ? Colors.palette.purple.primary : (value > 0 ? Colors.palette.gold.primary : colors.surfaceHighlight)
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
                {DASHBOARD_DATA.weeklyActivity.map((day, index) => (
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
            {selectedDay !== null && (
                <Animated.View entering={FadeIn} style={[styles.dayInfo, { backgroundColor: colors.surfaceHighlight }]}>
                    <Text style={[styles.dayInfoText, { fontFamily: fontMedium, color: colors.text.primary }]}>
                        {DASHBOARD_DATA.weeklyActivity[selectedDay].day}: {DASHBOARD_DATA.weeklyActivity[selectedDay].value} pages lues
                    </Text>
                </Animated.View>
            )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
             <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <Ionicons name="book" size={24} color={Colors.palette.purple.primary} style={{ marginBottom: 8 }} />
                <Text style={[styles.statValue, { fontFamily: fontBold, color: colors.text.primary }]}>
                   {DASHBOARD_DATA.totalRead}
                </Text>
                <Text style={[styles.statLabel, { fontFamily: fontMedium, color: colors.text.secondary }]}>
                   Pages Totales
                </Text>
             </View>

             <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <Ionicons name="flame" size={24} color={Colors.palette.gold.primary} style={{ marginBottom: 8 }} />
                <Text style={[styles.statValue, { fontFamily: fontBold, color: colors.text.primary }]}>
                   {DASHBOARD_DATA.streak} j
                </Text>
                <Text style={[styles.statLabel, { fontFamily: fontMedium, color: colors.text.secondary }]}>
                   Série Actuelle
                </Text>
             </View>

             <View style={[styles.statCard, { backgroundColor: colors.surface, flexBasis: '100%', flexDirection: 'column', alignItems: 'center' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'center' }}>
                     <View style={{ height: 8, flex: 1, backgroundColor: colors.surfaceHighlight, borderRadius: 4, overflow: 'hidden' }}>
                         <View style={{ width: `${DASHBOARD_DATA.completionRate}%`, height: '100%', backgroundColor: Colors.palette.semantic.success }} />
                     </View>
                     <Text style={[styles.statValue, { fontFamily: fontBold, color: colors.text.primary, fontSize: 18 }]}>
                        {DASHBOARD_DATA.completionRate}%
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
       {[1, 2, 3].map((item, index) => (
          <View key={index} style={[styles.memberRow, { backgroundColor: colors.surface }]}>
             <View style={styles.memberAvatar}>
                <Text>{['🥇','🥈','🥉'][index]}</Text>
             </View>
             <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fontBold, color: colors.text.primary }}>Utilisateur {item}</Text>
                <Text style={{ fontFamily: fontRegular, color: colors.text.secondary }}>{100 - index * 10} points</Text>
             </View>
          </View>
       ))}
    </Animated.View>
  );

  const DetailsView = () => (
     <Animated.View entering={SlideInRight} style={styles.tabContent}>
        <Text style={[styles.detailText, { fontFamily: fontRegular, color: colors.text.primary }]}>
           Ce niveau consiste à lire régulièrement 2 pages de Coran après chaque prière.
           {"\n\n"}
           Récompense: Badge "Lecteur Assidu".
        </Text>
     </Animated.View>
  );


  // --- Render ---

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: Colors.palette.purple.primary }]}>
        <View style={styles.headerTop}>
            <Pressable onPress={() => router.navigate({
              pathname: '/challenge-details/[id]',
              params: { id: challengeId as string }
            })} style={styles.backButton}>
                 <Ionicons name="arrow-back" size={24} color="#FFF" />
            </Pressable>
            <Text style={[styles.headerTitle, { fontFamily: fontBold }]}>Niveau {id}</Text>
            {challengeId === '1' ? (
               <Pressable onPress={() => router.push({
                 pathname: '/challenge-details/config',
                 params: { challengeId: challengeId as string, levelId: id as string }
               })} style={styles.backButton}>
                  <Ionicons name="settings-outline" size={24} color="#FFF" />
               </Pressable>
            ) : (
               <View style={{ width: 40 }} />
            )}
        </View>

        {/* Level Stats Summary */}
        <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
               <Text style={[styles.summaryEmoji]}>🔥</Text>
               <Text style={[styles.summaryValue, { fontFamily: fontBold }]}>{DASHBOARD_DATA.streak}</Text>
               <Text style={[styles.summaryLabel, { fontFamily: fontRegular }]}>Jours streak</Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.summaryItem}>
               <Text style={[styles.summaryEmoji]}>⏳</Text>
               <Text style={[styles.summaryValue, { fontFamily: fontBold }]}>{DASHBOARD_DATA.daysLeft}</Text>
               <Text style={[styles.summaryLabel, { fontFamily: fontRegular }]}>Jours restants</Text>
            </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabsContainer, { backgroundColor: colors.surface, shadowColor: '#000' }]}>
          {(['content', 'progression', 'group', 'details'] as DashboardTab[]).map((tab) => {
             const isActive = activeTab === tab;
             const icons: Record<string, any> = {
                content: 'book',
                progression: 'stats-chart',
                group: 'people',
                details: 'information-circle'
             };
             
             // Custom Labels
             const labels: Record<string, string> = {
                content: 'Coran',
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
                     color={isActive ? Colors.palette.purple.primary : colors.text.secondary} 
                  />
                  <Text style={[
                     styles.tabLabel, 
                     { fontFamily: isActive ? fontBold : fontMedium, color: isActive ? Colors.palette.purple.primary : colors.text.secondary }
                  ]}>
                     {labels[tab]}
                  </Text>
                  {isActive && <View style={[styles.activeIndicator, { backgroundColor: Colors.palette.purple.primary }]} />}
               </Pressable>
             );
          })}
      </View>

      {/* Content Area */}
      <ScrollView 
         contentContainerStyle={[styles.contentArea, { paddingBottom: insets.bottom + 20 }]}
         showsVerticalScrollIndicator={false}
      >
         {activeTab === 'content' && <ContentView />}
         {activeTab === 'progression' && <ProgressionView />}
         {activeTab === 'group' && <GroupView />}
         {activeTab === 'details' && <DetailsView />}
      </ScrollView>


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


