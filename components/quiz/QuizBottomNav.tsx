/**
 * Quiz Bottom Navigation Component
 * =================================
 * Reusable bottom navigation for quiz setup screens
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFont } from '@/hooks/use-fonts';
import { useAppSelector } from '@/store/hooks';

interface QuizBottomNavProps {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
}

export function QuizBottomNav({
  onBack,
  onNext,
  nextLabel = 'Suivant',
  backLabel = 'Revenir',
  nextDisabled = false,
}: QuizBottomNavProps) {
  const insets = useSafeAreaInsets();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const fontMedium = getFont(currentLanguage, 'medium');

  return (
    <View style={[styles.bottomNav, { paddingBottom: insets.bottom + 20 }]}>
      <Pressable
        style={styles.navButton}
        onPress={onBack}
      >
        <Text style={[styles.navButtonTextBack, { fontFamily: fontMedium }]}>
          {backLabel}
        </Text>
      </Pressable>
      
      <Pressable
        style={[
          styles.navButton,
          styles.navButtonNext,
          nextDisabled && styles.navButtonDisabled
        ]}
        onPress={onNext}
        disabled={nextDisabled}
      >
        <Text style={[styles.navButtonTextNext, { fontFamily: fontMedium }]}>
          {nextLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  navButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  navButtonNext: {
    backgroundColor: '#FCD34D',
  },
  navButtonDisabled: {
    backgroundColor: '#E5E7EB',
    opacity: 0.6,
  },
  navButtonTextBack: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  navButtonTextNext: {
    fontSize: 16,
    color: '#374151',
  },
});
