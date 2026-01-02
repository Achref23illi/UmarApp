/**
 * Features Screen
 * =================
 * Hub for additional Islamic tools and utilities.
 * Redesigned with a premium grid layout.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import i18n from '@/locales/i18n';
import { useAppSelector } from '@/store/hooks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

interface FeatureItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: string;
  descKey: string;
  route: string;
  colors: [string, string];
}

const FEATURES: FeatureItem[] = [
  { 
    id: 'qibla', 
    icon: 'compass', 
    labelKey: 'features.qibla', 
    descKey: 'features.qiblaDesc',
    route: '/qibla', 
    colors: ['#F59E0B', '#D97706']
  },
  { 
    id: 'tasbih', 
    icon: 'finger-print', 
    labelKey: 'features.tasbih', 
    descKey: 'features.tasbihDesc',
    route: '/tasbih', 
    colors: ['#10B981', '#059669']
  },
  { 
    id: 'names', 
    icon: 'water', 
    labelKey: 'features.namesOfAllah', 
    descKey: 'features.namesDesc',
    route: '/names-of-allah', 
    colors: ['#3B82F6', '#2563EB']
  },
  { 
    id: 'calendar', 
    icon: 'calendar', 
    labelKey: 'features.calendar', 
    descKey: 'features.calendarDesc',
    route: '/islamic-calendar', 
    colors: ['#8B5CF6', '#7C3AED']
  },
  { 
    id: 'duas', 
    icon: 'book', 
    labelKey: 'features.dua', 
    descKey: 'features.duaDesc',
    route: '/dua', 
    colors: ['#EC4899', '#DB2777']
  },
  { 
    id: 'mosques', 
    icon: 'location', 
    labelKey: 'features.mosques', 
    descKey: 'features.mosquesDesc',
    route: '/mosques', 
    colors: ['#EF4444', '#DC2626']
  },
];

export default function FeaturesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  
  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontBold = getFont(currentLanguage, 'bold');

  // Force re-render on language change
  const t = (key: string) => i18n.t(key, { locale: currentLanguage });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background Pattern */}
      <View style={[StyleSheet.absoluteFill, { opacity: 0.05 }]}>
          {/* We could add an image pattern here if available, using simple view for now */}
          <View style={{ flex: 1, backgroundColor: colors.primary }} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.headerContainer}>
            <Text style={[styles.headerTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
                {t('features.title')}
            </Text>
            <Text style={[styles.headerSubtitle, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                {t('features.subtitle')}
            </Text>
        </Animated.View>

        {/* Grid */}
        <View style={styles.grid}>
            {FEATURES.map((item, index) => (
                <Animated.View 
                    key={item.id} 
                    entering={FadeInDown.delay(200 + index * 100).springify()}
                    style={styles.cardWrapper}
                >
                    <Pressable
                        style={({ pressed }) => [
                            styles.card,
                            { 
                                backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                                transform: [{ scale: pressed ? 0.96 : 1 }],
                                shadowOpacity: isDark ? 0.3 : 0.08,
                            }
                        ]}
                        onPress={() => router.push(item.route as any)}
                    >
                        <LinearGradient
                            colors={item.colors}
                            style={styles.iconContainer}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name={item.icon} size={26} color="#FFF" />
                        </LinearGradient>
                        
                        <View style={styles.cardContent}>
                            <Text style={[styles.cardTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
                                {t(item.labelKey)}
                            </Text>
                            <Text style={[styles.cardDesc, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                                {t(item.descKey)}
                            </Text>
                        </View>
                        
                        <View style={[styles.arrowContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }]}>
                            <Ionicons name="arrow-forward" size={16} color={colors.text.secondary} />
                        </View>
                    </Pressable>
                </Animated.View>
            ))}
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  headerContainer: {
    marginBottom: 30,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 32,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  card: {
    borderRadius: 24,
    padding: 16,
    minHeight: 180,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.1)',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  arrowContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
