/**
 * Qibla Tab
 * ==========
 * Qibla compass direction finder
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  Path,
  RadialGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/store/hooks';

const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

export function QiblaTab() {
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
  const [heading, setHeading] = useState(0);
  const [headingAccuracy, setHeadingAccuracy] = useState(0);
  const [hasCompassHeading, setHasCompassHeading] = useState(true);
  const headingSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const positionSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const alignmentHapticLockRef = useRef(false);
  const lastAlignedHapticAtRef = useRef(0);

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  useEffect(() => {
    void startQiblaTracking();
    return () => {
      stopQiblaTracking();
    };
  }, []);

  const stopQiblaTracking = () => {
    headingSubscriptionRef.current?.remove();
    positionSubscriptionRef.current?.remove();
    headingSubscriptionRef.current = null;
    positionSubscriptionRef.current = null;
  };

  const normalizeHeading = (value: number) => {
    const normalized = value % 360;
    return normalized < 0 ? normalized + 360 : normalized;
  };

  const resolveHeading = (value: Location.LocationHeadingObject) => {
    const raw = value.trueHeading >= 0 ? value.trueHeading : value.magHeading;
    return normalizeHeading(raw || 0);
  };

  const updateQiblaFromCoordinates = (latitude: number, longitude: number) => {
    setCoordinates({ lat: latitude, lng: longitude });
    setQiblaDirection(calculateQiblaDirection(latitude, longitude));
    setDistance(calculateDistance(latitude, longitude, KAABA_LAT, KAABA_LNG));
  };

  const startQiblaTracking = async () => {
    try {
      setLoading(true);
      setError(null);
      stopQiblaTracking();

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission is required');
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = position.coords;
      updateQiblaFromCoordinates(latitude, longitude);

      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (address) {
        const city = address.city || address.district || '';
        const country = address.country || '';
        setLocationName(city ? `${city} ${country.toUpperCase()}` : country);
      }

      positionSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 5,
          timeInterval: 5000,
        },
        (nextPosition) => {
          updateQiblaFromCoordinates(nextPosition.coords.latitude, nextPosition.coords.longitude);
        }
      );

      try {
        headingSubscriptionRef.current = await Location.watchHeadingAsync((nextHeading) => {
          setHeading(resolveHeading(nextHeading));
          setHeadingAccuracy(Number(nextHeading.accuracy || 0));
        });
        setHasCompassHeading(true);
      } catch (headingError) {
        console.warn('Heading subscription unavailable', headingError);
        const currentHeading = await Location.getHeadingAsync();
        setHeading(resolveHeading(currentHeading));
        setHeadingAccuracy(Number(currentHeading.accuracy || 0));
        setHasCompassHeading(false);
      }
    } catch (err) {
      console.error('Qibla error:', err);
      setError('Unable to determine Qibla direction');
    } finally {
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
    const y =
      Math.cos(userLatRad) * Math.sin(kaabaLatRad) -
      Math.sin(userLatRad) * Math.cos(kaabaLatRad) * Math.cos(lngDiff);

    let qibla = Math.atan2(x, y) * (180 / Math.PI);
    if (qibla < 0) {
      qibla += 360;
    }
    return qibla;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const COMPASS_SIZE = 280;
  const needleRotation = normalizeHeading(qiblaDirection - heading);
  const needsCalibration = hasCompassHeading && headingAccuracy <= 1;
  const alignmentDelta = Math.abs(((qiblaDirection - heading + 540) % 360) - 180);
  const alignmentTolerance = 7;
  const isAligned = hasCompassHeading && !needsCalibration && alignmentDelta <= alignmentTolerance;

  useEffect(() => {
    if (!hasCompassHeading || needsCalibration) {
      alignmentHapticLockRef.current = false;
      return;
    }

    const now = Date.now();
    if (isAligned) {
      const shouldPulse =
        !alignmentHapticLockRef.current || now - lastAlignedHapticAtRef.current > 2500;
      if (shouldPulse) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        alignmentHapticLockRef.current = true;
        lastAlignedHapticAtRef.current = now;
      }
      return;
    }

    if (alignmentDelta > alignmentTolerance + 3) {
      alignmentHapticLockRef.current = false;
    }
  }, [alignmentDelta, hasCompassHeading, isAligned, needsCalibration]);

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
              <Text
                style={[
                  styles.locationText,
                  { fontFamily: fontMedium, color: colors.text.secondary },
                ]}
              >
                {locationName}
              </Text>
            </View>
          )}
        </View>
        <Pressable
          onPress={() => void startQiblaTracking()}
          style={[styles.refreshButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="refresh" size={22} color={colors.text.primary} />
        </Pressable>
      </View>

      {needsCalibration ? (
        <View
          style={[styles.calibrationBanner, { backgroundColor: isDark ? '#3F2A12' : '#FEF3C7' }]}
        >
          <Ionicons name="warning-outline" size={16} color={isDark ? '#FACC15' : '#B45309'} />
          <Text
            style={[
              styles.calibrationText,
              { color: isDark ? '#FCD34D' : '#92400E', fontFamily: fontMedium },
            ]}
          >
            Compass calibration needed. Move your phone in a figure-8 pattern.
          </Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={[styles.loadingText, { fontFamily: fontMedium, color: colors.text.secondary }]}
          >
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
            onPress={() => void startQiblaTracking()}
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
                <Circle
                  cx="100"
                  cy="100"
                  r="92"
                  stroke={isDark ? '#4B5563' : '#E5E7EB'}
                  strokeWidth="2"
                  fill="transparent"
                />

                {/* Cardinal Directions */}
                <G>
                  <SvgText
                    x="100"
                    y="28"
                    fill="#8B3DB8"
                    fontSize="16"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    N
                  </SvgText>
                  <SvgText
                    x="178"
                    y="105"
                    fill={isDark ? '#9CA3AF' : '#6B7280'}
                    fontSize="14"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    E
                  </SvgText>
                  <SvgText
                    x="100"
                    y="182"
                    fill={isDark ? '#9CA3AF' : '#6B7280'}
                    fontSize="14"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    S
                  </SvgText>
                  <SvgText
                    x="22"
                    y="105"
                    fill={isDark ? '#9CA3AF' : '#6B7280'}
                    fontSize="14"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    W
                  </SvgText>
                </G>

                {/* Qibla Direction Arrow */}
                <G rotation={needleRotation} origin="100, 100">
                  <Line
                    x1="100"
                    y1="100"
                    x2="100"
                    y2="20"
                    stroke={isAligned ? '#22C55E' : '#8B3DB8'}
                    strokeWidth="3"
                    strokeDasharray="6 4"
                    opacity="0.9"
                  />
                  <Path d="M96 100 L96 35 L100 25 L104 35 L104 100 Z" fill="#8B3DB8" />
                  <Circle
                    cx="100"
                    cy="35"
                    r="8"
                    fill={isAligned ? '#22C55E' : '#8B3DB8'}
                    opacity="0.3"
                  />
                </G>

                {/* Center Kaaba Symbol */}
                <Circle
                  cx="100"
                  cy="100"
                  r="22"
                  fill={isDark ? '#1F2937' : '#FFF'}
                  stroke="#8B3DB8"
                  strokeWidth="2"
                />
                <SvgText x="100" y="108" fontSize="24" textAnchor="middle">
                  🕋
                </SvgText>
              </Svg>
            </LinearGradient>

            {/* Direction Display */}
            <Animated.View style={[styles.directionDisplay, pulseStyle]}>
              <Text
                style={[
                  styles.directionDegree,
                  { fontFamily: fontBold, color: colors.text.primary },
                ]}
              >
                Qibla {Math.round(qiblaDirection)}°
              </Text>
              <Text
                style={[
                  styles.qiblaLineHint,
                  { fontFamily: fontMedium, color: isAligned ? '#16A34A' : colors.text.secondary },
                ]}
              >
                {isAligned
                  ? 'Aligned with Qibla line'
                  : `Turn ${Math.round(alignmentDelta)}° to align`}
              </Text>
              <Text
                style={[
                  styles.directionSubtext,
                  { fontFamily: fontMedium, color: colors.text.secondary },
                ]}
              >
                Facing {Math.round(heading)}°
              </Text>
              <Text
                style={[
                  styles.directionHint,
                  { fontFamily: fontRegular, color: colors.text.secondary },
                ]}
              >
                Follow the dashed line to face Qibla. Phone vibrates when aligned.
              </Text>
              {!hasCompassHeading ? (
                <Text
                  style={[
                    styles.directionHint,
                    { fontFamily: fontRegular, color: colors.text.secondary },
                  ]}
                >
                  Compass sensor limited on this device.
                </Text>
              ) : null}
            </Animated.View>
          </View>

          {/* Coordinates */}
          {coordinates && (
            <View style={[styles.coordinatesCard, { backgroundColor: colors.surface }]}>
              <Text
                style={[
                  styles.coordLabel,
                  { fontFamily: fontMedium, color: colors.text.secondary },
                ]}
              >
                Latitude {coordinates.lat.toFixed(5)}
              </Text>
              <Text
                style={[
                  styles.coordLabel,
                  { fontFamily: fontMedium, color: colors.text.secondary },
                ]}
              >
                Longitude {coordinates.lng.toFixed(5)}
              </Text>
              <Text
                style={[
                  styles.coordLabel,
                  { fontFamily: fontMedium, color: colors.text.secondary },
                ]}
              >
                Kaaba distance {distance} km
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
  qiblaLineHint: {
    fontSize: 13,
    marginTop: 6,
  },
  directionSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  directionHint: {
    fontSize: 12,
    marginTop: 6,
  },
  coordinatesCard: {
    alignItems: 'center',
    gap: 6,
    padding: 16,
    borderRadius: 16,
  },
  coordLabel: {
    fontSize: 13,
  },
  calibrationBanner: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calibrationText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
});
