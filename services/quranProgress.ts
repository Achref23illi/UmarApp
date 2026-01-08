/**
 * Quran Reading Progress Service
 * ================================
 * Tracks user's reading progress using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@quran_progress';

export interface ReadingProgress {
  surahNumber: number;
  surahName: string;
  surahEnglishName: string;
  ayahNumber: number;
  juz: number;
  page: number;
  totalAyahsInSurah: number;
  lastReadAt: string;
}

// Get current reading progress
export async function getReadingProgress(): Promise<ReadingProgress | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    // Return default starting position
    return {
      surahNumber: 1,
      surahName: 'الفاتحة',
      surahEnglishName: 'Al-Fatiha',
      ayahNumber: 1,
      juz: 1,
      page: 1,
      totalAyahsInSurah: 7,
      lastReadAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting reading progress:', error);
    return null;
  }
}

// Save reading progress
export async function saveReadingProgress(progress: ReadingProgress): Promise<void> {
  try {
    const data = {
      ...progress,
      lastReadAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving reading progress:', error);
  }
}

// Calculate overall Quran progress percentage
export function calculateOverallProgress(surahNumber: number, ayahNumber: number): number {
  // Total ayahs in Quran is 6236
  const TOTAL_AYAHS = 6236;
  
  // Cumulative ayahs before each surah
  const CUMULATIVE_AYAHS: Record<number, number> = {
    1: 0, 2: 7, 3: 293, 4: 493, 5: 669, 6: 789, 7: 954, 8: 1160, 9: 1235, 10: 1364,
    11: 1473, 12: 1596, 13: 1707, 14: 1750, 15: 1802, 16: 1901, 17: 2029, 18: 2140,
    19: 2250, 20: 2348, 21: 2460, 22: 2572, 23: 2691, 24: 2809, 25: 2873, 26: 2950,
    27: 3177, 28: 3270, 29: 3358, 30: 3427, 31: 3487, 32: 3521, 33: 3551, 34: 3624,
    35: 3678, 36: 3723, 37: 3805, 38: 3987, 39: 4073, 40: 4148, 41: 4233, 42: 4287,
    43: 4340, 44: 4429, 45: 4466, 46: 4503, 47: 4538, 48: 4576, 49: 4605, 50: 4618,
    51: 4663, 52: 4723, 53: 4772, 54: 4834, 55: 4889, 56: 4967, 57: 5063, 58: 5092,
    59: 5114, 60: 5138, 61: 5151, 62: 5163, 63: 5174, 64: 5185, 65: 5203, 66: 5215,
    67: 5227, 68: 5257, 69: 5309, 70: 5361, 71: 5405, 72: 5433, 73: 5461, 74: 5481,
    75: 5537, 76: 5577, 77: 5608, 78: 5658, 79: 5698, 80: 5744, 81: 5786, 82: 5815,
    83: 5834, 84: 5870, 85: 5895, 86: 5917, 87: 5934, 88: 5953, 89: 5979, 90: 6009,
    91: 6029, 92: 6044, 93: 6065, 94: 6076, 95: 6084, 96: 6092, 97: 6111, 98: 6116,
    99: 6124, 100: 6132, 101: 6143, 102: 6154, 103: 6162, 104: 6165, 105: 6174,
    106: 6179, 107: 6183, 108: 6190, 109: 6193, 110: 6199, 111: 6202, 112: 6207,
    113: 6211, 114: 6216,
  };
  
  const ayahsCompleted = (CUMULATIVE_AYAHS[surahNumber] || 0) + ayahNumber;
  return Math.round((ayahsCompleted / TOTAL_AYAHS) * 100);
}

// Calculate Juz progress
export function calculateJuzProgress(juz: number, surahNumber: number, ayahNumber: number): number {
  // Approximate - each Juz has roughly 200-220 ayahs
  const JUZ_APPROX_AYAHS = 208;
  const ayahsInJuz = (surahNumber * 10 + ayahNumber) % JUZ_APPROX_AYAHS; // Simplified
  return Math.min(Math.round((ayahsInJuz / JUZ_APPROX_AYAHS) * 100), 99);
}

// Get reading streak
export async function getReadingStreak(): Promise<number> {
  try {
    const streakData = await AsyncStorage.getItem('@quran_streak');
    if (streakData) {
      const { streak, lastDate } = JSON.parse(streakData);
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      
      if (lastDate === today) {
        return streak;
      } else if (lastDate === yesterday) {
        return streak; // Still valid, just not incremented yet today
      }
      return 0; // Streak broken
    }
    return 0;
  } catch (error) {
    return 0;
  }
}

// Update reading streak
export async function updateReadingStreak(): Promise<number> {
  try {
    const today = new Date().toDateString();
    const streakData = await AsyncStorage.getItem('@quran_streak');
    
    if (streakData) {
      const { streak, lastDate } = JSON.parse(streakData);
      
      if (lastDate === today) {
        return streak; // Already counted today
      }
      
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const newStreak = lastDate === yesterday ? streak + 1 : 1;
      
      await AsyncStorage.setItem('@quran_streak', JSON.stringify({
        streak: newStreak,
        lastDate: today
      }));
      return newStreak;
    }
    
    // First time
    await AsyncStorage.setItem('@quran_streak', JSON.stringify({
      streak: 1,
      lastDate: today
    }));
    return 1;
  } catch (error) {
    return 0;
  }
}

const DAILY_LOG_KEY = '@quran_daily_log';

export interface DailyLog {
  date: string;
  ayahsRead: number;
  durationSeconds: number;
  lastUpdated: string;
}

// Get daily log for specific date (YYYY-MM-DD)
export async function getDailyLog(date: string): Promise<DailyLog> {
  try {
    const allLogsStr = await AsyncStorage.getItem(DAILY_LOG_KEY);
    const allLogs: Record<string, DailyLog> = allLogsStr ? JSON.parse(allLogsStr) : {};
    
    return allLogs[date] || {
      date,
      ayahsRead: 0,
      durationSeconds: 0,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting daily log:', error);
    return { date, ayahsRead: 0, durationSeconds: 0, lastUpdated: new Date().toISOString() };
  }
}

// Log reading activity
export async function logReadingActivity(ayahsCount: number, seconds: number): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const allLogsStr = await AsyncStorage.getItem(DAILY_LOG_KEY);
    const allLogs: Record<string, DailyLog> = allLogsStr ? JSON.parse(allLogsStr) : {};
    
    const currentLog = allLogs[today] || {
      date: today,
      ayahsRead: 0,
      durationSeconds: 0,
      lastUpdated: new Date().toISOString()
    };

    allLogs[today] = {
      ...currentLog,
      ayahsRead: currentLog.ayahsRead + ayahsCount,
      durationSeconds: currentLog.durationSeconds + seconds,
      lastUpdated: new Date().toISOString()
    };

    await AsyncStorage.setItem(DAILY_LOG_KEY, JSON.stringify(allLogs));
  } catch (error) {
    console.error('Error logging reading activity:', error);
  }
}

// Get weekly stats
export async function getWeeklyStats(): Promise<DailyLog[]> {
  try {
    const allLogsStr = await AsyncStorage.getItem(DAILY_LOG_KEY);
    const allLogs: Record<string, DailyLog> = allLogsStr ? JSON.parse(allLogsStr) : {};
    
    const stats: DailyLog[] = [];
    const today = new Date();
    
    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      stats.push(allLogs[dateStr] || {
        date: dateStr,
        ayahsRead: 0,
        durationSeconds: 0,
        lastUpdated: d.toISOString()
      });
    }
    
    return stats;
  } catch (error) {
    return [];
  }
}
