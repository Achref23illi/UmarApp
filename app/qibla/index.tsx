/**
 * Qibla Direction Screen
 * =======================
 * Premium Qibla finder with AlAdhan API integration.
 * Beautiful UI with step-by-step guidance for users.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, G, Line, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/store/hooks';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const COMPASS_SIZE = Math.min(SCREEN_WIDTH - 60, 320);

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

export default function QiblaScreen() {
  const router = useRouter();
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
  const [currentStep, setCurrentStep] = useState(0);

  // Pulse animation for the arrow
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

  // Get location and fetch Qibla from API
  useEffect(() => {
    fetchQiblaDirection();
  }, []);

  const fetchQiblaDirection = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission is required to find Qibla direction');
        setLoading(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = position.coords;

      // Get location name
      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (address) {
        const city = address.city || address.district || '';
        const country = address.country || '';
        setLocationName(city ? `${city}, ${country}` : country);
      }

      // Fetch Qibla direction from AlAdhan API
      const response = await fetch(
        `https://api.aladhan.com/v1/qibla/${latitude}/${longitude}`
      );
      const data = await response.json();

      if (data.code === 200 && data.data) {
        setQiblaDirection(data.data.direction);
      } else {
        // Fallback to local calculation
        const qibla = calculateQiblaDirection(latitude, longitude);
        setQiblaDirection(qibla);
      }

      // Calculate distance to Kaaba
      const dist = calculateDistance(latitude, longitude, KAABA_LAT, KAABA_LNG);
      setDistance(dist);

      setLoading(false);
    } catch (err) {
      console.error('Qibla error:', err);
      setError('Unable to determine Qibla direction. Please check your connection.');
      setLoading(false);
    }
  };

  // Fallback: Calculate Qibla direction locally
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

  // Calculate distance (Haversine formula)
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

  // Get cardinal direction
  const getCardinalDirection = (angle: number) => {
    const directions = ['North', 'Northeast', 'East', 'Southeast', 'South', 'Southwest', 'West', 'Northwest'];
    const index = Math.round(angle / 45) % 8;
    return directions[index];
  };

  // Step-by-step guidance
  const steps = [
    { icon: 'phone-portrait-outline', title: 'Hold Phone Flat', desc: 'Keep your phone parallel to the ground' },
    { icon: 'compass-outline', title: 'Open Compass', desc: 'Use your phone\'s built-in compass app' },
    { icon: 'navigate-outline', title: 'Find Direction', desc: `Rotate until the compass shows ${Math.round(qiblaDirection)}°` },
    { icon: 'checkmark-circle-outline', title: 'Face Qibla', desc: 'You are now facing the Holy Kaaba' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={isDark ? ['#1F2937', colors.background] : ['#F3F4F6', colors.background]}
        style={[styles.headerGradient, { paddingTop: insets.top }]}
      >
        <View style={styles.header}>
          <Pressable 
            onPress={() => router.back()} 
            style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </Pressable>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
              Qibla Finder
            </Text>
            {locationName && (
              <View style={styles.locationRow}>
                <Ionicons name="location" size={12} color={colors.secondary} />
                <Text style={[styles.locationText, { fontFamily: fontMedium, color: colors.text.secondary }]}>
                  {locationName}
                </Text>
              </View>
            )}
          </View>
          <Pressable 
            onPress={fetchQiblaDirection} 
            style={[styles.refreshButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
          >
            <Ionicons name="refresh-outline" size={22} color={colors.text.primary} />
          </Pressable>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingCircle, { borderColor: colors.primary }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text style={[styles.loadingText, { fontFamily: fontMedium, color: colors.text.secondary }]}>
            Finding Qibla direction...
          </Text>
          <Text style={[styles.loadingSubtext, { fontFamily: fontRegular, color: colors.text.disabled }]}>
            Using your location to calculate
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <View style={[styles.errorIcon, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
          </View>
          <Text style={[styles.errorTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
            Unable to Find Qibla
          </Text>
          <Text style={[styles.errorText, { fontFamily: fontRegular, color: colors.text.secondary }]}>
            {error}
          </Text>
          <Pressable 
            onPress={fetchQiblaDirection}
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="refresh" size={20} color="#FFF" />
            <Text style={[styles.retryText, { fontFamily: fontSemiBold }]}>Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
        >
          {/* Main Compass Card */}
          <Animated.View entering={FadeInUp.delay(100).springify()}>
            <LinearGradient
              colors={isDark ? ['#374151', '#1F2937'] : ['#FFFFFF', '#F9FAFB']}
              style={styles.compassCard}
            >
              {/* Compass Visual */}
              <View style={styles.compassWrapper}>
                <Svg width={COMPASS_SIZE} height={COMPASS_SIZE} viewBox="0 0 200 200">
                  <Defs>
                    <RadialGradient id="bgGrad" cx="50%" cy="50%" rx="50%" ry="50%">
                      <Stop offset="0%" stopColor={isDark ? '#374151' : '#F9FAFB'} />
                      <Stop offset="100%" stopColor={isDark ? '#1F2937' : '#F3F4F6'} />
                    </RadialGradient>
                  </Defs>
                  
                  {/* Background Circle */}
                  <Circle cx="100" cy="100" r="95" fill="url(#bgGrad)" />
                  
                  {/* Outer Ring */}
                  <Circle cx="100" cy="100" r="92" stroke={isDark ? '#4B5563' : '#E5E7EB'} strokeWidth="2" fill="transparent" />
                  
                  {/* Degree Ticks */}
                  {Array.from({ length: 72 }).map((_, i) => {
                    const deg = i * 5;
                    const isCardinal = deg % 90 === 0;
                    const isMajor = deg % 30 === 0;
                    const rad = (deg - 90) * (Math.PI / 180);
                    const innerR = isCardinal ? 72 : isMajor ? 80 : 85;
                    const outerR = 90;
                    return (
                      <Line
                        key={deg}
                        x1={100 + innerR * Math.cos(rad)}
                        y1={100 + innerR * Math.sin(rad)}
                        x2={100 + outerR * Math.cos(rad)}
                        y2={100 + outerR * Math.sin(rad)}
                        stroke={isCardinal ? '#F59E0B' : (isDark ? '#4B5563' : '#D1D5DB')}
                        strokeWidth={isCardinal ? 3 : isMajor ? 2 : 1}
                      />
                    );
                  })}

                  {/* Cardinal Labels */}
                  <G>
                    <SvgText x="100" y="28" fill="#F59E0B" fontSize="16" fontWeight="bold" textAnchor="middle">N</SvgText>
                    <SvgText x="178" y="105" fill={isDark ? '#9CA3AF' : '#6B7280'} fontSize="14" fontWeight="600" textAnchor="middle">E</SvgText>
                    <SvgText x="100" y="182" fill={isDark ? '#9CA3AF' : '#6B7280'} fontSize="14" fontWeight="600" textAnchor="middle">S</SvgText>
                    <SvgText x="22" y="105" fill={isDark ? '#9CA3AF' : '#6B7280'} fontSize="14" fontWeight="600" textAnchor="middle">W</SvgText>
                  </G>

                  {/* Qibla Direction Arrow */}
                  <G rotation={qiblaDirection} origin="100, 100">
                    {/* Arrow Shaft */}
                    <Path
                      d="M96 100 L96 35 L100 25 L104 35 L104 100 Z"
                      fill="#F59E0B"
                    />
                    {/* Arrow Glow */}
                    <Circle cx="100" cy="35" r="8" fill="#F59E0B" opacity="0.3" />
                  </G>

                  {/* Center Kaaba Symbol */}
                  <Circle cx="100" cy="100" r="22" fill={isDark ? '#1F2937' : '#FFF'} stroke="#F59E0B" strokeWidth="2" />
                  <SvgText x="100" y="108" fontSize="24" textAnchor="middle">🕋</SvgText>
                </Svg>
              </View>

              {/* Direction Display */}
              <Animated.View style={[styles.directionDisplay, pulseStyle]}>
                <Text style={[styles.directionDegree, { fontFamily: fontBold, color: colors.text.primary }]}>
                  {Math.round(qiblaDirection)}°
                </Text>
                <Text style={[styles.directionCardinal, { fontFamily: fontMedium, color: colors.secondary }]}>
                  {getCardinalDirection(qiblaDirection)}
                </Text>
              </Animated.View>
            </LinearGradient>
          </Animated.View>

          {/* Distance Card */}
          <Animated.View entering={FadeInUp.delay(200).springify()}>
            <View style={[styles.distanceCard, { backgroundColor: colors.surface }]}>
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.distanceIcon}
              >
                <Ionicons name="navigate" size={24} color="#FFF" />
              </LinearGradient>
              <View style={styles.distanceContent}>
                <Text style={[styles.distanceLabel, { fontFamily: fontMedium, color: colors.text.secondary }]}>
                  Distance to Kaaba
                </Text>
                <Text style={[styles.distanceValue, { fontFamily: fontBold, color: colors.text.primary }]}>
                  {distance.toLocaleString()} km
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.text.disabled} />
            </View>
          </Animated.View>

          {/* How to Use Section */}
          <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.howToSection}>
            <Text style={[styles.sectionTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
              How to Find Qibla
            </Text>
            
            <View style={styles.stepsContainer}>
              {steps.map((step, index) => (
                <Animated.View 
                  key={index}
                  entering={FadeInDown.delay(400 + index * 100)}
                  style={[
                    styles.stepCard, 
                    { 
                      backgroundColor: colors.surface,
                      borderLeftColor: currentStep === index ? '#F59E0B' : 'transparent',
                      borderLeftWidth: 3,
                    }
                  ]}
                >
                  <View style={[styles.stepNumber, { backgroundColor: currentStep >= index ? '#F59E0B' : (isDark ? '#374151' : '#E5E7EB') }]}>
                    {currentStep > index ? (
                      <Ionicons name="checkmark" size={14} color="#FFF" />
                    ) : (
                      <Text style={[styles.stepNumberText, { fontFamily: fontBold, color: currentStep >= index ? '#FFF' : colors.text.secondary }]}>
                        {index + 1}
                      </Text>
                    )}
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepTitle, { fontFamily: fontSemiBold, color: colors.text.primary }]}>
                      {step.title}
                    </Text>
                    <Text style={[styles.stepDesc, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                      {step.desc}
                    </Text>
                  </View>
                  <Ionicons name={step.icon as any} size={24} color={currentStep === index ? '#F59E0B' : colors.text.disabled} />
                </Animated.View>
              ))}
            </View>

            {/* Progress Button */}
            <Pressable
              onPress={() => setCurrentStep((prev) => (prev + 1) % 4)}
              style={[styles.nextStepButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.nextStepText, { fontFamily: fontSemiBold }]}>
                {currentStep === 3 ? 'Start Over' : 'Next Step'}
              </Text>
              <Ionicons name={currentStep === 3 ? 'refresh' : 'arrow-forward'} size={20} color="#FFF" />
            </Pressable>
          </Animated.View>

          {/* Tip Card */}
          <Animated.View entering={FadeIn.delay(800)}>
            <View style={[styles.tipCard, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.08)' }]}>
              <Ionicons name="bulb-outline" size={24} color="#F59E0B" />
              <View style={styles.tipContent}>
                <Text style={[styles.tipTitle, { fontFamily: fontSemiBold, color: colors.text.primary }]}>
                  Pro Tip
                </Text>
                <Text style={[styles.tipText, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                  For the most accurate direction, ensure you're away from metal objects and electronic devices that may interfere with the compass.
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
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
    fontSize: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  loadingSubtext: {
    fontSize: 13,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  errorIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 20,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    marginTop: 8,
  },
  retryText: {
    color: '#FFF',
    fontSize: 15,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  compassCard: {
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  compassWrapper: {
    marginBottom: 16,
  },
  directionDisplay: {
    alignItems: 'center',
  },
  directionDegree: {
    fontSize: 42,
  },
  directionCardinal: {
    fontSize: 16,
    marginTop: 4,
  },
  distanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginBottom: 24,
    gap: 16,
  },
  distanceIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceContent: {
    flex: 1,
  },
  distanceLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  distanceValue: {
    fontSize: 18,
  },
  howToSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  stepsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 14,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 13,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 12,
  },
  nextStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  nextStepText: {
    color: '#FFF',
    fontSize: 16,
  },
  tipCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
