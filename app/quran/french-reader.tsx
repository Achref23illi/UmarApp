/**
 * French Quran Reader
 * ====================
 * Displays French translation of the Quran verses
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { SURAHS } from '@/services/quranData';
import { FrenchSurah, getFrenchSurah } from '@/services/quranFrench';
import { saveReadingProgress } from '@/services/quranProgress';
import { useAppSelector } from '@/store/hooks';

export default function FrenchReaderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { chapterId, chapterName } = useLocalSearchParams<{
    chapterId: string;
    chapterName?: string;
  }>();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);

  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontSemiBold = getFont(currentLanguage, 'semiBold');
  const fontBold = getFont(currentLanguage, 'bold');

  const [surahData, setSurahData] = useState<FrenchSurah | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(18);
  const [currentVerse, setCurrentVerse] = useState(1);

  const surahNumber = parseInt(chapterId || '1');
  const surahMeta = SURAHS.find(s => s.number === surahNumber);

  useEffect(() => {
    loadSurah();
  }, [chapterId]);

  const loadSurah = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getFrenchSurah(surahNumber);
      if (data) {
        setSurahData(data);
        
        // Save progress
        await saveReadingProgress({
          surahNumber: surahNumber,
          surahName: surahMeta?.name || '',
          surahEnglishName: surahMeta?.transliteration || '',
          ayahNumber: 1,
          juz: 1,
          page: 1,
          totalAyahsInSurah: surahMeta?.verses || 0,
          lastReadAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error loading French surah:', err);
      setError('Échec du chargement de la sourate. Veuillez vérifier votre connexion Internet.');
    } finally {
      setLoading(false);
    }
  };

  const handleVersePress = async (verseNumber: number) => {
    setCurrentVerse(verseNumber);
    
    await saveReadingProgress({
      surahNumber: surahNumber,
      surahName: surahMeta?.name || '',
      surahEnglishName: surahMeta?.transliteration || '',
      ayahNumber: verseNumber,
      juz: 1,
      page: 1,
      totalAyahsInSurah: surahMeta?.verses || 0,
      lastReadAt: new Date().toISOString(),
    });
  };

  const navigateSurah = (direction: 'prev' | 'next') => {
    const newSurah = direction === 'next' ? surahNumber + 1 : surahNumber - 1;
    
    if (newSurah >= 1 && newSurah <= 114) {
      const newMeta = SURAHS.find(s => s.number === newSurah);
      router.setParams({ 
        chapterId: newSurah.toString(),
        chapterName: newMeta?.transliteration
      });
      setCurrentVerse(1);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { fontFamily: fontMedium, color: colors.text.secondary }]}>
          Chargement de la sourate...
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
          <Text style={[styles.retryText, { fontFamily: fontSemiBold }]}>Réessayer</Text>
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
              {chapterName || surahMeta?.transliteration}
            </Text>
            <Text style={[styles.surahInfo, { fontFamily: fontRegular, color: colors.text.secondary }]}>
              {surahMeta?.verses} Versets • Traduction Française
            </Text>
          </View>
          
          <Pressable style={styles.headerButton}>
            <Ionicons name="bookmark-outline" size={22} color={colors.text.primary} />
          </Pressable>
        </View>
        
        {/* Font Size Controls */}
        <View style={styles.controls}>
          <Pressable 
            onPress={() => setFontSize(Math.max(14, fontSize - 2))}
            style={[styles.controlButton, { backgroundColor: colors.surfaceHighlight }]}
          >
            <Text style={[styles.controlText, { color: colors.text.primary }]}>A-</Text>
          </Pressable>
          <Text style={[styles.fontSizeText, { fontFamily: fontMedium, color: colors.text.secondary }]}>
            {fontSize}
          </Text>
          <Pressable 
            onPress={() => setFontSize(Math.min(24, fontSize + 2))}
            style={[styles.controlButton, { backgroundColor: colors.surfaceHighlight }]}
          >
            <Text style={[styles.controlText, { color: colors.text.primary }]}>A+</Text>
          </Pressable>
        </View>
      </View>

      {/* Bismillah */}
      {surahNumber !== 9 && surahNumber !== 1 && (
        <View style={[styles.bismillah, { backgroundColor: colors.surface }]}>
          <Text style={[styles.bismillahText, { color: colors.primary }]}>
            Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux
          </Text>
        </View>
      )}

      {/* Verses */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Surah Header Card */}
        <View style={[styles.surahHeader, { backgroundColor: colors.primary + '10' }]}>
          <Text style={[styles.surahHeaderArabic, { color: colors.primary }]}>
            {surahMeta?.name}
          </Text>
          <Text style={[styles.surahHeaderEnglish, { fontFamily: fontMedium, color: colors.text.primary }]}>
            {surahMeta?.transliteration} - {surahMeta?.translation}
          </Text>
          <Text style={[styles.surahHeaderMeta, { fontFamily: fontRegular, color: colors.text.secondary }]}>
            {surahMeta?.revelation === 'Meccan' ? 'Mecquoise' : 'Médinoise'} • {surahMeta?.verses} Versets
          </Text>
        </View>

        {/* Verses */}
        {surahData?.verses.map((verse, index) => {
          const isCurrentVerse = verse.ayah === currentVerse;
          
          return (
            <Animated.View 
              key={verse.id}
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
                onPress={() => handleVersePress(verse.ayah)}
              >
                {/* Verse Number */}
                <View style={[styles.verseNumber, { backgroundColor: colors.primary + '15' }]}>
                  <Text style={[styles.verseNumberText, { fontFamily: fontMedium, color: colors.primary }]}>
                    {verse.ayah}
                  </Text>
                </View>
                
                {/* Verse Text */}
                <Text 
                  style={[
                    styles.verseText, 
                    { 
                      fontSize, 
                      fontFamily: fontRegular,
                      color: colors.text.primary,
                      lineHeight: fontSize * 1.8,
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
              { backgroundColor: colors.surface, opacity: surahNumber <= 1 ? 0.5 : 1 }
            ]}
            onPress={() => navigateSurah('prev')}
            disabled={surahNumber <= 1}
          >
            <Ionicons name="chevron-back" size={20} color={colors.text.primary} />
            <Text style={[styles.navButtonText, { fontFamily: fontMedium, color: colors.text.primary }]}>
              Précédente
            </Text>
          </Pressable>
          
          <Pressable
            style={[
              styles.navButton,
              { backgroundColor: colors.surface, opacity: surahNumber >= 114 ? 0.5 : 1 }
            ]}
            onPress={() => navigateSurah('next')}
            disabled={surahNumber >= 114}
          >
            <Text style={[styles.navButtonText, { fontFamily: fontMedium, color: colors.text.primary }]}>
              Suivante
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
    paddingHorizontal: 20,
  },
  bismillahText: {
    fontSize: 16,
    textAlign: 'center',
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
