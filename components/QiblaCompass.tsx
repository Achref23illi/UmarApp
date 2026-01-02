/**
 * Qibla Compass Component
 * ========================
 * Shows direction to Kaaba using device magnetometer and location.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Magnetometer } from 'expo-sensors';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    View
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import Svg, { Circle, G, Line } from 'react-native-svg';

import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/store/hooks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COMPASS_SIZE = SCREEN_WIDTH - 80;

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

interface QiblaCompassProps {
  userLatitude: number;
  userLongitude: number;
}

export default function QiblaCompass({ userLatitude, userLongitude }: QiblaCompassProps) {
  const { colors, isDark } = useTheme();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  
  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontSemiBold = getFont(currentLanguage, 'semiBold');
  const fontBold = getFont(currentLanguage, 'bold');

  const [heading, setHeading] = useState(0);
  const [qiblaDirection, setQiblaDirection] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compassRotation = useSharedValue(0);

  // Calculate Qibla direction from user's location
  useEffect(() => {
    if (userLatitude && userLongitude) {
      const qibla = calculateQiblaDirection(userLatitude, userLongitude);
      setQiblaDirection(qibla);
    }
  }, [userLatitude, userLongitude]);

  // Subscribe to magnetometer
  useEffect(() => {
    let subscription: any;

    const startMagnetometer = async () => {
      try {
        const { status } = await Magnetometer.requestPermissionsAsync();
        if (status !== 'granted') {
          setError('Compass permission denied');
          return;
        }
        setHasPermission(true);

        Magnetometer.setUpdateInterval(100);
        subscription = Magnetometer.addListener((data) => {
          const angle = calculateHeading(data.x, data.y);
          setHeading(angle);
          compassRotation.value = withSpring(-angle, { damping: 20, stiffness: 90 });
        });
      } catch (err) {
        setError('Compass not available on this device');
        console.error('Magnetometer error:', err);
      }
    };

    startMagnetometer();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  // Calculate heading from magnetometer data
  const calculateHeading = (x: number, y: number) => {
    let angle = Math.atan2(y, x) * (180 / Math.PI);
    // Adjust for device orientation
    if (Platform.OS === 'ios') {
      angle = angle + 90;
    }
    if (angle < 0) {
      angle += 360;
    }
    return angle;
  };

  // Calculate Qibla direction using spherical geometry
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

  // Animated style for compass rotation
  const compassStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${compassRotation.value}deg` }],
  }));

  // Calculate needle rotation (Qibla relative to current heading)
  const needleRotation = qiblaDirection - heading;

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <Ionicons name="warning-outline" size={48} color={colors.text.secondary} />
        <Text style={[styles.errorText, { fontFamily: fontMedium, color: colors.text.secondary }]}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Ionicons name="compass-outline" size={24} color={colors.primary} />
        <Text style={[styles.title, { fontFamily: fontBold, color: colors.text.primary }]}>
          Qibla Direction
        </Text>
      </View>

      {/* Compass Container */}
      <LinearGradient
        colors={isDark ? ['#1F2937', '#111827'] : ['#F9FAFB', '#F3F4F6']}
        style={styles.compassContainer}
      >
        {/* Compass Rose */}
        <Animated.View style={[styles.compass, compassStyle]}>
          <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} viewBox="0 0 200 200">
            {/* Outer Circle */}
            <Circle cx="100" cy="100" r="95" stroke={isDark ? '#374151' : '#E5E7EB'} strokeWidth="2" fill="transparent" />
            <Circle cx="100" cy="100" r="85" stroke={isDark ? '#4B5563' : '#D1D5DB'} strokeWidth="1" fill="transparent" />
            
            {/* Cardinal Direction Markers */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
              const isCardinal = deg % 90 === 0;
              const rad = (deg - 90) * (Math.PI / 180);
              const innerR = isCardinal ? 70 : 78;
              const outerR = 85;
              const x1 = 100 + innerR * Math.cos(rad);
              const y1 = 100 + innerR * Math.sin(rad);
              const x2 = 100 + outerR * Math.cos(rad);
              const y2 = 100 + outerR * Math.sin(rad);
              return (
                <Line
                  key={deg}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isCardinal ? (isDark ? '#9CA3AF' : '#6B7280') : (isDark ? '#4B5563' : '#D1D5DB')}
                  strokeWidth={isCardinal ? 2 : 1}
                />
              );
            })}

            {/* N/E/S/W Labels */}
            <G>
              <SvgText x="100" y="30" fill={colors.primary} fontSize="16" fontWeight="bold" textAnchor="middle">N</SvgText>
              <SvgText x="170" y="105" fill={isDark ? '#9CA3AF' : '#6B7280'} fontSize="14" fontWeight="500" textAnchor="middle">E</SvgText>
              <SvgText x="100" y="180" fill={isDark ? '#9CA3AF' : '#6B7280'} fontSize="14" fontWeight="500" textAnchor="middle">S</SvgText>
              <SvgText x="30" y="105" fill={isDark ? '#9CA3AF' : '#6B7280'} fontSize="14" fontWeight="500" textAnchor="middle">W</SvgText>
            </G>
          </Svg>
        </Animated.View>

        {/* Qibla Needle (Fixed, rotates based on direction) */}
        <View 
          style={[
            styles.needleContainer, 
            { transform: [{ rotate: `${needleRotation}deg` }] }
          ]}
        >
          <View style={styles.needle}>
            <LinearGradient
              colors={['#F5C661', '#F59E0B']}
              style={styles.needleGradient}
            >
              <Ionicons name="navigate" size={32} color="#FFF" />
            </LinearGradient>
          </View>
          <Text style={[styles.kaabaLabel, { fontFamily: fontSemiBold }]}>
            Kaaba
          </Text>
        </View>

        {/* Center Circle */}
        <View style={[styles.centerDot, { backgroundColor: colors.primary }]} />
      </LinearGradient>

      {/* Direction Info */}
      <View style={[styles.infoContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { fontFamily: fontMedium, color: colors.text.secondary }]}>
            Qibla
          </Text>
          <Text style={[styles.infoValue, { fontFamily: fontBold, color: colors.text.primary }]}>
            {Math.round(qiblaDirection)}°
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { fontFamily: fontMedium, color: colors.text.secondary }]}>
            Heading
          </Text>
          <Text style={[styles.infoValue, { fontFamily: fontBold, color: colors.text.primary }]}>
            {Math.round(heading)}°
          </Text>
        </View>
      </View>
    </View>
  );
}

// SVG Text component wrapper
const SvgText = (props: any) => {
  const { Text: SvgTextElement } = require('react-native-svg');
  return <SvgTextElement {...props} />;
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
  },
  container: {
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  compassContainer: {
    width: COMPASS_SIZE + 40,
    height: COMPASS_SIZE + 40,
    borderRadius: (COMPASS_SIZE + 40) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  compass: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  needleContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 80,
    height: COMPASS_SIZE / 2 + 20,
  },
  needle: {
    alignItems: 'center',
  },
  needleGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  kaabaLabel: {
    color: '#F59E0B',
    fontSize: 12,
    marginTop: 4,
  },
  centerDot: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  infoContainer: {
    flexDirection: 'row',
    marginTop: 24,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 24,
  },
  divider: {
    width: 1,
    height: 40,
  },
});
