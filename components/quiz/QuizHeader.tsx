/**
 * Quiz Header Component
 * =====================
 * Reusable curved header with QUIZZ logo for quiz screens
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFont } from '@/hooks/use-fonts';
import { useAppSelector } from '@/store/hooks';

interface QuizHeaderProps {
  showSettings?: boolean;
  onSettingsPress?: () => void;
}

export function QuizHeader({ showSettings = true, onSettingsPress }: QuizHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const fontBold = getFont(currentLanguage, 'bold');

  const handleSettingsPress = () => {
    if (onSettingsPress) {
      onSettingsPress();
    } else {
      router.push('/settings');
    }
  };

  return (
    <View style={styles.curvedHeader}>
      <LinearGradient
        colors={['#7C3AED', '#A855F7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <Ionicons name="star" size={60} color="#FCD34D" style={styles.starLeft} />
        <Ionicons name="star" size={40} color="#FCD34D" style={styles.starRight} />
        
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.logoContainer}>
            <Text style={[styles.logo, { fontFamily: fontBold }]}>QUIZZ</Text>
          </View>
          {showSettings && (
            <Pressable 
              style={styles.settingsButton}
              onPress={handleSettingsPress}
            >
              <Ionicons name="settings-outline" size={28} color="#FFF" />
            </Pressable>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  curvedHeader: {
    width: '100%',
    height: 200,
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
    paddingBottom: 30,
    position: 'relative',
  },
  starLeft: {
    position: 'absolute',
    top: 30,
    left: 80,
    opacity: 0.9,
    transform: [{ rotate: '-15deg' }],
  },
  starRight: {
    position: 'absolute',
    top: 20,
    right: 60,
    opacity: 0.9,
    transform: [{ rotate: '15deg' }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    color: '#FFFFFF',
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 20,
    top: 0,
  },
});
