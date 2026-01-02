/**
 * Date Converter Screen
 * ======================
 * Convert between Gregorian and Hijri dates.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/store/hooks';

export default function DateConverterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  
  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontSemiBold = getFont(currentLanguage, 'semiBold');
  const fontBold = getFont(currentLanguage, 'bold');

  const [mode, setMode] = useState<'gToH' | 'hToG'>('gToH');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [result, setResult] = useState<{ day: string; month: string; year: string; weekday: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async () => {
    if (!day || !month || !year) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const dateStr = `${day}-${month}-${year}`;
      const endpoint = mode === 'gToH' 
        ? `https://api.aladhan.com/v1/gToH/${dateStr}`
        : `https://api.aladhan.com/v1/hToG/${dateStr}`;
      
      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.code === 200) {
        const resultDate = mode === 'gToH' ? data.data.hijri : data.data.gregorian;
        setResult({
          day: resultDate.day,
          month: resultDate.month.en || resultDate.month.number?.toString(),
          year: resultDate.year,
          weekday: resultDate.weekday?.en || '',
        });
      } else {
        setError('Invalid date. Please check your input.');
      }
    } catch (err) {
      setError('Conversion failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const swapMode = () => {
    setMode(prev => prev === 'gToH' ? 'hToG' : 'gToH');
    setDay('');
    setMonth('');
    setYear('');
    setResult(null);
    setError(null);
  };

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
          Date Converter
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Mode Selector */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.modeContainer}>
          <View style={[styles.modeCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modeText, { fontFamily: fontSemiBold, color: colors.text.primary }]}>
              {mode === 'gToH' ? 'Gregorian' : 'Hijri'}
            </Text>
          </View>
          
          <Pressable onPress={swapMode} style={styles.swapButton}>
            <LinearGradient
              colors={['#14B8A6', '#0D9488']}
              style={styles.swapGradient}
            >
              <Ionicons name="swap-horizontal" size={24} color="#FFF" />
            </LinearGradient>
          </Pressable>
          
          <View style={[styles.modeCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modeText, { fontFamily: fontSemiBold, color: colors.text.primary }]}>
              {mode === 'gToH' ? 'Hijri' : 'Gregorian'}
            </Text>
          </View>
        </Animated.View>

        {/* Input Fields */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.inputSection}>
          <Text style={[styles.inputLabel, { fontFamily: fontMedium, color: colors.text.secondary }]}>
            Enter {mode === 'gToH' ? 'Gregorian' : 'Hijri'} Date
          </Text>
          
          <View style={styles.inputRow}>
            <View style={styles.inputWrapper}>
              <Text style={[styles.fieldLabel, { fontFamily: fontMedium, color: colors.text.secondary }]}>Day</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text.primary, fontFamily: fontSemiBold }]}
                placeholder="DD"
                placeholderTextColor={colors.text.disabled}
                keyboardType="number-pad"
                maxLength={2}
                value={day}
                onChangeText={setDay}
              />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={[styles.fieldLabel, { fontFamily: fontMedium, color: colors.text.secondary }]}>Month</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text.primary, fontFamily: fontSemiBold }]}
                placeholder="MM"
                placeholderTextColor={colors.text.disabled}
                keyboardType="number-pad"
                maxLength={2}
                value={month}
                onChangeText={setMonth}
              />
            </View>
            <View style={[styles.inputWrapper, { flex: 1.5 }]}>
              <Text style={[styles.fieldLabel, { fontFamily: fontMedium, color: colors.text.secondary }]}>Year</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text.primary, fontFamily: fontSemiBold }]}
                placeholder="YYYY"
                placeholderTextColor={colors.text.disabled}
                keyboardType="number-pad"
                maxLength={4}
                value={year}
                onChangeText={setYear}
              />
            </View>
          </View>

          {error && (
            <Text style={[styles.errorText, { fontFamily: fontMedium }]}>{error}</Text>
          )}

          <Pressable onPress={handleConvert} style={[styles.convertButton, { backgroundColor: colors.primary }]}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="calculator" size={20} color="#FFF" />
                <Text style={[styles.convertText, { fontFamily: fontSemiBold }]}>Convert</Text>
              </>
            )}
          </Pressable>
        </Animated.View>

        {/* Result */}
        {result && (
          <Animated.View entering={FadeInUp.springify()}>
            <LinearGradient
              colors={isDark ? ['#374151', '#1F2937'] : ['#F9FAFB', '#F3F4F6']}
              style={styles.resultCard}
            >
              <Text style={[styles.resultLabel, { fontFamily: fontMedium, color: colors.text.secondary }]}>
                {mode === 'gToH' ? 'Hijri Date' : 'Gregorian Date'}
              </Text>
              {result.weekday && (
                <Text style={[styles.resultWeekday, { fontFamily: fontMedium, color: colors.secondary }]}>
                  {result.weekday}
                </Text>
              )}
              <Text style={[styles.resultDate, { fontFamily: fontBold, color: colors.text.primary }]}>
                {result.day} {result.month} {result.year}
              </Text>
              {mode === 'gToH' && (
                <Text style={[styles.resultSuffix, { fontFamily: fontMedium, color: colors.text.secondary }]}>
                  After Hijra (AH)
                </Text>
              )}
            </LinearGradient>
          </Animated.View>
        )}
      </ScrollView>
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
  headerTitle: {
    fontSize: 18,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
    gap: 16,
  },
  modeCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  modeText: {
    fontSize: 15,
  },
  swapButton: {
    zIndex: 1,
  },
  swapGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputWrapper: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    padding: 16,
    borderRadius: 12,
    fontSize: 18,
    textAlign: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  convertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 18,
    borderRadius: 16,
  },
  convertText: {
    color: '#FFF',
    fontSize: 16,
  },
  resultCard: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  resultWeekday: {
    fontSize: 14,
    marginBottom: 4,
  },
  resultDate: {
    fontSize: 28,
    textAlign: 'center',
  },
  resultSuffix: {
    fontSize: 14,
    marginTop: 8,
  },
});
