/**
 * Home Screen (Social Feed)
 * =========================
 * Main feed with infinite scroll and mixed content (posts + janaza).
 * Includes a modern header with search and prayer time banner.
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { InfiniteFeed } from '@/components/feed/InfiniteFeed';
import { PrayerBanner } from '@/components/prayer/PrayerBanner';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { socialService } from '@/services/socialService';
import { getReadingProgress, ReadingProgress } from '@/services/quranProgress';
import { useAppSelector } from '@/store/hooks';

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

  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [notificationCount, setNotificationCount] = useState(0);
  const [readingProgress, setReadingProgress] = useState<ReadingProgress | null>(null);
  const userData = useAppSelector((state) => state.user);

  // Get location (for feed and prayer banner)
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return;
        }

        const position = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = position.coords;
        setLocationCoords({ lat: latitude, lng: longitude });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    })();
  }, []);

  // Fetch reading progress when screen is focused
  useFocusEffect(
    useCallback(() => {
      const fetchProgress = async () => {
        const progress = await getReadingProgress();
        setReadingProgress(progress);
      };
      fetchProgress();
    }, [])
  );

  // Fetch unread notifications count when screen is focused
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchUnreadCount = async () => {
        try {
          if (!userData.isAuthenticated) {
            if (isActive) setNotificationCount(0);
            return;
          }

          const count = await socialService.getUnreadNotificationsCount();
          if (isActive) setNotificationCount(count);
        } catch (error) {
          console.error('Failed to fetch unread notifications count:', error);
          if (isActive) setNotificationCount(0);
        }
      };

      fetchUnreadCount();

      return () => {
        isActive = false;
      };
    }, [userData.isAuthenticated])
  );

  const handleContinueReading = () => {
    if (readingProgress?.surahNumber) {
      router.push({
        pathname: '/quran/mushaf',
        params: { 
          chapterId: readingProgress.surahNumber.toString(),
          chapterName: readingProgress.surahName
        }
      });
    } else {
      router.push('/quran');
    }
  };

  const FeedHeader = () => (
    <View style={[styles.headerContainer, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Top Header: Profile, Search, Notifications */}
      <View style={styles.topHeader}>
        <Pressable onPress={() => router.push('/profile')} style={styles.profileButton}>
          {userData.avatar_url ? (
            <Image source={{ uri: userData.avatar_url }} style={styles.profileAvatar} contentFit="cover" />
          ) : (
            <View style={[styles.profileAvatarPlaceholder, { backgroundColor: colors.surface }]}>
              <Ionicons name="person" size={24} color={colors.text.secondary} />
            </View>
          )}
        </Pressable>

        <Pressable 
          onPress={() => router.push('/search')}
          style={[styles.searchBar, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
        >
          <Ionicons name="search-outline" size={18} color={colors.text.secondary} style={styles.searchIcon} />
          <Text style={[styles.searchPlaceholder, { fontFamily: fontRegular, color: colors.text.secondary }]}>
            {t('common.search')}
          </Text>
          <Ionicons name="mic-outline" size={18} color={colors.text.secondary} style={styles.micIcon} />
        </Pressable>

        <Pressable 
          onPress={() => router.push('/notifications')}
          style={styles.notificationButton}
        >
          <Ionicons name="mail-outline" size={24} color={colors.text.primary} />
          {notificationCount > 0 && (
            <View style={[styles.badge, { backgroundColor: '#FF3B30' }]}>
              <Text style={styles.badgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Prayer Time Banner */}
      <PrayerBanner coords={locationCoords} />

      {/* Continue Reading Card */}
      <Pressable 
        onPress={handleContinueReading}
        style={[styles.quranCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={styles.quranCardContent}>
          <View style={[styles.quranIconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="book" size={24} color={colors.primary} />
          </View>
          <View style={styles.quranTextContainer}>
            <Text style={[styles.quranTitle, { fontFamily: fontSemiBold, color: colors.text.primary }]}>
              {readingProgress ? t('quran.continueReading') : t('quran.readQuran')}
            </Text>
            <Text style={[styles.quranSubtitle, { fontFamily: fontRegular, color: colors.text.secondary }]}>
              {readingProgress ? `${t('quran.page')} ${readingProgress.page}` : t('quran.startReading')}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
        </View>
      </Pressable>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    marginBottom: 8,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  profileAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 15,
  },
  micIcon: {
    marginLeft: 4,
  },
  notificationButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
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
  quranCard: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  quranCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quranIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quranTextContainer: {
    flex: 1,
  },
  quranTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  quranSubtitle: {
    fontSize: 13,
  },
});
