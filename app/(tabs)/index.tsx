/**
 * Home Screen (Social Feed)
 * =========================
 * Main feed with infinite scroll and mixed content (posts + janaza).
 * Includes a compact prayer time header.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InfiniteFeed } from '@/components/feed/InfiniteFeed';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/store/hooks';

interface PrayerTime {
  name: string;
  time: string;
  icon: keyof typeof Ionicons.glyphMap;
  isNext?: boolean;
  isCurrent?: boolean;
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  
  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontSemiBold = getFont(currentLanguage, 'semiBold');
  const fontBold = getFont(currentLanguage, 'bold');

  // State
  const [location, setLocation] = useState<string>(t('common.loading'));
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [currentPrayer, setCurrentPrayer] = useState<{ name: string; time: string } | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Get location and prayer times (Simplified Logic)
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocation(t('prayer.locationDenied'));
          setLoading(false);
          return;
        }

        const position = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = position.coords;
        setLocationCoords({ lat: latitude, lng: longitude });

        const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (address) {
          setLocation(address.city || address.district || 'Unknown');
        }

        // Fetch prayer times
        const today = new Date();
        const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
        
        const response = await fetch(
          `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${latitude}&longitude=${longitude}&method=2`
        );
        const data = await response.json();

        if (data.code === 200) {
          const timings = data.data.timings;
          
          // Determine next prayer (Simple logic for demo)
          setNextPrayer({ name: 'Asr', time: timings.Asr }); 
          setCurrentPrayer({ name: 'Dhuhr', time: timings.Dhuhr });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const FeedHeader = () => (
    <View style={[styles.headerContainer, { paddingTop: insets.top + 10, backgroundColor: colors.background }]}>
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.greeting, { fontFamily: fontRegular, color: colors.text.secondary }]}>
            {t('home.greeting')},
          </Text>
          <Text style={[styles.appName, { fontFamily: fontBold, color: colors.primary }]}>
            {t('common.appName')}
          </Text>
        </View>

        <View style={styles.topRightActions}>
             <View style={[styles.locationBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                <Ionicons name="location" size={14} color={colors.primary} />
                <Text style={[styles.locationText, { fontFamily: fontMedium, color: colors.text.primary }]}>
                  {location}
                </Text>
             </View>
             <Pressable 
                style={styles.bellButton}
                onPress={() => router.push('/notifications')}
             >
                <Ionicons name="notifications-outline" size={24} color={colors.text.primary} />
             </Pressable>
        </View>
      </View>

      {/* Compact Prayer Status */}
      <View style={[styles.prayerStatusCard, { backgroundColor: colors.surface }]}>
        <View style={styles.prayerInfo}>
            <Text style={[styles.nextLabel, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                {t('prayer.nextPrayer')}
            </Text>
            <View style={styles.prayerNameRow}>
                <Ionicons name="time-outline" size={18} color={colors.secondary} />
                <Text style={[styles.nextPrayerName, { fontFamily: fontBold, color: colors.text.primary }]}>
                    {nextPrayer ? nextPrayer.name : '...'}
                </Text>
                <Text style={[styles.nextPrayerTime, { fontFamily: fontMedium, color: colors.text.primary }]}>
                    {nextPrayer ? nextPrayer.time : '--:--'}
                </Text>
            </View>
        </View>
        <Pressable 
            onPress={() => router.push('/prayer')}
            style={[styles.prayerButton, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}
        >
            <Text style={[styles.prayerButtonText, { fontFamily: fontMedium, color: colors.primary }]}>
                {t('feed.fullSchedule')}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <InfiniteFeed ListHeaderComponent={<FeedHeader />} userLocation={locationCoords} />
      
      {/* FAB */}
      <Pressable 
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/feed/create')}
      >
        <Ionicons name="add" size={30} color="#FFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    marginBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 14,
  },
  appName: {
    fontSize: 24,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  locationText: {
    fontSize: 12,
  },
  topRightActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
  },
  bellButton: {
      padding: 4,
  },
  prayerStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  prayerInfo: {
    gap: 4,
  },
  nextLabel: {
    fontSize: 12,
  },
  prayerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextPrayerName: {
    fontSize: 18,
  },
  nextPrayerTime: {
    fontSize: 18,
  },
  prayerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  prayerButtonText: {
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 150,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 100,
  },
});
