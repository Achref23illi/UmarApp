/**
 * Quran Reading Card Component
 * ==============================
 * Shows user's reading progress and allows quick access to continue reading
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Images } from '@/config/assets';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { calculateOverallProgress, getReadingProgress, ReadingProgress } from '@/services/quranProgress';
import { useAppSelector } from '@/store/hooks';

interface QuranReadingCardProps {
  delay?: number;
}

export default function QuranReadingCard({ delay = 400 }: QuranReadingCardProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  
  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontSemiBold = getFont(currentLanguage, 'semiBold');
  const fontBold = getFont(currentLanguage, 'bold');

  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [overallProgress, setOverallProgress] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const data = await getReadingProgress();
    if (data && (data.ayahNumber > 1 || data.surahNumber > 1)) {
      setProgress(data);
      setOverallProgress(calculateOverallProgress(data.surahNumber, data.ayahNumber));
      setHasStarted(true);
    } else {
      setHasStarted(false);
    }
  };

  const handlePress = () => {
    // Always navigate to library - user can pick their edition
    router.push('/quran');
  };

  // Use app colors (purple gradient)
  const gradientColors = isDark 
    ? ['#4A0B78', '#2D0A4E', '#1A0630'] as const
    : ['#8B3DB8', '#670FA4', '#4A0B78'] as const;

  return (
    <Animated.View entering={FadeInUp.delay(delay)}>
      <Pressable 
        style={({ pressed }) => [
          styles.card,
          { opacity: pressed ? 0.9 : 1 }
        ]}
        onPress={handlePress}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Background Image */}
          <Image
            source={Images.athanBackground}
            style={styles.backgroundImage}
            contentFit="cover"
          />
          
          {/* Decorative Icon */}
          <View style={styles.decorativeIcon}>
            <Ionicons name="book" size={80} color="rgba(255,255,255,0.1)" />
          </View>
          
          <View style={styles.content}>
            {hasStarted ? (
              <>
                <Text style={[styles.title, { fontFamily: fontBold }]}>
                  {t('quran.continueReading')}
                </Text>
                <Text style={[styles.subtitle, { fontFamily: fontRegular }]}>
                  {progress?.surahEnglishName} • {t('quran.ayah')} {progress?.ayahNumber}
                </Text>
                
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${overallProgress}%`, backgroundColor: colors.secondary }]} />
                  </View>
                  <Text style={[styles.progressText, { fontFamily: fontMedium }]}>
                    {overallProgress}%
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.title, { fontFamily: fontBold }]}>
                  {t('quran.readQuran')}
                </Text>
                <Text style={[styles.subtitle, { fontFamily: fontRegular }]}>
                  {t('quran.beginJourney')}
                </Text>
                
                {/* Start Button */}
                <View style={[styles.startButton, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.startButtonText, { fontFamily: fontSemiBold }]}>
                    {t('quran.startReading')}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#000" />
                </View>
              </>
            )}
          </View>
          
          {hasStarted && (
            <View style={styles.arrow}>
              <View style={[styles.arrowCircle, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Ionicons name="chevron-forward" size={20} color="#FFF" />
              </View>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#670FA4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    minHeight: 150,
    overflow: 'hidden',
  },
  backgroundImage: {
    position: 'absolute',
    right: -30,
    bottom: -20,
    width: 200,
    height: 200,
    opacity: 0.15,
  },
  decorativeIcon: {
    position: 'absolute',
    right: 20,
    top: 20,
  },
  content: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    marginBottom: 6,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  startButtonText: {
    color: '#000',
    fontSize: 14,
  },
  arrow: {
    marginLeft: 16,
  },
  arrowCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
