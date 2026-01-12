/**
 * Prayer Times Tab
 * =================
 * Shows prayer times with date navigation and Islamic calendar
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/store/hooks';

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

export function PrayerTimesTab() {
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
  const [locationName, setLocationName] = useState('');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchPrayerTimes();
  }, [currentMonth]);

  const fetchPrayerTimes = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationName(t('prayer.locationDenied') || 'Location denied');
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

      const month = currentMonth.getMonth() + 1;
      const year = currentMonth.getFullYear();
      
      const response = await fetch(
        `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${latitude}&longitude=${longitude}&method=2`
      );
      const data = await response.json();

      if (data.code === 200) {
        const allDays = data.data;
        const today = new Date();
        const currentDay = today.getDate();
        
        // Get 7 days starting from today
        const upcomingDays = allDays.filter((d: any) => {
          const dayNum = parseInt(d.date.gregorian.day, 10);
          const monthNum = parseInt(d.date.gregorian.month.number, 10);
          const yearNum = parseInt(d.date.gregorian.year, 10);
          
          const dayDate = new Date(yearNum, monthNum - 1, dayNum);
          const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          
          return dayDate >= todayDate;
        }).slice(0, 7);
        
        setWeeklyTimings(upcomingDays);
      }
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      setLocationName(t('prayer.errorFetchingData') || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (gregorian: { day: string; month: { number: number }; year: string }) => {
    const year = parseInt(gregorian.year, 10);
    const month = gregorian.month.number - 1;
    const dayNum = parseInt(gregorian.day, 10);
    
    const date = new Date(year, month, dayNum);
    const today = new Date();
    
    if (
      date.getDate() === today.getDate() && 
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return t('prayer.today') || 'Today';
    }
    
    return date.toLocaleDateString(currentLanguage === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short' });
  };

  const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const prayerIcons: Record<string, any> = {
    Fajr: 'moon-outline',
    Dhuhr: 'sunny-outline',
    Asr: 'partly-sunny-outline',
    Maghrib: 'cloudy-night-outline',
    Isha: 'moon-outline'
  };

  const formatTime = (timeStr: string) => {
    return timeStr.split(' ')[0];
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
  };

  const monthName = currentMonth.toLocaleDateString(currentLanguage === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Location */}
      <View style={[styles.header, { paddingTop: 8 }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
            {t('prayer.prayerTimes') || 'Prayer Times'}
          </Text>
          {locationName && (
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color={colors.primary} />
              <Text style={[styles.locationText, { fontFamily: fontMedium, color: colors.text.secondary }]}>
                {locationName}
              </Text>
            </View>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Month Navigation */}
          <View style={styles.monthSelector}>
            <Pressable 
              onPress={() => navigateMonth('prev')}
              style={[styles.monthButton, { backgroundColor: colors.surface }]}
            >
              <Ionicons name="chevron-back" size={20} color={colors.text.primary} />
            </Pressable>
            <Pressable 
              style={[styles.monthButton, { backgroundColor: colors.primary, flex: 1 }]}
            >
              <Text style={[styles.monthText, { fontFamily: fontSemiBold, color: '#FFF' }]}>
                {monthName}
              </Text>
            </Pressable>
            <Pressable 
              onPress={() => navigateMonth('next')}
              style={[styles.monthButton, { backgroundColor: colors.surface }]}
            >
              <Ionicons name="chevron-forward" size={20} color={colors.text.primary} />
            </Pressable>
          </View>

          {/* Days Selector */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.daysSelector}
          >
            {weeklyTimings.map((day, index) => {
              const isSelected = selectedDayIndex === index;
              const dayName = getDayName(day.date.gregorian as any);
              const dayNum = day.date.gregorian.day;

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
              key={selectedDayIndex}
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
                {prayers.map((prayer, i) => {
                  const time = formatTime(weeklyTimings[selectedDayIndex].timings[prayer]);
                  const isNext = i === 1; // Highlight Dhuhr as example
                  
                  return (
                    <View 
                      key={prayer} 
                      style={[
                        styles.timeRow, 
                        { 
                          backgroundColor: isNext ? colors.primary : colors.surface,
                          borderBottomWidth: i === prayers.length - 1 ? 0 : 1,
                          borderBottomColor: isDark ? '#374151' : '#F3F4F6'
                        }
                      ]}
                    >
                      <View style={styles.timeInfo}>
                        <View style={[styles.radioButton, isNext && styles.radioButtonActive]}>
                          {isNext && <View style={styles.radioButtonInner} />}
                        </View>
                        <Ionicons 
                          name={prayerIcons[prayer]} 
                          size={22} 
                          color={isNext ? '#FFF' : colors.primary} 
                        />
                        <Text style={[styles.timeName, { 
                          fontFamily: fontMedium, 
                          color: isNext ? '#FFF' : colors.text.primary 
                        }]}>
                          {prayer}
                        </Text>
                      </View>
                      <View style={styles.timeRight}>
                        <Text style={[styles.timeValue, { 
                          fontFamily: fontBold, 
                          color: isNext ? '#FFF' : colors.text.primary 
                        }]}>
                          {time}
                        </Text>
                        <Ionicons 
                          name={isNext ? 'volume-high' : 'volume-mute'} 
                          size={18} 
                          color={isNext ? '#FFF' : colors.text.disabled} 
                        />
                      </View>
                    </View>
                  );
                })}
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
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    marginBottom: 4,
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
  monthSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  monthButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  daysSelector: {
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonActive: {
    borderColor: '#FFF',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFF',
  },
  timeName: {
    fontSize: 16,
  },
  timeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeValue: {
    fontSize: 16,
  },
});
