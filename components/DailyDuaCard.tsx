import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { useAppSelector } from '@/store/hooks';

interface Dua {
  id: string;
  arabic_text: string;
  translation: string;
  reference: string;
  category: string;
}

interface DailyDuaCardProps {
  delay?: number;
}

export default function DailyDuaCard({ delay = 500 }: DailyDuaCardProps) {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  
  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontSemiBold = getFont(currentLanguage, 'semiBold');

  const [dua, setDua] = useState<Dua | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDua();
  }, []);

  const fetchDua = async () => {
    try {
      setLoading(true);
      // Fetch a random dua
      const { data, error } = await supabase
        .from('duas')
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.length);
        setDua(data[randomIndex]);
      }
    } catch (error) {
      console.error('Error fetching dua:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gradient colors (Teal/Emerald for Dua/Peace)
  const gradientColors = isDark 
    ? ['#0F766E', '#115E59', '#134E4A'] as const
    : ['#2DD4BF', '#14B8A6', '#0F766E'] as const;

  return (
    <Animated.View entering={FadeInUp.delay(delay)}>
      <View style={styles.container}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Ionicons name="heart" size={20} color="rgba(255,255,255,0.9)" />
              <Text style={[styles.headerTitle, { fontFamily: fontSemiBold }]}>
                {t('dua.duaOfTheDay')}
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#FFF" />
            </View>
          ) : dua ? (
            <View style={styles.content}>
              <Text style={[styles.arabicText, { fontFamily: 'Amiri-Bold' }]}>
                {dua.arabic_text}
              </Text>
              
              <View style={styles.divider} />
              
              <Text style={[styles.translationText, { fontFamily: fontRegular }]}>
                {dua.translation}
              </Text>
              
              {dua.reference && (
                <Text style={[styles.referenceText, { fontFamily: fontMedium }]}>
                  {dua.reference}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { fontFamily: fontRegular }]}>
                {t('dua.noDuasAvailable')}
              </Text>
            </View>
          )}
        </LinearGradient>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    borderRadius: 24,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    padding: 20,
    minHeight: 180,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 100,
  },
  content: {
    gap: 12,
  },
  arabicText: {
    color: '#FFF',
    fontSize: 24,
    textAlign: 'center',
    lineHeight: 40,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 4,
  },
  translationText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  referenceText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
});
