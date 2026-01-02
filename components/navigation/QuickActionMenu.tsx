/**
 * Quick Action Menu
 * =================
 * A modern, glassmorphism-inspired quick action panel.
 * A modern, glassmorphism-inspired quick action panel.
 */

import i18n from '@/locales/i18n';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
    Dimensions,
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';

import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/store/hooks';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface QuickActionItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
  color: string;
  action?: () => void;
}

interface QuickActionMenuProps {
  visible: boolean;
  onClose: () => void;
}

export function QuickActionMenu({ visible, onClose }: QuickActionMenuProps) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const currentLanguage = useAppSelector(state => state.language.currentLanguage);
  const fontMedium = getFont(currentLanguage, 'medium');

  // Helper for translations
  const t = (key: string) => i18n.t(key, { locale: currentLanguage });

  // Animation Values
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(100);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withSpring(100, { damping: 20 });
    }
  }, [visible]);

  const handlePress = async (item: QuickActionItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (item.action) {
      item.action();
    } else if (item.route) {
      onClose();
      // Small delay to allow menu to close smoothly
        router.push(item.route as any);
    }
  };



  const ITEMS: QuickActionItem[] = [
    { id: 'quran', label: t('features.quran'), icon: 'book', route: '/quran', color: '#2E7D32' },
    { id: 'qibla', label: t('features.qibla'), icon: 'compass', route: '/qibla', color: '#F59E0B' },
    { id: 'dua', label: t('features.dua'), icon: 'book-outline', route: '/dua', color: '#8B5CF6' },
    { id: 'chat', label: t('features.chat'), icon: 'chatbubbles', route: '/chat', color: '#EC4899' },
    { id: 'events', label: t('features.events'), icon: 'calendar', route: '/events', color: '#00695C' },
    { id: 'features', label: t('features.buttonLabel'), icon: 'apps', route: '/features', color: '#7C3AED' },
  ];

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible && opacity.value === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      {visible && (
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
            <Animated.View style={[styles.backdrop, backdropStyle, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
        </Pressable>
      )}

      {/* Main Content - Floating Bottom Panel */}
      <View style={styles.centerContainer} pointerEvents="box-none">
        <Animated.View style={[
            styles.panel, 
            containerStyle,
            { backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)' } // High opacity for readability
        ]}>
            {/* Header / Grabber */}
            <View style={styles.header}>
                <View style={[styles.grabber, { backgroundColor: isDark ? '#4B5563' : '#E5E7EB' }]} />
            </View>

            <Text style={[styles.title, { color: colors.text.primary, fontFamily: fontMedium }]}>
                {t('common.quickActions')}
            </Text>

            <View style={styles.grid}>
                {ITEMS.map((item, index) => (
                    <Pressable
                        key={item.id}
                        style={({ pressed }) => [
                            styles.gridItem,
                            { 
                                backgroundColor: isDark ? '#374151' : '#F3F4F6',
                                transform: [{ scale: pressed ? 0.95 : 1 }]
                            }
                        ]}
                        onPress={() => handlePress(item)}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                            <Ionicons name={item.icon} size={28} color="#FFF" />
                        </View>
                        <Text style={[styles.label, { color: colors.text.primary, fontFamily: fontMedium }]}>
                            {item.label}
                        </Text>
                    </Pressable>
                ))}
            </View>
            
            {/* Close Button */}
             <Pressable style={[styles.closeButton, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]} onPress={onClose}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
            </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 100, // Above tab bar
  },
  panel: {
    width: SCREEN_WIDTH - 40,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  title: {
    fontSize: 18,
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  gridItem: {
    width: '47%', // 2 columns
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  label: {
    fontSize: 14,
    marginTop: 4,
  },
  closeButton: {
      marginTop: 20,
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
  }
});
