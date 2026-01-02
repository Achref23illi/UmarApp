import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { useAppSelector } from '@/store/hooks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.7;

interface Challenge {
  id: string;
  title: string;
  description: string;
  reward_text: string;
  icon: string;
  type: string;
  target_count: number;
}

interface DailyChallengesProps {
  delay?: number;
}

export default function DailyChallenges({ delay = 600 }: DailyChallengesProps) {
  const { isDark, colors } = useTheme();
  const { t } = useTranslation();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  
  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontSemiBold = getFont(currentLanguage, 'semiBold');
  const fontBold = getFont(currentLanguage, 'bold');

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setChallenges(data);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gradient colors for challenges (Deep Orange/Amber)
  const getGradientColors = (isDark: boolean, index: number) => {
    const gradients = [
      isDark ? ['#C2410C', '#9A3412', '#7C2D12'] : ['#F97316', '#EA580C', '#C2410C'],
      isDark ? ['#0369A1', '#075985', '#0C4A6E'] : ['#0EA5E9', '#0284C7', '#0369A1'],
      isDark ? ['#15803D', '#166534', '#14532D'] : ['#22C55E', '#16A34A', '#15803D']
    ];
    // Cast through unknown to satisfy TS tuple requirements
    return gradients[index % gradients.length] as unknown as readonly [string, string, string];
  };

  if(!loading && challenges.length === 0) return null;

  return (
    <Animated.View entering={FadeInUp.delay(delay)} style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
          {t('challenges.dailyChallenges')}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: 20 }]}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + 15} // Width + margin
      >
        {loading ? (
             <View style={[styles.loadingCard, { width: CARD_WIDTH, backgroundColor: colors.surface }]}>
                <ActivityIndicator color={colors.primary} />
            </View>
        ) : (
          challenges.map((challenge, index) => (
            <Pressable 
                key={challenge.id}
                style={({pressed}) => [
                    styles.cardContainer,
                    { opacity: pressed ? 0.95 : 1 }
                ]}
            >
              <LinearGradient
                colors={getGradientColors(isDark, index)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                        <Ionicons 
                            name={challenge.icon as any || 'trophy'} 
                            size={24} 
                            color="#FFF" 
                        />
                    </View>
                    <View style={styles.badge}>
                        <Text style={[styles.badgeText, { fontFamily: fontMedium }]}>
                             +{challenge.target_count * 10} XP
                        </Text>
                    </View>
                </View>

                <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, { fontFamily: fontBold }]}>
                        {challenge.title}
                    </Text>
                    <Text style={[styles.cardDesc, { fontFamily: fontRegular }]} numberOfLines={2}>
                        {challenge.description}
                    </Text>
                    
                    <View style={styles.rewardContainer}>
                        <Ionicons name="gift-outline" size={14} color="rgba(255,255,255,0.8)" />
                        <Text style={[styles.rewardText, { fontFamily: fontMedium }]} numberOfLines={1}>
                             {challenge.reward_text}
                        </Text>
                    </View>
                </View>
                
                {/* Background Decoration */}
                <Ionicons 
                    name={challenge.icon as any || 'trophy'}
                    size={120}
                    color="rgba(255,255,255,0.05)"
                    style={styles.bgIcon}
                />
              </LinearGradient>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
  },
  scrollContent: {
    paddingRight: 20,
    gap: 15,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: 160,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  card: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
     backgroundColor: 'rgba(0,0,0,0.2)',
     paddingHorizontal: 10,
     paddingVertical: 4,
     borderRadius: 12,
  },
  badgeText: {
     color: '#FFF',
     fontSize: 11,
  },
  cardContent: {
    gap: 4,
  },
  cardTitle: {
    color: '#FFF',
    fontSize: 18,
  },
  cardDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginBottom: 8,
  },
  rewardContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(255,255,255,0.1)',
      padding: 8,
      borderRadius: 12,
  },
  rewardText: {
      color: '#FFF',
      fontSize: 11,
      flex: 1,
  },
  bgIcon: {
      position: 'absolute',
      bottom: -20,
      right: -20,
  },
  loadingCard: {
      height: 160,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
  }
});
