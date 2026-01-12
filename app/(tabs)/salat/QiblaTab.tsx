/**
 * Qibla Tab
 * ==========
 * Qibla compass direction finder
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, G, Line, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/store/hooks';

const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

export function QiblaTab() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  
  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontSemiBold = getFont(currentLanguage, 'semiBold');
  const fontBold = getFont(currentLanguage, 'bold');

  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState(0);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const pulseScale = useSharedValue(1);
  
  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  useEffect(() => {
    fetchQiblaDirection();
  }, []);

  const fetchQiblaDirection = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission is required');
        setLoading(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = position.coords;
      setCoordinates({ lat: latitude, lng: longitude });

      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (address) {
        const city = address.city || address.district || '';
        const country = address.country || '';
        setLocationName(city ? `${city} ${country.toUpperCase()}` : country);
      }

      const response = await fetch(
        `https://api.aladhan.com/v1/qibla/${latitude}/${longitude}`
      );
      const data = await response.json();

      if (data.code === 200 && data.data) {
        setQiblaDirection(data.data.direction);
      } else {
        const qibla = calculateQiblaDirection(latitude, longitude);
        setQiblaDirection(qibla);
      }

      const dist = calculateDistance(latitude, longitude, KAABA_LAT, KAABA_LNG);
      setDistance(dist);

      setLoading(false);
    } catch (err) {
      console.error('Qibla error:', err);
      setError('Unable to determine Qibla direction');
      setLoading(false);
    }
  };

  const calculateQiblaDirection = (lat: number, lng: number) => {
    const userLatRad = (lat * Math.PI) / 180;
    const userLngRad = (lng * Math.PI) / 180;
    const kaabaLatRad = (KAABA_LAT * Math.PI) / 180;
    const kaabaLngRad = (KAABA_LNG * Math.PI) / 180;

    const lngDiff = kaabaLngRad - userLngRad;

    const x = Math.cos(kaabaLatRad) * Math.sin(lngDiff);
    const y = Math.cos(userLatRad) * Math.sin(kaabaLatRad) -
              Math.sin(userLatRad) * Math.cos(kaabaLatRad) * Math.cos(lngDiff);

    let qibla = Math.atan2(x, y) * (180 / Math.PI);
    if (qibla < 0) {
      qibla += 360;
    }
    return qibla;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  };

  const COMPASS_SIZE = 280;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: 8 }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
            Qibla
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
        <Pressable 
          onPress={fetchQiblaDirection} 
          style={[styles.refreshButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="refresh" size={22} color={colors.text.primary} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { fontFamily: fontMedium, color: colors.text.secondary }]}>
            Finding Qibla direction...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={64} color={colors.text.disabled} />
          <Text style={[styles.errorText, { fontFamily: fontMedium, color: colors.text.primary }]}>
            {error}
          </Text>
          <Pressable 
            onPress={fetchQiblaDirection}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.retryText, { fontFamily: fontSemiBold }]}>Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Compass */}
          <View style={styles.compassContainer}>
            <LinearGradient
              colors={isDark ? ['#374151', '#1F2937'] : ['#FFFFFF', '#F9FAFB']}
              style={styles.compassCard}
            >
              <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} viewBox="0 0 200 200">
                <Defs>
                  <RadialGradient id="bgGrad" cx="50%" cy="50%" rx="50%" ry="50%">
                    <Stop offset="0%" stopColor={isDark ? '#374151' : '#F9FAFB'} />
                    <Stop offset="100%" stopColor={isDark ? '#1F2937' : '#F3F4F6'} />
                  </RadialGradient>
                </Defs>
                
                <Circle cx="100" cy="100" r="95" fill="url(#bgGrad)" />
                <Circle cx="100" cy="100" r="92" stroke={isDark ? '#4B5563' : '#E5E7EB'} strokeWidth="2" fill="transparent" />
                
                {/* Cardinal Directions */}
                <G>
                  <SvgText x="100" y="28" fill="#8B3DB8" fontSize="16" fontWeight="bold" textAnchor="middle">S</SvgText>
                  <SvgText x="178" y="105" fill={isDark ? '#9CA3AF' : '#6B7280'} fontSize="14" fontWeight="600" textAnchor="middle">E</SvgText>
                  <SvgText x="100" y="182" fill={isDark ? '#9CA3AF' : '#6B7280'} fontSize="14" fontWeight="600" textAnchor="middle">N</SvgText>
                  <SvgText x="22" y="105" fill={isDark ? '#9CA3AF' : '#6B7280'} fontSize="14" fontWeight="600" textAnchor="middle">O</SvgText>
                </G>

                {/* Qibla Direction Arrow */}
                <G rotation={qiblaDirection} origin="100, 100">
                  <Path
                    d="M96 100 L96 35 L100 25 L104 35 L104 100 Z"
                    fill="#8B3DB8"
                  />
                  <Circle cx="100" cy="35" r="8" fill="#8B3DB8" opacity="0.3" />
                </G>

                {/* Center Kaaba Symbol */}
                <Circle cx="100" cy="100" r="22" fill={isDark ? '#1F2937' : '#FFF'} stroke="#8B3DB8" strokeWidth="2" />
                <SvgText x="100" y="108" fontSize="24" textAnchor="middle">🕋</SvgText>
              </Svg>
            </LinearGradient>

            {/* Direction Display */}
            <Animated.View style={[styles.directionDisplay, pulseStyle]}>
              <Text style={[styles.directionDegree, { fontFamily: fontBold, color: colors.text.primary }]}>
                Qibla {Math.round(qiblaDirection)}°
              </Text>
            </Animated.View>
          </View>

          {/* Coordinates */}
          {coordinates && (
            <View style={[styles.coordinatesCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.coordLabel, { fontFamily: fontMedium, color: colors.text.secondary }]}>
                Latitude {coordinates.lat.toFixed(5)}
              </Text>
              <Text style={[styles.coordLabel, { fontFamily: fontMedium, color: colors.text.secondary }]}>
                Longitude {coordinates.lng.toFixed(5)}
              </Text>
            </View>
          )}
        </View>
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
    paddingBottom: 12,
  },
  headerContent: {
    alignItems: 'center',
    flex: 1,
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
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    marginTop: 8,
  },
  retryText: {
    color: '#FFF',
    fontSize: 15,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  compassContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  compassCard: {
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  directionDisplay: {
    marginTop: 16,
    alignItems: 'center',
  },
  directionDegree: {
    fontSize: 24,
  },
  coordinatesCard: {
    flexDirection: 'row',
    gap: 16,
    padding: 16,
    borderRadius: 16,
  },
  coordLabel: {
    fontSize: 13,
  },
});
