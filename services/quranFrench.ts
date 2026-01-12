/**
 * French Quran Translation Service
 * =================================
 * Fetches French translation from quran-cloud CDN
 */

const FRENCH_QURAN_API = 'https://cdn.jsdelivr.net/npm/quran-cloud@1.0.0/dist/quran_fr.json';

export interface FrenchVerse {
  id: number;
  surah: number;
  ayah: number;
  text: string;
}

export interface FrenchSurah {
  number: number;
  name: string;
  verses: FrenchVerse[];
}

let cachedData: FrenchSurah[] | null = null;

/**
 * Fetch the complete French Quran
 */
export async function getFrenchQuran(): Promise<FrenchSurah[]> {
  if (cachedData) {
    return cachedData;
  }

  try {
    const response = await fetch(FRENCH_QURAN_API);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform the data into our format
    const surahs: FrenchSurah[] = [];
    
    // Group verses by surah
    const surahMap = new Map<number, FrenchVerse[]>();
    
    data.forEach((verse: FrenchVerse) => {
      if (!surahMap.has(verse.surah)) {
        surahMap.set(verse.surah, []);
      }
      surahMap.get(verse.surah)!.push(verse);
    });
    
    // Create surah objects
    surahMap.forEach((verses, surahNumber) => {
      surahs.push({
        number: surahNumber,
        name: `Surah ${surahNumber}`,
        verses: verses.sort((a, b) => a.ayah - b.ayah),
      });
    });
    
    cachedData = surahs.sort((a, b) => a.number - b.number);
    return cachedData;
  } catch (error) {
    console.error('Error fetching French Quran:', error);
    throw error;
  }
}

/**
 * Get a specific surah in French
 */
export async function getFrenchSurah(surahNumber: number): Promise<FrenchSurah | null> {
  try {
    const quran = await getFrenchQuran();
    return quran.find(s => s.number === surahNumber) || null;
  } catch (error) {
    console.error('Error fetching French surah:', error);
    return null;
  }
}
