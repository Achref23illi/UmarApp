import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, View, StyleProp, ViewStyle } from 'react-native';

import { Colors } from '@/config/colors';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/store/hooks';

type Props = {
  coords?: { lat: number; lng: number };
  style?: StyleProp<ViewStyle>;
};

export function PrayerBanner({ coords, style }: Props) {
  const { colors } = useTheme();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontSemiBold = getFont(currentLanguage, 'semiBold');

  const { prayerTimes, nextPrayer, hijriDate, gregorianDate, qiyamTimeRemaining, loading } =
    usePrayerTimes({
      coords,
      language: currentLanguage,
      method: 2, // ISNA (can be swapped if needed)
    });

  const PRIMARY = Colors.palette.purple.primary;
  const GOLD = Colors.palette.purple.primary; // full primary tint

  const renderPrayers = () => {
    if (loading && prayerTimes.length === 0) {
      return (
        <View style={styles.prayerItem}>
          <Text style={[styles.prayerName, { fontFamily: fontSemiBold }]}>...</Text>
          <Text style={[styles.prayerTime, { fontFamily: fontMedium }]}>--:--</Text>
        </View>
      );
    }

    return prayerTimes.map((p) => (
      <View key={p.name} style={[styles.prayerItem, p.isNext && styles.prayerItemActive]}>
        <Text
          style={[
            styles.prayerName,
            { fontFamily: fontSemiBold, color: p.isNext ? '#fff' : 'rgba(255,255,255,0.9)' },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
        >
          {p.name}
        </Text>
        <Text
          style={[
            styles.prayerTime,
            { fontFamily: fontMedium, color: p.isNext ? '#fff' : 'rgba(255,255,255,0.9)' },
          ]}
        >
          {p.time || '--:--'}
        </Text>
      </View>
    ));
  };

  return (
    <LinearGradient
      colors={[PRIMARY, '#8B5CF6', GOLD]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.prayerBanner, style, { backgroundColor: colors.primary }]}
    >
      <View style={styles.topRow}>
        <View style={styles.bannerSection}>
          <View style={styles.bannerRow}>
            <Ionicons name="moon-outline" size={18} color="#fff" />
            <Text style={[styles.bannerText, { fontFamily: fontSemiBold }]}>Qiyam I lail</Text>
          </View>
          <Text style={[styles.bannerTime, { fontFamily: fontMedium }]}>
            {qiyamTimeRemaining || '--'}
          </Text>
        </View>

        <View style={styles.bannerDivider} />

        <View style={[styles.bannerSection, { flex: 1.2 }]}>
          <Text style={[styles.bannerDate, { fontFamily: fontMedium }]} numberOfLines={1}>
            {gregorianDate || '...'}
          </Text>
          {hijriDate && (
            <Text style={[styles.bannerHijri, { fontFamily: fontRegular }]} numberOfLines={1}>
              {hijriDate.day} {hijriDate.month} {hijriDate.year}
            </Text>
          )}
        </View>

        <View style={styles.bannerDivider} />

        <View style={styles.bannerSection}>
          <View style={styles.bannerRow}>
            <Ionicons name="sunny-outline" size={18} color="#fff" />
            <Text style={[styles.bannerText, { fontFamily: fontSemiBold }]}>
              {nextPrayer ? nextPrayer.name : '---'}
            </Text>
          </View>
          <View style={styles.bannerRow}>
            <Text style={[styles.bannerTime, { fontFamily: fontMedium }]}>
              {nextPrayer ? nextPrayer.time : '--:--'}
            </Text>
            <Text style={[styles.bannerRemaining, { fontFamily: fontRegular }]}>
              {nextPrayer ? `Dans ${nextPrayer.timeRemaining}` : ''}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.prayerRow}>{renderPrayers()}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  prayerBanner: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerSection: {
    flex: 1,
    alignItems: 'center',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  bannerText: {
    color: '#fff',
    fontSize: 13,
  },
  bannerTime: {
    color: '#fff',
    fontSize: 14,
  },
  bannerDate: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 2,
  },
  bannerHijri: {
    color: '#fff',
    fontSize: 11,
    opacity: 0.9,
  },
  bannerRemaining: {
    color: '#fff',
    fontSize: 11,
    opacity: 0.9,
    marginLeft: 6,
  },
  bannerDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 8,
  },
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    columnGap: 4,
    width: '100%',
  },
  prayerItem: {
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    minWidth: 0,
    flex: 1,
    alignItems: 'center',
  },
  prayerItemActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  prayerName: {
    fontSize: 12,
  },
  prayerTime: {
    fontSize: 13,
    marginTop: 2,
  },
});

export default PrayerBanner;
