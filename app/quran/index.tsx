/**
 * Quran Library Screen
 * ====================
 * Library-style selection between Arabic Mushaf and French Translation
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/store/hooks';

interface QuranEdition {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  route: string;
}

const QURAN_EDITIONS: QuranEdition[] = [
  {
    id: 'mushaf',
    title: 'المصحف',
    subtitle: 'Arabic Mushaf',
    description: 'Traditional Quran pages with authentic Hafs script',
    icon: 'book',
    color: '#10B981',
    route: '/quran/surahs',
  },
  {
    id: 'french',
    title: 'Traduction Française',
    subtitle: 'French Translation',
    description: 'Complete French translation of the Holy Quran',
    icon: 'language',
    color: '#3B82F6',
    route: '/quran/french-surahs',
  },
];

export default function QuranLibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);

  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontSemiBold = getFont(currentLanguage, 'semiBold');
  const fontBold = getFont(currentLanguage, 'bold');

  const handleEditionPress = (edition: QuranEdition) => {
    router.push(edition.route as any);
  };

  const renderEditionCard = (edition: QuranEdition, index: number) => {
    return (
      <Animated.View 
        key={edition.id}
        entering={FadeInUp.delay(200 + index * 150).duration(500)}
      >
        <Pressable
          style={({ pressed }) => [
            styles.editionCard,
            { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
          ]}
          onPress={() => handleEditionPress(edition)}
        >
          <LinearGradient
            colors={[edition.color, darkenColor(edition.color, 20)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.editionGradient}
          >
            {/* Icon */}
            <View style={styles.editionIconContainer}>
              <Ionicons name={edition.icon as any} size={48} color="#FFF" />
            </View>
            
            {/* Content */}
            <View style={styles.editionContent}>
              <Text style={[styles.editionTitle, { fontFamily: fontBold }]}>
                {edition.title}
              </Text>
              <Text style={[styles.editionSubtitle, { fontFamily: fontMedium }]}>
                {edition.subtitle}
              </Text>
              <Text style={[styles.editionDescription, { fontFamily: fontRegular }]}>
                {edition.description}
              </Text>
            </View>
            
            {/* Arrow */}
            <View style={styles.editionArrow}>
              <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
          {t('common.quran') || 'Quran Library'}
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Library Intro */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text style={[styles.sectionTitle, { fontFamily: fontSemiBold, color: colors.text.primary }]}>
            📚 Choose Your Edition
          </Text>
          <Text style={[styles.sectionSubtitle, { fontFamily: fontRegular, color: colors.text.secondary }]}>
            Select how you'd like to read the Holy Quran
          </Text>
        </Animated.View>

        {/* Edition Cards */}
        <View style={styles.editionsContainer}>
          {QURAN_EDITIONS.map((edition, index) => renderEditionCard(edition, index))}
        </View>

        {/* Info Card */}
        <Animated.View 
          entering={FadeInUp.delay(600)}
          style={[styles.infoCard, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <Text style={[styles.infoText, { fontFamily: fontRegular, color: colors.text.secondary }]}>
            Both editions contain all 114 Surahs of the Holy Quran. Your reading progress is saved automatically.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// Utility to darken a color
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  return `#${(
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1)}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 22,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 30,
  },
  editionsContainer: {
    gap: 16,
    marginBottom: 30,
  },
  editionCard: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  editionGradient: {
    padding: 20,
    minHeight: 140,
  },
  editionIconContainer: {
    marginBottom: 12,
  },
  editionContent: {
    flex: 1,
  },
  editionTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  editionSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 8,
  },
  editionDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
  },
  editionArrow: {
    position: 'absolute',
    right: 20,
    top: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
});
