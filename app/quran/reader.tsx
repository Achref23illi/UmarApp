/**
 * Quran Reader Screen
 * ====================
 * Book-like reading experience for Quran
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { getSurah, QURAN_EDITIONS, SURAH_NAMES, SurahContent } from '@/services/quranLibrary';
import { saveReadingProgress } from '@/services/quranProgress';
import { useAppSelector } from '@/store/hooks';

export default function QuranReaderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { editionId, surahNumber, surahName } = useLocalSearchParams<{ 
    editionId: string; 
    surahNumber: string; 
    surahName: string;
  }>();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const scrollViewRef = useRef<ScrollView>(null);

  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontSemiBold = getFont(currentLanguage, 'semiBold');
  const fontBold = getFont(currentLanguage, 'bold');

  const [surahData, setSurahData] = useState<SurahContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(24);
  const [currentVerse, setCurrentVerse] = useState(1);

  const edition = QURAN_EDITIONS.find(e => e.id === editionId);
  const isArabic = edition?.languageCode === 'ar';
  const surahNum = parseInt(surahNumber || '1');
  const surahMeta = SURAH_NAMES[surahNum - 1];

  useEffect(() => {
    if (editionId && surahNumber) {
      loadSurah();
    }
  }, [editionId, surahNumber]);

  const loadSurah = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getSurah(editionId!, surahNum);
      if (data) {
        setSurahData(data);
        
        // Save progress
        await saveReadingProgress({
          surahNumber: surahNum,
          surahName: surahMeta?.arabicName || '',
          surahEnglishName: surahMeta?.englishName || '',
          ayahNumber: 1,
          juz: 1,
          page: 1,
          totalAyahsInSurah: surahMeta?.numberOfAyahs || 0,
          lastReadAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error loading surah:', err);
      setError('Failed to load surah. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleVersePress = async (verseNumber: number) => {
    setCurrentVerse(verseNumber);
    
    await saveReadingProgress({
      surahNumber: surahNum,
      surahName: surahMeta?.arabicName || '',
      surahEnglishName: surahMeta?.englishName || '',
      ayahNumber: verseNumber,
      juz: 1,
      page: 1,
      totalAyahsInSurah: surahMeta?.numberOfAyahs || 0,
      lastReadAt: new Date().toISOString(),
    });
  };

  const navigateSurah = (direction: 'prev' | 'next') => {
    const newSurah = direction === 'next' ? surahNum + 1 : surahNum - 1;
    
    if (newSurah >= 1 && newSurah <= 114) {
      const newMeta = SURAH_NAMES[newSurah - 1];
      router.setParams({ 
        surahNumber: newSurah.toString(),
        surahName: isArabic ? newMeta.arabicName : newMeta.englishName
      });
      setCurrentVerse(1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { fontFamily: fontMedium, color: colors.text.secondary }]}>
          Loading Surah...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.text.secondary} />
        <Text style={[styles.loadingText, { fontFamily: fontMedium, color: colors.text.secondary }]}>
          {error}
        </Text>
        <Pressable 
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={loadSurah}
        >
          <Text style={[styles.retryText, { fontFamily: fontSemiBold }]}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.surface }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.surahTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
              {surahName || 'Surah'}
            </Text>
            <Text style={[styles.surahInfo, { fontFamily: fontRegular, color: colors.text.secondary }]}>
              {surahMeta?.numberOfAyahs} Ayahs • {edition?.language}
            </Text>
          </View>
          
          <Pressable style={styles.headerButton}>
            <Ionicons name="bookmark-outline" size={22} color={colors.text.primary} />
          </Pressable>
        </View>
        
        {/* Font Size Controls */}
        <View style={styles.controls}>
          <Pressable 
            onPress={() => setFontSize(Math.max(18, fontSize - 2))}
            style={[styles.controlButton, { backgroundColor: colors.surfaceHighlight }]}
          >
            <Text style={[styles.controlText, { color: colors.text.primary }]}>A-</Text>
          </Pressable>
          <Text style={[styles.fontSizeText, { fontFamily: fontMedium, color: colors.text.secondary }]}>
            {fontSize}
          </Text>
          <Pressable 
            onPress={() => setFontSize(Math.min(36, fontSize + 2))}
            style={[styles.controlButton, { backgroundColor: colors.surfaceHighlight }]}
          >
            <Text style={[styles.controlText, { color: colors.text.primary }]}>A+</Text>
          </Pressable>
        </View>
      </View>

      {/* Bismillah */}
      {surahNum !== 9 && surahNum !== 1 && (
        <View style={[styles.bismillah, { backgroundColor: colors.surface }]}>
          <Text style={[styles.bismillahText, { color: colors.primary }]}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </Text>
        </View>
      )}

      {/* Verses */}
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Surah Header Card */}
        <View style={[styles.surahHeader, { backgroundColor: colors.primary + '10' }]}>
          <Text style={[styles.surahHeaderArabic, { color: colors.primary }]}>
            {surahMeta?.arabicName}
          </Text>
          <Text style={[styles.surahHeaderEnglish, { fontFamily: fontMedium, color: colors.text.primary }]}>
            {surahMeta?.englishName} - {surahMeta?.englishTranslation}
          </Text>
          <Text style={[styles.surahHeaderMeta, { fontFamily: fontRegular, color: colors.text.secondary }]}>
            {surahMeta?.revelationType} • {surahMeta?.numberOfAyahs} Verses
          </Text>
        </View>

        {/* Verses */}
        {surahData?.verses.map((verse, index) => {
          const isCurrentVerse = verse.number === currentVerse;
          
          return (
            <Animated.View 
              key={verse.number}
              entering={FadeIn.delay(Math.min(index, 10) * 20).duration(300)}
            >
              <Pressable
                style={[
                  styles.verseContainer,
                  { 
                    backgroundColor: isCurrentVerse ? colors.primary + '08' : colors.surface,
                    borderLeftColor: isCurrentVerse ? colors.primary : 'transparent',
                  }
                ]}
                onPress={() => handleVersePress(verse.number)}
              >
                {/* Verse Number */}
                <View style={[styles.verseNumber, { backgroundColor: colors.primary + '15' }]}>
                  <Text style={[styles.verseNumberText, { fontFamily: fontMedium, color: colors.primary }]}>
                    {verse.number}
                  </Text>
                </View>
                
                {/* Verse Text */}
                <Text 
                  style={[
                    styles.verseText, 
                    { 
                      fontSize, 
                      color: colors.text.primary,
                      textAlign: isArabic ? 'right' : 'left',
                      lineHeight: isArabic ? fontSize * 2.2 : fontSize * 1.8,
                    }
                  ]}
                >
                  {verse.text}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}

        {/* Navigation */}
        <View style={styles.navigation}>
          <Pressable
            style={[
              styles.navButton,
              { backgroundColor: colors.surface, opacity: surahNum <= 1 ? 0.5 : 1 }
            ]}
            onPress={() => navigateSurah('prev')}
            disabled={surahNum <= 1}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text.primary} />
            <Text style={[styles.navButtonText, { fontFamily: fontMedium, color: colors.text.primary }]}>
              Previous
            </Text>
          </Pressable>
          
          <Pressable
            style={[
              styles.navButton,
              { backgroundColor: colors.surface, opacity: surahNum >= 114 ? 0.5 : 1 }
            ]}
            onPress={() => navigateSurah('next')}
            disabled={surahNum >= 114}
          >
            <Text style={[styles.navButtonText, { fontFamily: fontMedium, color: colors.text.primary }]}>
              Next
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.text.primary} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  surahTitle: {
    fontSize: 18,
  },
  surahInfo: {
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fontSizeText: {
    fontSize: 13,
    minWidth: 30,
    textAlign: 'center',
  },
  bismillah: {
    paddingVertical: 20,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  bismillahText: {
    fontSize: 28,
    fontFamily: 'System',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  surahHeader: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  surahHeaderArabic: {
    fontSize: 32,
    fontFamily: 'System',
    marginBottom: 8,
  },
  surahHeaderEnglish: {
    fontSize: 16,
    marginBottom: 4,
  },
  surahHeaderMeta: {
    fontSize: 12,
  },
  verseContainer: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
  },
  verseNumber: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseNumberText: {
    fontSize: 11,
  },
  verseText: {
    fontFamily: 'System',
    paddingRight: 40,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  navButtonText: {
    fontSize: 14,
  },
});
