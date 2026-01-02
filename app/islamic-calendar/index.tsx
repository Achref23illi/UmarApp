/**
 * Islamic Calendar Screen
 * ========================
 * Shows Islamic (Hijri) calendar with important dates.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
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

const ISLAMIC_MONTHS = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
  'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
];

const IMPORTANT_DATES = [
  { month: 1, day: 1, name: 'Islamic New Year', description: 'Beginning of Hijri calendar' },
  { month: 1, day: 10, name: 'Day of Ashura', description: 'Fasting recommended' },
  { month: 3, day: 12, name: 'Mawlid al-Nabi', description: 'Birth of Prophet Muhammad ﷺ' },
  { month: 7, day: 27, name: 'Isra and Mi\'raj', description: 'Night Journey' },
  { month: 8, day: 15, name: 'Shab-e-Barat', description: 'Night of Forgiveness' },
  { month: 9, day: 1, name: 'Ramadan Begins', description: 'Start of fasting month' },
  { month: 9, day: 27, name: 'Laylat al-Qadr', description: 'Night of Power' },
  { month: 10, day: 1, name: 'Eid al-Fitr', description: 'Festival of Breaking Fast' },
  { month: 12, day: 10, name: 'Eid al-Adha', description: 'Festival of Sacrifice' },
];

export default function IslamicCalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  
  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontSemiBold = getFont(currentLanguage, 'semiBold');
  const fontBold = getFont(currentLanguage, 'bold');

  const [hijriDate, setHijriDate] = useState<{ day: string; month: string; year: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHijriDate();
  }, []);

  const fetchHijriDate = async () => {
    try {
      const today = new Date();
      const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
      const response = await fetch(`https://api.aladhan.com/v1/gpiToH/${dateStr}`);
      const data = await response.json();
      
      if (data.code === 200) {
        const hijri = data.data.hijri;
        setHijriDate({
          day: hijri.day,
          month: hijri.month.en,
          year: hijri.year,
        });
      }
    } catch (error) {
      console.error('Error fetching Hijri date:', error);
    } finally {
      setLoading(false);
    }
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
        <Text style={[styles.headerTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
          Islamic Calendar
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Current Hijri Date */}
        <Animated.View entering={FadeInUp.delay(100).springify()}>
          <LinearGradient
            colors={isDark ? ['#0EA5E9', '#0284C7'] : ['#38BDF8', '#0EA5E9']}
            style={styles.dateCard}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="large" />
            ) : hijriDate && (
              <>
                <Text style={[styles.todayLabel, { fontFamily: fontMedium }]}>Today</Text>
                <Text style={[styles.hijriDay, { fontFamily: fontBold }]}>{hijriDate.day}</Text>
                <Text style={[styles.hijriMonth, { fontFamily: fontSemiBold }]}>{hijriDate.month}</Text>
                <Text style={[styles.hijriYear, { fontFamily: fontMedium }]}>{hijriDate.year} AH</Text>
              </>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Islamic Months */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
            Islamic Months
          </Text>
          <View style={styles.monthsGrid}>
            {ISLAMIC_MONTHS.map((month, index) => (
              <View 
                key={month} 
                style={[
                  styles.monthChip, 
                  { 
                    backgroundColor: hijriDate?.month === month ? colors.primary : colors.surface,
                  }
                ]}
              >
                <Text style={[
                  styles.monthNumber, 
                  { 
                    fontFamily: fontBold,
                    color: hijriDate?.month === month ? '#FFF' : colors.text.secondary 
                  }
                ]}>
                  {index + 1}
                </Text>
                <Text style={[
                  styles.monthName, 
                  { 
                    fontFamily: fontMedium,
                    color: hijriDate?.month === month ? '#FFF' : colors.text.primary 
                  }
                ]}>
                  {month}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Important Dates */}
        <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
            Important Dates
          </Text>
          {IMPORTANT_DATES.map((date, index) => (
            <View key={date.name} style={[styles.eventCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.eventDate, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]}>
                <Text style={[styles.eventDay, { fontFamily: fontBold, color: colors.text.primary }]}>
                  {date.day}
                </Text>
                <Text style={[styles.eventMonth, { fontFamily: fontMedium, color: colors.text.secondary }]}>
                  {ISLAMIC_MONTHS[date.month - 1].split(' ')[0]}
                </Text>
              </View>
              <View style={styles.eventContent}>
                <Text style={[styles.eventName, { fontFamily: fontSemiBold, color: colors.text.primary }]}>
                  {date.name}
                </Text>
                <Text style={[styles.eventDesc, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                  {date.description}
                </Text>
              </View>
            </View>
          ))}
        </Animated.View>
      </ScrollView>
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
  headerTitle: {
    fontSize: 18,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  dateCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  todayLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  hijriDay: {
    color: '#FFF',
    fontSize: 64,
  },
  hijriMonth: {
    color: '#FFF',
    fontSize: 24,
    marginTop: -8,
  },
  hijriYear: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  monthChip: {
    width: '31%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  monthNumber: {
    fontSize: 12,
    marginBottom: 2,
  },
  monthName: {
    fontSize: 11,
    textAlign: 'center',
  },
  eventCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 16,
    alignItems: 'center',
  },
  eventDate: {
    width: 55,
    height: 55,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDay: {
    fontSize: 20,
  },
  eventMonth: {
    fontSize: 10,
  },
  eventContent: {
    flex: 1,
  },
  eventName: {
    fontSize: 15,
    marginBottom: 2,
  },
  eventDesc: {
    fontSize: 12,
  },
});
