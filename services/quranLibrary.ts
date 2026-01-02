/**
 * Quran Library Service
 * ======================
 * Library-style Quran with multiple editions (Arabic, English, French)
 * Using fawazahmed0/quran-api CDN
 */

const CDN_BASE = 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1';

// Available Quran Editions
export interface QuranEdition {
  id: string;
  name: string;
  language: string;
  languageCode: 'ar' | 'en' | 'fr';
  author: string;
  direction: 'rtl' | 'ltr';
  coverColor: string;
  icon: string;
}

export const QURAN_EDITIONS: QuranEdition[] = [
  {
    id: 'ara-quransimple',
    name: 'القرآن الكريم',
    language: 'Arabic',
    languageCode: 'ar',
    author: 'Original Arabic',
    direction: 'rtl',
    coverColor: '#1B4332',
    icon: '🕌',
  },
  {
    id: 'eng-abdulhye',
    name: 'The Noble Quran',
    language: 'English',
    languageCode: 'en',
    author: 'Dr. Abdul Hye',
    direction: 'ltr',
    coverColor: '#1E3A5F',
    icon: '📖',
  },
  {
    id: 'fra-muhammadhameedu',
    name: 'Le Noble Coran',
    language: 'French',
    languageCode: 'fr',
    author: 'Muhammad Hamidullah',
    direction: 'ltr',
    coverColor: '#4A1942',
    icon: '📚',
  },
];

// Surah metadata (same for all editions)
export interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  englishTranslation: string;
  arabicName: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
}

// Ayah/Verse
export interface Verse {
  number: number;
  text: string;
}

// Full Surah with verses
export interface SurahContent {
  number: number;
  name: string;
  verses: Verse[];
}

// Cache for loaded editions
const editionCache: Record<string, SurahContent[]> = {};

// Fetch with timeout
async function fetchWithTimeout(url: string, timeout = 20000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Get full Quran for an edition
export async function getQuranEdition(editionId: string): Promise<SurahContent[]> {
  // Check cache first
  if (editionCache[editionId]) {
    console.log('Using cached edition:', editionId);
    return editionCache[editionId];
  }

  try {
    console.log('Fetching edition:', editionId);
    const url = `${CDN_BASE}/editions/${editionId}.min.json`;
    console.log('URL:', url);
    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch edition: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Edition data received, verses:', data.quran?.length);
    // Transform the data into our format
    // The API returns: { quran: [ { chapter, verse, text }, ... ] }
    const surahs: SurahContent[] = [];
    
    for (let i = 1; i <= 114; i++) {
      surahs.push({
        number: i,
        name: SURAH_NAMES[i - 1]?.name || `Surah ${i}`,
        verses: [],
      });
    }
    
    // Group verses by chapter
    if (data.quran) {
      data.quran.forEach((item: { chapter: number; verse: number; text: string }) => {
        const surahIndex = item.chapter - 1;
        if (surahs[surahIndex]) {
          surahs[surahIndex].verses.push({
            number: item.verse,
            text: item.text,
          });
        }
      });
    }
    
    // Cache the result
    editionCache[editionId] = surahs;
    
    return surahs;
  } catch (error) {
    console.error('Error fetching edition:', error);
    throw error;
  }
}

// Get a specific surah from an edition
export async function getSurah(editionId: string, surahNumber: number): Promise<SurahContent | null> {
  const edition = await getQuranEdition(editionId);
  return edition.find(s => s.number === surahNumber) || null;
}

// Surah names metadata
export const SURAH_NAMES: SurahMeta[] = [
  { number: 1, name: 'Al-Fatiha', englishName: 'Al-Fatiha', englishTranslation: 'The Opening', arabicName: 'الفاتحة', numberOfAyahs: 7, revelationType: 'Meccan' },
  { number: 2, name: 'Al-Baqara', englishName: 'Al-Baqara', englishTranslation: 'The Cow', arabicName: 'البقرة', numberOfAyahs: 286, revelationType: 'Medinan' },
  { number: 3, name: 'Aal-Imran', englishName: 'Aal-Imran', englishTranslation: 'The Family of Imran', arabicName: 'آل عمران', numberOfAyahs: 200, revelationType: 'Medinan' },
  { number: 4, name: 'An-Nisa', englishName: 'An-Nisa', englishTranslation: 'The Women', arabicName: 'النساء', numberOfAyahs: 176, revelationType: 'Medinan' },
  { number: 5, name: 'Al-Maida', englishName: 'Al-Maida', englishTranslation: 'The Table', arabicName: 'المائدة', numberOfAyahs: 120, revelationType: 'Medinan' },
  { number: 6, name: "Al-An'am", englishName: "Al-An'am", englishTranslation: 'The Cattle', arabicName: 'الأنعام', numberOfAyahs: 165, revelationType: 'Meccan' },
  { number: 7, name: "Al-A'raf", englishName: "Al-A'raf", englishTranslation: 'The Heights', arabicName: 'الأعراف', numberOfAyahs: 206, revelationType: 'Meccan' },
  { number: 8, name: 'Al-Anfal', englishName: 'Al-Anfal', englishTranslation: 'The Spoils of War', arabicName: 'الأنفال', numberOfAyahs: 75, revelationType: 'Medinan' },
  { number: 9, name: 'At-Tawba', englishName: 'At-Tawba', englishTranslation: 'The Repentance', arabicName: 'التوبة', numberOfAyahs: 129, revelationType: 'Medinan' },
  { number: 10, name: 'Yunus', englishName: 'Yunus', englishTranslation: 'Jonah', arabicName: 'يونس', numberOfAyahs: 109, revelationType: 'Meccan' },
  { number: 11, name: 'Hud', englishName: 'Hud', englishTranslation: 'Hud', arabicName: 'هود', numberOfAyahs: 123, revelationType: 'Meccan' },
  { number: 12, name: 'Yusuf', englishName: 'Yusuf', englishTranslation: 'Joseph', arabicName: 'يوسف', numberOfAyahs: 111, revelationType: 'Meccan' },
  { number: 13, name: "Ar-Ra'd", englishName: "Ar-Ra'd", englishTranslation: 'The Thunder', arabicName: 'الرعد', numberOfAyahs: 43, revelationType: 'Medinan' },
  { number: 14, name: 'Ibrahim', englishName: 'Ibrahim', englishTranslation: 'Abraham', arabicName: 'إبراهيم', numberOfAyahs: 52, revelationType: 'Meccan' },
  { number: 15, name: 'Al-Hijr', englishName: 'Al-Hijr', englishTranslation: 'The Rocky Tract', arabicName: 'الحجر', numberOfAyahs: 99, revelationType: 'Meccan' },
  { number: 16, name: 'An-Nahl', englishName: 'An-Nahl', englishTranslation: 'The Bee', arabicName: 'النحل', numberOfAyahs: 128, revelationType: 'Meccan' },
  { number: 17, name: 'Al-Isra', englishName: 'Al-Isra', englishTranslation: 'The Night Journey', arabicName: 'الإسراء', numberOfAyahs: 111, revelationType: 'Meccan' },
  { number: 18, name: 'Al-Kahf', englishName: 'Al-Kahf', englishTranslation: 'The Cave', arabicName: 'الكهف', numberOfAyahs: 110, revelationType: 'Meccan' },
  { number: 19, name: 'Maryam', englishName: 'Maryam', englishTranslation: 'Mary', arabicName: 'مريم', numberOfAyahs: 98, revelationType: 'Meccan' },
  { number: 20, name: 'Ta-Ha', englishName: 'Ta-Ha', englishTranslation: 'Ta-Ha', arabicName: 'طه', numberOfAyahs: 135, revelationType: 'Meccan' },
  { number: 21, name: 'Al-Anbiya', englishName: 'Al-Anbiya', englishTranslation: 'The Prophets', arabicName: 'الأنبياء', numberOfAyahs: 112, revelationType: 'Meccan' },
  { number: 22, name: 'Al-Hajj', englishName: 'Al-Hajj', englishTranslation: 'The Pilgrimage', arabicName: 'الحج', numberOfAyahs: 78, revelationType: 'Medinan' },
  { number: 23, name: "Al-Mu'minun", englishName: "Al-Mu'minun", englishTranslation: 'The Believers', arabicName: 'المؤمنون', numberOfAyahs: 118, revelationType: 'Meccan' },
  { number: 24, name: 'An-Nur', englishName: 'An-Nur', englishTranslation: 'The Light', arabicName: 'النور', numberOfAyahs: 64, revelationType: 'Medinan' },
  { number: 25, name: 'Al-Furqan', englishName: 'Al-Furqan', englishTranslation: 'The Criterion', arabicName: 'الفرقان', numberOfAyahs: 77, revelationType: 'Meccan' },
  { number: 26, name: "Ash-Shu'ara", englishName: "Ash-Shu'ara", englishTranslation: 'The Poets', arabicName: 'الشعراء', numberOfAyahs: 227, revelationType: 'Meccan' },
  { number: 27, name: 'An-Naml', englishName: 'An-Naml', englishTranslation: 'The Ant', arabicName: 'النمل', numberOfAyahs: 93, revelationType: 'Meccan' },
  { number: 28, name: 'Al-Qasas', englishName: 'Al-Qasas', englishTranslation: 'The Stories', arabicName: 'القصص', numberOfAyahs: 88, revelationType: 'Meccan' },
  { number: 29, name: 'Al-Ankabut', englishName: 'Al-Ankabut', englishTranslation: 'The Spider', arabicName: 'العنكبوت', numberOfAyahs: 69, revelationType: 'Meccan' },
  { number: 30, name: 'Ar-Rum', englishName: 'Ar-Rum', englishTranslation: 'The Romans', arabicName: 'الروم', numberOfAyahs: 60, revelationType: 'Meccan' },
  { number: 31, name: 'Luqman', englishName: 'Luqman', englishTranslation: 'Luqman', arabicName: 'لقمان', numberOfAyahs: 34, revelationType: 'Meccan' },
  { number: 32, name: 'As-Sajda', englishName: 'As-Sajda', englishTranslation: 'The Prostration', arabicName: 'السجدة', numberOfAyahs: 30, revelationType: 'Meccan' },
  { number: 33, name: 'Al-Ahzab', englishName: 'Al-Ahzab', englishTranslation: 'The Combined Forces', arabicName: 'الأحزاب', numberOfAyahs: 73, revelationType: 'Medinan' },
  { number: 34, name: 'Saba', englishName: 'Saba', englishTranslation: 'Sheba', arabicName: 'سبأ', numberOfAyahs: 54, revelationType: 'Meccan' },
  { number: 35, name: 'Fatir', englishName: 'Fatir', englishTranslation: 'Originator', arabicName: 'فاطر', numberOfAyahs: 45, revelationType: 'Meccan' },
  { number: 36, name: 'Ya-Sin', englishName: 'Ya-Sin', englishTranslation: 'Ya Sin', arabicName: 'يس', numberOfAyahs: 83, revelationType: 'Meccan' },
  { number: 37, name: 'As-Saffat', englishName: 'As-Saffat', englishTranslation: 'Those Who Set The Ranks', arabicName: 'الصافات', numberOfAyahs: 182, revelationType: 'Meccan' },
  { number: 38, name: 'Sad', englishName: 'Sad', englishTranslation: 'The Letter Sad', arabicName: 'ص', numberOfAyahs: 88, revelationType: 'Meccan' },
  { number: 39, name: 'Az-Zumar', englishName: 'Az-Zumar', englishTranslation: 'The Troops', arabicName: 'الزمر', numberOfAyahs: 75, revelationType: 'Meccan' },
  { number: 40, name: 'Ghafir', englishName: 'Ghafir', englishTranslation: 'The Forgiver', arabicName: 'غافر', numberOfAyahs: 85, revelationType: 'Meccan' },
  { number: 41, name: 'Fussilat', englishName: 'Fussilat', englishTranslation: 'Explained in Detail', arabicName: 'فصلت', numberOfAyahs: 54, revelationType: 'Meccan' },
  { number: 42, name: 'Ash-Shura', englishName: 'Ash-Shura', englishTranslation: 'The Consultation', arabicName: 'الشورى', numberOfAyahs: 53, revelationType: 'Meccan' },
  { number: 43, name: 'Az-Zukhruf', englishName: 'Az-Zukhruf', englishTranslation: 'The Ornaments of Gold', arabicName: 'الزخرف', numberOfAyahs: 89, revelationType: 'Meccan' },
  { number: 44, name: 'Ad-Dukhan', englishName: 'Ad-Dukhan', englishTranslation: 'The Smoke', arabicName: 'الدخان', numberOfAyahs: 59, revelationType: 'Meccan' },
  { number: 45, name: 'Al-Jathiya', englishName: 'Al-Jathiya', englishTranslation: 'The Crouching', arabicName: 'الجاثية', numberOfAyahs: 37, revelationType: 'Meccan' },
  { number: 46, name: 'Al-Ahqaf', englishName: 'Al-Ahqaf', englishTranslation: 'The Wind-Curved Sandhills', arabicName: 'الأحقاف', numberOfAyahs: 35, revelationType: 'Meccan' },
  { number: 47, name: 'Muhammad', englishName: 'Muhammad', englishTranslation: 'Muhammad', arabicName: 'محمد', numberOfAyahs: 38, revelationType: 'Medinan' },
  { number: 48, name: 'Al-Fath', englishName: 'Al-Fath', englishTranslation: 'The Victory', arabicName: 'الفتح', numberOfAyahs: 29, revelationType: 'Medinan' },
  { number: 49, name: 'Al-Hujurat', englishName: 'Al-Hujurat', englishTranslation: 'The Rooms', arabicName: 'الحجرات', numberOfAyahs: 18, revelationType: 'Medinan' },
  { number: 50, name: 'Qaf', englishName: 'Qaf', englishTranslation: 'The Letter Qaf', arabicName: 'ق', numberOfAyahs: 45, revelationType: 'Meccan' },
  { number: 51, name: 'Adh-Dhariyat', englishName: 'Adh-Dhariyat', englishTranslation: 'The Winnowing Winds', arabicName: 'الذاريات', numberOfAyahs: 60, revelationType: 'Meccan' },
  { number: 52, name: 'At-Tur', englishName: 'At-Tur', englishTranslation: 'The Mount', arabicName: 'الطور', numberOfAyahs: 49, revelationType: 'Meccan' },
  { number: 53, name: 'An-Najm', englishName: 'An-Najm', englishTranslation: 'The Star', arabicName: 'النجم', numberOfAyahs: 62, revelationType: 'Meccan' },
  { number: 54, name: 'Al-Qamar', englishName: 'Al-Qamar', englishTranslation: 'The Moon', arabicName: 'القمر', numberOfAyahs: 55, revelationType: 'Meccan' },
  { number: 55, name: 'Ar-Rahman', englishName: 'Ar-Rahman', englishTranslation: 'The Beneficent', arabicName: 'الرحمن', numberOfAyahs: 78, revelationType: 'Medinan' },
  { number: 56, name: "Al-Waqi'a", englishName: "Al-Waqi'a", englishTranslation: 'The Inevitable', arabicName: 'الواقعة', numberOfAyahs: 96, revelationType: 'Meccan' },
  { number: 57, name: 'Al-Hadid', englishName: 'Al-Hadid', englishTranslation: 'The Iron', arabicName: 'الحديد', numberOfAyahs: 29, revelationType: 'Medinan' },
  { number: 58, name: 'Al-Mujadila', englishName: 'Al-Mujadila', englishTranslation: 'The Pleading Woman', arabicName: 'المجادلة', numberOfAyahs: 22, revelationType: 'Medinan' },
  { number: 59, name: 'Al-Hashr', englishName: 'Al-Hashr', englishTranslation: 'The Exile', arabicName: 'الحشر', numberOfAyahs: 24, revelationType: 'Medinan' },
  { number: 60, name: 'Al-Mumtahana', englishName: 'Al-Mumtahana', englishTranslation: 'She That Is To Be Examined', arabicName: 'الممتحنة', numberOfAyahs: 13, revelationType: 'Medinan' },
  { number: 61, name: 'As-Saf', englishName: 'As-Saf', englishTranslation: 'The Ranks', arabicName: 'الصف', numberOfAyahs: 14, revelationType: 'Medinan' },
  { number: 62, name: "Al-Jumu'a", englishName: "Al-Jumu'a", englishTranslation: 'Friday', arabicName: 'الجمعة', numberOfAyahs: 11, revelationType: 'Medinan' },
  { number: 63, name: 'Al-Munafiqun', englishName: 'Al-Munafiqun', englishTranslation: 'The Hypocrites', arabicName: 'المنافقون', numberOfAyahs: 11, revelationType: 'Medinan' },
  { number: 64, name: 'At-Taghabun', englishName: 'At-Taghabun', englishTranslation: 'The Mutual Disillusion', arabicName: 'التغابن', numberOfAyahs: 18, revelationType: 'Medinan' },
  { number: 65, name: 'At-Talaq', englishName: 'At-Talaq', englishTranslation: 'The Divorce', arabicName: 'الطلاق', numberOfAyahs: 12, revelationType: 'Medinan' },
  { number: 66, name: 'At-Tahrim', englishName: 'At-Tahrim', englishTranslation: 'The Prohibition', arabicName: 'التحريم', numberOfAyahs: 12, revelationType: 'Medinan' },
  { number: 67, name: 'Al-Mulk', englishName: 'Al-Mulk', englishTranslation: 'The Sovereignty', arabicName: 'الملك', numberOfAyahs: 30, revelationType: 'Meccan' },
  { number: 68, name: 'Al-Qalam', englishName: 'Al-Qalam', englishTranslation: 'The Pen', arabicName: 'القلم', numberOfAyahs: 52, revelationType: 'Meccan' },
  { number: 69, name: 'Al-Haqqa', englishName: 'Al-Haqqa', englishTranslation: 'The Reality', arabicName: 'الحاقة', numberOfAyahs: 52, revelationType: 'Meccan' },
  { number: 70, name: "Al-Ma'arij", englishName: "Al-Ma'arij", englishTranslation: 'The Ascending Stairways', arabicName: 'المعارج', numberOfAyahs: 44, revelationType: 'Meccan' },
  { number: 71, name: 'Nuh', englishName: 'Nuh', englishTranslation: 'Noah', arabicName: 'نوح', numberOfAyahs: 28, revelationType: 'Meccan' },
  { number: 72, name: 'Al-Jinn', englishName: 'Al-Jinn', englishTranslation: 'The Jinn', arabicName: 'الجن', numberOfAyahs: 28, revelationType: 'Meccan' },
  { number: 73, name: 'Al-Muzzammil', englishName: 'Al-Muzzammil', englishTranslation: 'The Enshrouded One', arabicName: 'المزمل', numberOfAyahs: 20, revelationType: 'Meccan' },
  { number: 74, name: 'Al-Muddaththir', englishName: 'Al-Muddaththir', englishTranslation: 'The Cloaked One', arabicName: 'المدثر', numberOfAyahs: 56, revelationType: 'Meccan' },
  { number: 75, name: 'Al-Qiyama', englishName: 'Al-Qiyama', englishTranslation: 'The Resurrection', arabicName: 'القيامة', numberOfAyahs: 40, revelationType: 'Meccan' },
  { number: 76, name: 'Al-Insan', englishName: 'Al-Insan', englishTranslation: 'The Man', arabicName: 'الإنسان', numberOfAyahs: 31, revelationType: 'Medinan' },
  { number: 77, name: 'Al-Mursalat', englishName: 'Al-Mursalat', englishTranslation: 'The Emissaries', arabicName: 'المرسلات', numberOfAyahs: 50, revelationType: 'Meccan' },
  { number: 78, name: 'An-Naba', englishName: 'An-Naba', englishTranslation: 'The Tidings', arabicName: 'النبأ', numberOfAyahs: 40, revelationType: 'Meccan' },
  { number: 79, name: "An-Nazi'at", englishName: "An-Nazi'at", englishTranslation: 'Those Who Drag Forth', arabicName: 'النازعات', numberOfAyahs: 46, revelationType: 'Meccan' },
  { number: 80, name: 'Abasa', englishName: 'Abasa', englishTranslation: 'He Frowned', arabicName: 'عبس', numberOfAyahs: 42, revelationType: 'Meccan' },
  { number: 81, name: 'At-Takwir', englishName: 'At-Takwir', englishTranslation: 'The Overthrowing', arabicName: 'التكوير', numberOfAyahs: 29, revelationType: 'Meccan' },
  { number: 82, name: 'Al-Infitar', englishName: 'Al-Infitar', englishTranslation: 'The Cleaving', arabicName: 'الانفطار', numberOfAyahs: 19, revelationType: 'Meccan' },
  { number: 83, name: 'Al-Mutaffifin', englishName: 'Al-Mutaffifin', englishTranslation: 'The Defrauding', arabicName: 'المطففين', numberOfAyahs: 36, revelationType: 'Meccan' },
  { number: 84, name: 'Al-Inshiqaq', englishName: 'Al-Inshiqaq', englishTranslation: 'The Sundering', arabicName: 'الانشقاق', numberOfAyahs: 25, revelationType: 'Meccan' },
  { number: 85, name: 'Al-Buruj', englishName: 'Al-Buruj', englishTranslation: 'The Mansions of the Stars', arabicName: 'البروج', numberOfAyahs: 22, revelationType: 'Meccan' },
  { number: 86, name: 'At-Tariq', englishName: 'At-Tariq', englishTranslation: 'The Nightcomer', arabicName: 'الطارق', numberOfAyahs: 17, revelationType: 'Meccan' },
  { number: 87, name: "Al-A'la", englishName: "Al-A'la", englishTranslation: 'The Most High', arabicName: 'الأعلى', numberOfAyahs: 19, revelationType: 'Meccan' },
  { number: 88, name: 'Al-Ghashiya', englishName: 'Al-Ghashiya', englishTranslation: 'The Overwhelming', arabicName: 'الغاشية', numberOfAyahs: 26, revelationType: 'Meccan' },
  { number: 89, name: 'Al-Fajr', englishName: 'Al-Fajr', englishTranslation: 'The Dawn', arabicName: 'الفجر', numberOfAyahs: 30, revelationType: 'Meccan' },
  { number: 90, name: 'Al-Balad', englishName: 'Al-Balad', englishTranslation: 'The City', arabicName: 'البلد', numberOfAyahs: 20, revelationType: 'Meccan' },
  { number: 91, name: 'Ash-Shams', englishName: 'Ash-Shams', englishTranslation: 'The Sun', arabicName: 'الشمس', numberOfAyahs: 15, revelationType: 'Meccan' },
  { number: 92, name: 'Al-Layl', englishName: 'Al-Layl', englishTranslation: 'The Night', arabicName: 'الليل', numberOfAyahs: 21, revelationType: 'Meccan' },
  { number: 93, name: 'Ad-Dhuha', englishName: 'Ad-Dhuha', englishTranslation: 'The Morning Hours', arabicName: 'الضحى', numberOfAyahs: 11, revelationType: 'Meccan' },
  { number: 94, name: 'Ash-Sharh', englishName: 'Ash-Sharh', englishTranslation: 'The Relief', arabicName: 'الشرح', numberOfAyahs: 8, revelationType: 'Meccan' },
  { number: 95, name: 'At-Tin', englishName: 'At-Tin', englishTranslation: 'The Fig', arabicName: 'التين', numberOfAyahs: 8, revelationType: 'Meccan' },
  { number: 96, name: 'Al-Alaq', englishName: 'Al-Alaq', englishTranslation: 'The Clot', arabicName: 'العلق', numberOfAyahs: 19, revelationType: 'Meccan' },
  { number: 97, name: 'Al-Qadr', englishName: 'Al-Qadr', englishTranslation: 'The Power', arabicName: 'القدر', numberOfAyahs: 5, revelationType: 'Meccan' },
  { number: 98, name: 'Al-Bayyina', englishName: 'Al-Bayyina', englishTranslation: 'The Clear Proof', arabicName: 'البينة', numberOfAyahs: 8, revelationType: 'Medinan' },
  { number: 99, name: 'Az-Zalzala', englishName: 'Az-Zalzala', englishTranslation: 'The Earthquake', arabicName: 'الزلزلة', numberOfAyahs: 8, revelationType: 'Medinan' },
  { number: 100, name: "Al-'Adiyat", englishName: "Al-'Adiyat", englishTranslation: 'The Courser', arabicName: 'العاديات', numberOfAyahs: 11, revelationType: 'Meccan' },
  { number: 101, name: "Al-Qari'a", englishName: "Al-Qari'a", englishTranslation: 'The Calamity', arabicName: 'القارعة', numberOfAyahs: 11, revelationType: 'Meccan' },
  { number: 102, name: 'At-Takathur', englishName: 'At-Takathur', englishTranslation: 'The Rivalry in World Increase', arabicName: 'التكاثر', numberOfAyahs: 8, revelationType: 'Meccan' },
  { number: 103, name: "Al-'Asr", englishName: "Al-'Asr", englishTranslation: 'The Declining Day', arabicName: 'العصر', numberOfAyahs: 3, revelationType: 'Meccan' },
  { number: 104, name: 'Al-Humaza', englishName: 'Al-Humaza', englishTranslation: 'The Traducer', arabicName: 'الهمزة', numberOfAyahs: 9, revelationType: 'Meccan' },
  { number: 105, name: 'Al-Fil', englishName: 'Al-Fil', englishTranslation: 'The Elephant', arabicName: 'الفيل', numberOfAyahs: 5, revelationType: 'Meccan' },
  { number: 106, name: 'Quraish', englishName: 'Quraish', englishTranslation: 'Quraysh', arabicName: 'قريش', numberOfAyahs: 4, revelationType: 'Meccan' },
  { number: 107, name: "Al-Ma'un", englishName: "Al-Ma'un", englishTranslation: 'The Small Kindnesses', arabicName: 'الماعون', numberOfAyahs: 7, revelationType: 'Meccan' },
  { number: 108, name: 'Al-Kawthar', englishName: 'Al-Kawthar', englishTranslation: 'The Abundance', arabicName: 'الكوثر', numberOfAyahs: 3, revelationType: 'Meccan' },
  { number: 109, name: 'Al-Kafirun', englishName: 'Al-Kafirun', englishTranslation: 'The Disbelievers', arabicName: 'الكافرون', numberOfAyahs: 6, revelationType: 'Meccan' },
  { number: 110, name: 'An-Nasr', englishName: 'An-Nasr', englishTranslation: 'The Divine Support', arabicName: 'النصر', numberOfAyahs: 3, revelationType: 'Medinan' },
  { number: 111, name: 'Al-Masad', englishName: 'Al-Masad', englishTranslation: 'The Palm Fiber', arabicName: 'المسد', numberOfAyahs: 5, revelationType: 'Meccan' },
  { number: 112, name: 'Al-Ikhlas', englishName: 'Al-Ikhlas', englishTranslation: 'The Sincerity', arabicName: 'الإخلاص', numberOfAyahs: 4, revelationType: 'Meccan' },
  { number: 113, name: 'Al-Falaq', englishName: 'Al-Falaq', englishTranslation: 'The Daybreak', arabicName: 'الفلق', numberOfAyahs: 5, revelationType: 'Meccan' },
  { number: 114, name: 'An-Nas', englishName: 'An-Nas', englishTranslation: 'Mankind', arabicName: 'الناس', numberOfAyahs: 6, revelationType: 'Meccan' },
];
