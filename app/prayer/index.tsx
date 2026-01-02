/**
 * Prayer Times Screen
 * ====================
 * Shows prayer times for the current week using AlAdhan API.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/store/hooks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DayTimings {
  date: {
    readable: string;
    hijri: {
      day: string;
      month: {
        en: string;
      };
      year: string;
    };
    gregorian: {
      day: string;
      month: {
        number: number;
        en: string;
      };
      year: string;
    };
  };
  timings: {
    Fajr: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
    [key: string]: string;
  };
}

export default function PrayerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  
  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontSemiBold = getFont(currentLanguage, 'semiBold');
  const fontBold = getFont(currentLanguage, 'bold');

  const [weeklyTimings, setWeeklyTimings] = useState<DayTimings[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState(t('prayer.loadingLocation'));
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    fetchPrayerTimes();
  }, []);

  const fetchPrayerTimes = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationName(t('prayer.locationDenied'));
        setLoading(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = position.coords;
      setUserCoords({ lat: latitude, lng: longitude });

      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (address) {
        setLocationName(address.city || address.district || 'Unknown Location');
      }

      // Fetch for the current month to get the week effectively
      const today = new Date();
      // AlAdhan API uses 1-based months
      const month = today.getMonth() + 1; 
      const year = today.getFullYear();
      
      const response = await fetch(
        `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${latitude}&longitude=${longitude}&method=2`
      );
      const data = await response.json();

      if (data.code === 200) {
        // API returns entire month. We need to filter for this week (e.g., today + next 6 days)
        const allDays = data.data;
        const currentDay = today.getDate();
        
        // Filter: Keep days from today onwards (simple approach for current month)
        // Note: This logic assumes current month view. Cross-month weeks would need more logic.
        // For simplicity in this step, we take the next 7 available days from the response.
        const upcomingDays = allDays.filter((d: any) => {
            const dayNum = parseInt(d.date.gregorian.day, 10);
            return dayNum >= currentDay;
        }).slice(0, 7);
        
        setWeeklyTimings(upcomingDays);
      }
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      setLocationName(t('prayer.errorFetchingData'));
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (gregorian: { day: string; month: { number: number }; year: string }) => {
    // Construct date from gregorian components
    const year = parseInt(gregorian.year, 10);
    const month = gregorian.month.number - 1; // JS months are 0-indexed
    const dayNum = parseInt(gregorian.day, 10);
    
    const date = new Date(year, month, dayNum);
    const today = new Date();
    
    // Check if Today
    if (
        date.getDate() === today.getDate() && 
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    ) {
        return t('prayer.today');
    }
    
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const prayerIcons: Record<string, any> = {
    Fajr: 'moon-outline',
    Dhuhr: 'sunny-outline',
    Asr: 'partly-sunny-outline',
    Maghrib: 'cloudy-night-outline',
    Isha: 'moon-outline'
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          onPress={() => router.back()} 
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
            {t('prayer.prayerTimes')}
            </Text>
            <View style={styles.locationRow}>
                <Ionicons name="location-sharp" size={12} color={colors.primary} />
                <Text style={[styles.locationText, { fontFamily: fontMedium, color: colors.text.secondary }]}>
                    {locationName}
                </Text>
            </View>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Days Selector (Horizontal) */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.daysSelector}
          >
            {weeklyTimings.map((day, index) => {
                const isSelected = selectedDayIndex === index;
                const dayName = getDayName(day.date.gregorian as any);
                const dayNum = day.date.gregorian.day; // "17"

                return (
                    <Pressable
                        key={index}
                        onPress={() => setSelectedDayIndex(index)}
                        style={[
                            styles.dayCard, 
                            { 
                                backgroundColor: isSelected ? colors.primary : colors.surface,
                                borderColor: isSelected ? colors.primary : isDark ? '#374151' : '#E5E7EB'
                            }
                        ]}
                    >
                        <Text style={[
                            styles.dayName, 
                            { 
                                fontFamily: fontMedium,
                                color: isSelected ? '#FFF' : colors.text.secondary 
                            }
                        ]}>
                            {dayName}
                        </Text>
                        <Text style={[
                            styles.dayNum, 
                            { 
                                fontFamily: fontBold,
                                color: isSelected ? '#FFF' : colors.text.primary 
                            }
                        ]}>
                            {dayNum}
                        </Text>
                    </Pressable>
                );
            })}
          </ScrollView>

          {/* Selected Day Detail */}
          {weeklyTimings[selectedDayIndex] && (
            <Animated.View 
                key={selectedDayIndex} // Triggers animation on change
                entering={FadeInUp.springify()} 
                style={styles.dayDetailContainer}
            >
                <LinearGradient
                  colors={isDark ? ['#4A0B78', '#2D0A4E'] : ['#8B3DB8', '#670FA4']}
                  style={styles.dateCard}
                >
                    <Text style={[styles.hijriDate, { fontFamily: fontSemiBold }]}>
                        {weeklyTimings[selectedDayIndex].date.hijri.day} {weeklyTimings[selectedDayIndex].date.hijri.month.en} {weeklyTimings[selectedDayIndex].date.hijri.year}
                    </Text>
                    <Text style={[styles.gregorianDate, { fontFamily: fontRegular }]}>
                        {weeklyTimings[selectedDayIndex].date.readable}
                    </Text>
                </LinearGradient>

                <View style={styles.timesList}>
                    {prayers.map((prayer, i) => (
                        <View 
                            key={prayer} 
                            style={[
                                styles.timeRow, 
                                { 
                                    backgroundColor: colors.surface,
                                    borderBottomWidth: i === prayers.length - 1 ? 0 : 1,
                                    borderBottomColor: isDark ? '#374151' : '#F3F4F6'
                                }
                            ]}
                        >
                            <View style={styles.timeInfo}>
                                <Ionicons 
                                    name={prayerIcons[prayer]} 
                                    size={22} 
                                    color={colors.primary} 
                                />
                                <Text style={[styles.timeName, { fontFamily: fontMedium, color: colors.text.primary }]}>
                                    {prayer}
                                </Text>
                            </View>
                            <View style={[styles.timeBadge, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
                                <Text style={[styles.timeValue, { fontFamily: fontBold, color: colors.text.primary }]}>
                                    {(weeklyTimings[selectedDayIndex].timings as any)[prayer].split(' ')[0]}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            </Animated.View>
          )}

        </ScrollView>
      )}
    </View>
  );
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
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
      alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
  },
  locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
  },
  locationText: {
      fontSize: 12,
  },
  centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
  },
  scrollContent: {
      paddingBottom: 40,
  },
  daysSelector: {
      paddingHorizontal: 20,
      paddingVertical: 20,
      gap: 12,
  },
  dayCard: {
      width: 60,
      height: 80,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      gap: 4,
  },
  dayName: {
      fontSize: 12,
  },
  dayNum: {
      fontSize: 18,
  },
  dayDetailContainer: {
      paddingHorizontal: 20,
  },
  dateCard: {
      padding: 24,
      borderRadius: 24,
      marginBottom: 24,
      alignItems: 'center',
  },
  hijriDate: {
      color: '#FFF',
      fontSize: 20,
      marginBottom: 4,
  },
  gregorianDate: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  timesList: {
      borderRadius: 24,
      overflow: 'hidden',
  },
  timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
  },
  timeInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
  },
  timeName: {
      fontSize: 16,
  },
  timeBadge: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 12,
  },
  timeValue: {
      fontSize: 16,
  },
  qiblaSection: {
      paddingHorizontal: 20,
      marginTop: 10,
  },
});
