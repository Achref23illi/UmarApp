/**
 * Quran Mushaf Screen
 * ===================
 * Uses react-native-quran-hafs package to display the Quran in traditional mushaf format
 * 
 * IMPORTANT NOTE:
 * Before using this screen, you MUST:
 * 1. Download the QCF_BSML font and change its extension from .TTF to .ttf
 * 2. Upload all font files to your server
 * 3. Update the QURAN_FONTS_API constant below with your server URL
 * 
 * Example: const QURAN_FONTS_API = 'https://your-domain.com/fonts/';
 * 
 * Font source: Download QCF fonts from official Quran.com or similar repositories
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { QuranPageLayout, QuranTypesEnums } from 'react-native-quran-hafs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { SURAHS } from '@/services/quranData';
import { saveReadingProgress } from '@/services/quranProgress';
import { setupPlayer } from '@/services/trackPlayerService';
import { useAppSelector } from '@/store/hooks';

interface BookmarkedVerse {
  chapter_id: number;
  verse_number: number;
  page_number: number;
}

// Quran Fonts API - Using official Quran.com fonts repository
// Source: https://github.com/quran/quran.com-images
const QURAN_FONTS_API = 'https://raw.githubusercontent.com/quran/quran.com-images/master/res/fonts/';

// For production, you can upload fonts to your own server and change this URL
// See /docs/quran_setup.md for instructions

const FONTS_NOT_CONFIGURED = false; // Fonts are configured via GitHub CDN

export default function MushafScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { chapterId } = useLocalSearchParams<{
    chapterId: string;
  }>();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);

  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  const surahNumber = parseInt(chapterId || '1');
  const surah = SURAHS.find(s => s.number === surahNumber);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [bookmarkedVerse, setBookmarkedVerse] = useState<BookmarkedVerse | undefined>();

  // Initialize track player for audio (only once on mount)
  useEffect(() => {
    let mounted = true;
    
    const initPlayer = async () => {
      if (mounted) {
        await setupPlayer();
      }
    };
    
    initPlayer();
    
    return () => {
      mounted = false;
    };
  }, []);

  const handleBookmarkedVerse = async (verse: BookmarkedVerse) => {
    console.log('Bookmarked verse:', verse);
    
    setCurrentPage(verse.page_number);
    setBookmarkedVerse(verse);
    
    // Save progress
    await saveReadingProgress({
      surahNumber: verse.chapter_id,
      surahName: surah?.name || '',
      surahEnglishName: surah?.transliteration || '',
      ayahNumber: verse.verse_number,
      juz: Math.ceil(verse.page_number / 20),
      page: verse.page_number,
      totalAyahsInSurah: surah?.verses || 0,
      lastReadAt: new Date().toISOString(),
    });
  };

  const navigateSurah = (direction: 'next' | 'prev') => {
    const newSurah = direction === 'next' ? surahNumber + 1 : surahNumber - 1;
    
    if (newSurah >= 1 && newSurah <= 114) {
      const newMeta = SURAHS.find(s => s.number === newSurah);
      // Use replace to properly update the screen with new surah
      router.replace({
        pathname: '/quran/mushaf',
        params: {
          chapterId: newSurah.toString(),
          chapterName: newMeta?.name || ''
        }
      });
    }
  };

  const showSurahsList = () => {
    router.push('/quran/surahs');
  };

  return (
    <View style={[styles.container, { backgroundColor: '#FFFFFF', paddingTop: insets.top }]}>
      {/* Compact Top Bar */}
      <View style={[styles.topBar, { paddingTop: 8, paddingBottom: 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#8B5CF6" />
        </Pressable>

        <View style={styles.topBarCenter}>
          <Text style={[styles.surahArabicTitleCompact, { fontFamily: fontBold }]}>
            {surah?.name ?? ''}
          </Text>
          <Text style={[styles.surahMetaCompact, { fontFamily: fontRegular }]}>
            {surah?.verses ? `${surah.verses} ${t('quran.verses')}` : ''}
            {surah?.verses && surah?.revelation ? ` • ${surah.revelation}` : ''}
            {!surah?.verses && surah?.revelation ? surah.revelation : ''}
          </Text>
        </View>

        <View style={styles.topBarRight}>
          <Pressable
            style={[styles.navButtonCompact, surahNumber <= 1 && styles.navButtonDisabled]}
            onPress={() => navigateSurah('prev')}
            disabled={surahNumber <= 1}
          >
            <Ionicons 
              name="chevron-back" 
              size={18} 
              color={surahNumber <= 1 ? '#D1D5DB' : '#8B5CF6'} 
            />
            <Text style={[styles.navTextCompact, { fontFamily: fontMedium }]}>
              {t('common.back')}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.navButtonCompact, surahNumber >= 114 && styles.navButtonDisabled]}
            onPress={() => navigateSurah('next')}
            disabled={surahNumber >= 114}
          >
            <Text style={[styles.navTextCompact, { fontFamily: fontMedium }]}>
              {t('common.next')}
            </Text>
            <Ionicons 
              name="chevron-forward" 
              size={18} 
              color={surahNumber >= 114 ? '#D1D5DB' : '#8B5CF6'} 
            />
          </Pressable>

          <Pressable
            style={styles.listButtonCompact}
            onPress={showSurahsList}
          >
            <Ionicons name="list" size={20} color="#8B5CF6" />
          </Pressable>
        </View>
      </View>

      {/* Quran Mushaf Component */}
      <View style={styles.mushafContainer}>
        <View style={styles.mushafWrapper}>
          <View style={styles.mushafContent}>
            <QuranPageLayout
              key={`surah-${surahNumber}`}
              chapterId={surahNumber}
              type={QuranTypesEnums.chapter}
              QURAN_FONTS_API={QURAN_FONTS_API}
              onBookMarkedVerse={handleBookmarkedVerse}
              selectedBookedMarkedVerse={bookmarkedVerse}
              selectionColor="rgba(139, 92, 246, 0.2)"
            />
          </View>
        </View>
        {/* White overlay to hide the decorative banner */}
        <View style={styles.bannerOverlay} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  surahArabicTitleCompact: {
    fontSize: 28,
    lineHeight: 34,
    color: '#8B5CF6',
    textAlign: 'center',
  },
  surahMetaCompact: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navTextCompact: {
    fontSize: 11,
    color: '#8B5CF6',
  },
  listButtonCompact: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mushafContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  mushafWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  mushafContent: {
    flex: 1,
    transform: [{ translateY: -40 }], // Shift content up slightly to hide only the decorative banner
    paddingBottom: 40, // Compensate for the shift to maintain scroll
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 40, // Height to cover only the decorative banner, not the text
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
});
