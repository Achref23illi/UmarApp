/**
 * Quran Library Screen
 * ======================
 * Library-style display with book covers for each edition
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
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
import { QURAN_EDITIONS, QuranEdition } from '@/services/quranLibrary';
import { useAppSelector } from '@/store/hooks';

export default function QuranLibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);

  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontSemiBold = getFont(currentLanguage, 'semiBold');
  const fontBold = getFont(currentLanguage, 'bold');

  const handleEditionPress = (edition: QuranEdition) => {
    router.push({
      pathname: '/quran/surahs',
      params: { editionId: edition.id, editionName: edition.name }
    });
  };

  const renderBookCover = (edition: QuranEdition, index: number) => {
    const isArabic = edition.languageCode === 'ar';
    
    return (
      <Animated.View 
        key={edition.id}
        entering={FadeInUp.delay(200 + index * 150).duration(500)}
      >
        <Pressable
          style={({ pressed }) => [
            styles.bookContainer,
            { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }
          ]}
          onPress={() => handleEditionPress(edition)}
        >
          {/* Book Cover */}
          <LinearGradient
            colors={[edition.coverColor, darkenColor(edition.coverColor, 30)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bookCover}
          >
            {/* Spine Effect */}
            <View style={styles.bookSpine}>
              <LinearGradient
                colors={['rgba(255,255,255,0.15)', 'rgba(0,0,0,0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.spineGradient}
              />
            </View>
            
            {/* Decorative Pattern */}
            <View style={styles.decorativePattern}>
              <View style={[styles.patternLine, { width: '60%' }]} />
              <View style={[styles.patternDot]} />
              <View style={[styles.patternLine, { width: '40%' }]} />
            </View>
            
            {/* Book Content */}
            <View style={styles.bookContent}>
              <Text style={[styles.bookIcon]}>{edition.icon}</Text>
              <Text 
                style={[
                  styles.bookTitle, 
                  { fontFamily: isArabic ? undefined : fontBold }
                ]}
              >
                {edition.name}
              </Text>
              <Text style={[styles.bookLanguage, { fontFamily: fontMedium }]}>
                {edition.language}
              </Text>
            </View>
            
            {/* Bottom Decoration */}
            <View style={styles.bottomDecoration}>
              <View style={[styles.patternLine, { width: '30%' }]} />
              <View style={[styles.patternDot, { width: 6, height: 6 }]} />
              <View style={[styles.patternLine, { width: '30%' }]} />
            </View>
            
            {/* Author */}
            <Text style={[styles.bookAuthor, { fontFamily: fontRegular }]}>
              {edition.author}
            </Text>
          </LinearGradient>
          
          {/* Book Shadow */}
          <View style={[styles.bookShadow, { backgroundColor: edition.coverColor }]} />
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
          Quran Library
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
            Select a Quran edition in your preferred language
          </Text>
        </Animated.View>

        {/* Book Shelf */}
        <View style={styles.bookShelf}>
          {QURAN_EDITIONS.map((edition, index) => renderBookCover(edition, index))}
        </View>

        {/* Info Card */}
        <Animated.View 
          entering={FadeInUp.delay(800)}
          style={[styles.infoCard, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <Text style={[styles.infoText, { fontFamily: fontRegular, color: colors.text.secondary }]}>
            Each edition contains all 114 Surahs of the Holy Quran. Your reading progress is saved automatically.
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
  bookShelf: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 30,
  },
  bookContainer: {
    width: '100%',
    marginBottom: 10,
  },
  bookCover: {
    height: 200,
    borderRadius: 12,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  bookSpine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 20,
    overflow: 'hidden',
  },
  spineGradient: {
    flex: 1,
  },
  decorativePattern: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  patternLine: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  patternDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  bookContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  bookTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  bookLanguage: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  bottomDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  bookAuthor: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 10,
  },
  bookShadow: {
    position: 'absolute',
    bottom: -5,
    left: 10,
    right: 10,
    height: 10,
    borderRadius: 6,
    opacity: 0.3,
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
