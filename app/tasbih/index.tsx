/**
 * Tasbih Counter Screen
 * ======================
 * Digital tasbeeh/dhikr counter with haptic feedback.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/store/hooks';

const DHIKR_OPTIONS = [
  { id: 'subhanallah', arabic: 'سُبْحَانَ اللّٰهِ', text: 'SubhanAllah', translation: 'Glory be to Allah', target: 33 },
  { id: 'alhamdulillah', arabic: 'الْحَمْدُ لِلّٰهِ', text: 'Alhamdulillah', translation: 'Praise be to Allah', target: 33 },
  { id: 'allahuakbar', arabic: 'اللّٰهُ أَكْبَرُ', text: 'Allahu Akbar', translation: 'Allah is the Greatest', target: 33 },
  { id: 'custom', arabic: '', text: 'Custom', translation: 'Set your own target', target: 100 },
];

export default function TasbihScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  
  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontSemiBold = getFont(currentLanguage, 'semiBold');
  const fontBold = getFont(currentLanguage, 'bold');

  const [count, setCount] = useState(0);
  const [selectedDhikr, setSelectedDhikr] = useState(DHIKR_OPTIONS[0]);
  const [totalCount, setTotalCount] = useState(0);

  const buttonScale = useSharedValue(1);

  const handleCount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    buttonScale.value = withSequence(
      withSpring(0.95, { damping: 10 }),
      withSpring(1, { damping: 15 })
    );
    
    if (count >= selectedDhikr.target - 1) {
      // Completed a round
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCount(0);
      setTotalCount(prev => prev + selectedDhikr.target);
    } else {
      setCount(prev => prev + 1);
    }
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCount(0);
  };

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const progress = count / selectedDhikr.target;

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
          Tasbih Counter
        </Text>
        <Pressable 
          onPress={handleReset}
          style={[styles.resetButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="refresh" size={22} color={colors.text.primary} />
        </Pressable>
      </View>

      {/* Dhikr Selection */}
      <Animated.View entering={FadeIn.delay(100)} style={styles.dhikrSelection}>
        {DHIKR_OPTIONS.slice(0, 3).map((dhikr) => (
          <Pressable
            key={dhikr.id}
            onPress={() => { setSelectedDhikr(dhikr); setCount(0); }}
            style={[
              styles.dhikrChip,
              { 
                backgroundColor: selectedDhikr.id === dhikr.id ? colors.primary : colors.surface,
                borderColor: selectedDhikr.id === dhikr.id ? colors.primary : (isDark ? '#374151' : '#E5E7EB'),
              }
            ]}
          >
            <Text style={[
              styles.dhikrChipText, 
              { 
                fontFamily: fontMedium, 
                color: selectedDhikr.id === dhikr.id ? '#FFF' : colors.text.primary 
              }
            ]}>
              {dhikr.text}
            </Text>
          </Pressable>
        ))}
      </Animated.View>

      {/* Main Counter Area */}
      <View style={styles.counterArea}>
        {/* Arabic Text */}
        <Animated.View entering={FadeIn.delay(200)}>
          <Text style={[styles.arabicText, { fontFamily: 'Amiri-Bold', color: colors.text.primary }]}>
            {selectedDhikr.arabic}
          </Text>
          <Text style={[styles.translationText, { fontFamily: fontRegular, color: colors.text.secondary }]}>
            {selectedDhikr.translation}
          </Text>
        </Animated.View>

        {/* Counter Button */}
        <Animated.View style={[styles.counterButtonWrapper, buttonStyle]}>
          <Pressable onPress={handleCount}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
              style={styles.counterButton}
            >
              {/* Progress Ring */}
              <View style={styles.progressRing}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      transform: [{ rotate: `${progress * 360}deg` }],
                      opacity: progress > 0 ? 1 : 0 
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.countNumber, { fontFamily: fontBold }]}>
                {count}
              </Text>
              <Text style={[styles.countTarget, { fontFamily: fontMedium }]}>
                / {selectedDhikr.target}
              </Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Tap instruction */}
        <Text style={[styles.tapInstruction, { fontFamily: fontRegular, color: colors.text.disabled }]}>
          Tap to count
        </Text>
      </View>

      {/* Stats */}
      <Animated.View entering={FadeIn.delay(300)} style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.statItem}>
          <Ionicons name="repeat" size={20} color={colors.primary} />
          <Text style={[styles.statValue, { fontFamily: fontBold, color: colors.text.primary }]}>
            {Math.floor(totalCount / selectedDhikr.target)}
          </Text>
          <Text style={[styles.statLabel, { fontFamily: fontMedium, color: colors.text.secondary }]}>
            Rounds
          </Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]} />
        <View style={styles.statItem}>
          <Ionicons name="analytics" size={20} color={colors.secondary} />
          <Text style={[styles.statValue, { fontFamily: fontBold, color: colors.text.primary }]}>
            {totalCount + count}
          </Text>
          <Text style={[styles.statLabel, { fontFamily: fontMedium, color: colors.text.secondary }]}>
            Total
          </Text>
        </View>
      </Animated.View>
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
  resetButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
  },
  dhikrSelection: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  dhikrChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  dhikrChipText: {
    fontSize: 13,
  },
  counterArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  arabicText: {
    fontSize: 36,
    textAlign: 'center',
    marginBottom: 8,
  },
  translationText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 40,
  },
  counterButtonWrapper: {
    marginBottom: 20,
  },
  counterButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  progressRing: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  progressFill: {
    position: 'absolute',
    width: 4,
    height: 95,
    backgroundColor: '#FFF',
    top: 0,
    left: '50%',
    marginLeft: -2,
    transformOrigin: 'bottom',
  },
  countNumber: {
    fontSize: 64,
    color: '#FFF',
  },
  countTarget: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    marginTop: -8,
  },
  tapInstruction: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 20,
    padding: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  statValue: {
    fontSize: 24,
  },
  statLabel: {
    fontSize: 12,
  },
});
