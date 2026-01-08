import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { getFont } from '@/hooks/use-fonts';
import { useAppSelector } from '@/store/hooks';

type ToastType = 'success' | 'info' | 'error';

interface ToastPayload {
  message: string;
  type?: ToastType;
}

// Simple event emitter for React Native
class SimpleEventEmitter {
  private listeners: Map<string, Set<(payload: ToastPayload) => void>> = new Map();

  on(event: string, listener: (payload: ToastPayload) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: (payload: ToastPayload) => void) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  emit(event: string, payload: ToastPayload) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => listener(payload));
    }
  }
}

const emitter = new SimpleEventEmitter();

export const toast = {
  show: (payload: ToastPayload) => emitter.emit('show', payload),
};

export function ToastHost() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const fontMedium = getFont(currentLanguage, 'medium');

  const [message, setMessage] = useState<string>('');
  const [type, setType] = useState<ToastType>('info');
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    const listener = (payload: ToastPayload) => {
      setMessage(payload.message);
      setType(payload.type || 'info');
      setVisible(true);

      Animated.timing(translateY, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -100,
          duration: 160,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }).start(() => setVisible(false));
      }, 2200);
    };

    emitter.on('show', listener);
    return () => {
      emitter.off('show', listener);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [translateY]);

  if (!visible) return null;

  const palette: Record<ToastType, { bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
    success: { bg: '#0EA968', icon: 'checkmark-circle' },
    info: { bg: colors.primary, icon: 'information-circle' },
    error: { bg: '#EF4444', icon: 'alert-circle' },
  };

  const tone = palette[type] || palette.info;

  return (
    <Animated.View style={[styles.container, { top: insets.top + 12, transform: [{ translateY }] }]}>
      <View style={[styles.toast, { backgroundColor: tone.bg }]}>
        <Ionicons name={tone.icon} size={18} color="#fff" style={{ marginRight: 8 }} />
        <Text style={[styles.text, { fontFamily: fontMedium }]} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 2000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  text: {
    color: '#fff',
    fontSize: 13,
    flex: 1,
  },
});
