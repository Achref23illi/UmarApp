/**
 * Quran API Service
 * ==================
 * Connects to Quran API for Quran data
 * Using: https://api.quran.gading.dev
 */

const BASE_URL = 'https://api.quran.gading.dev';

export interface Surah {
  number: number;
  name: {
    short: string;
    long: string;
    transliteration: { en: string; id: string };
    translation: { en: string; id: string };
  };
  numberOfVerses: number;
  revelation: { arab: string; en: string; id: string };
}

export interface Ayah {
  number: {
    inQuran: number;
    inSurah: number;
  };
  text: {
    arab: string;
    transliteration: { en: string };
  };
  translation: {
    en: string;
    id: string;
  };
  audio: {
    primary: string;
  };
  meta: {
    juz: number;
    page: number;
    manzil: number;
    ruku: number;
    hizbQuarter: number;
    sajda: { recommended: boolean; obligatory: boolean };
  };
}

export interface SurahDetail extends Surah {
  verses: Ayah[];
  preBismillah?: {
    text: { arab: string };
    translation: { en: string };
  };
}

// Simplified types for the app
export interface SimpleSurah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface SimpleAyah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  page: number;
  translation: string;
}

export interface SimpleSurahWithAyahs extends SimpleSurah {
  ayahs: SimpleAyah[];
}

// Helper function to fetch with timeout
async function fetchWithTimeout(url: string, timeout = 20000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Get list of all Surahs
export async function getAllSurahs(): Promise<SimpleSurah[]> {
  try {
    console.log('Fetching surahs from:', `${BASE_URL}/surah`);
    const response = await fetchWithTimeout(`${BASE_URL}/surah`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.code === 200) {
      // Map to simplified format
      return data.data.map((s: Surah) => ({
        number: s.number,
        name: s.name.short,
        englishName: s.name.transliteration.en,
        englishNameTranslation: s.name.translation.en,
        numberOfAyahs: s.numberOfVerses,
        revelationType: s.revelation.en,
      }));
    }
    throw new Error(data.message || 'Failed to fetch surahs');
  } catch (error) {
    console.error('Error fetching surahs:', error);
    throw error;
  }
}

// Get a specific Surah with all its Ayahs
export async function getSurah(surahNumber: number): Promise<SimpleSurahWithAyahs> {
  try {
    console.log('Fetching surah:', surahNumber);
    const response = await fetchWithTimeout(`${BASE_URL}/surah/${surahNumber}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.code === 200) {
      const surah: SurahDetail = data.data;
      return {
        number: surah.number,
        name: surah.name.short,
        englishName: surah.name.transliteration.en,
        englishNameTranslation: surah.name.translation.en,
        numberOfAyahs: surah.numberOfVerses,
        revelationType: surah.revelation.en,
        ayahs: surah.verses.map((v: Ayah) => ({
          number: v.number.inQuran,
          numberInSurah: v.number.inSurah,
          text: v.text.arab,
          translation: v.translation.en,
          juz: v.meta.juz,
          page: v.meta.page,
        })),
      };
    }
    throw new Error(data.message || 'Failed to fetch surah');
  } catch (error) {
    console.error('Error fetching surah:', error);
    throw error;
  }
}

// Alias for compatibility
export async function getSurahWithTranslation(
  surahNumber: number
): Promise<{ arabic: SimpleSurahWithAyahs; translation: SimpleSurahWithAyahs }> {
  const surah = await getSurah(surahNumber);
  // This API includes translation in the same response
  return {
    arabic: surah,
    translation: surah, // Same data, translation is included
  };
}

// Get a specific Ayah
export async function getAyah(surahNumber: number, ayahNumber: number): Promise<SimpleAyah | null> {
  try {
    const surah = await getSurah(surahNumber);
    return surah.ayahs.find(a => a.numberInSurah === ayahNumber) || null;
  } catch (error) {
    console.error('Error fetching ayah:', error);
    throw error;
  }
}

// Search in Quran (not available in this API, return empty)
export async function searchQuran(keyword: string): Promise<any[]> {
  console.log('Search not available in current API');
  return [];
}

// Type exports for backward compatibility
export type SurahWithAyahs = SimpleSurahWithAyahs;
