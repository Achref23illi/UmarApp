import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/hooks/use-theme';

interface NoConnectionScreenProps {
  onRetry: () => void;
  isRetrying?: boolean;
}

export default function NoConnectionScreen({ onRetry, isRetrying = false }: NoConnectionScreenProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  
  const pulse = useSharedValue(1);
  
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.1, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View 
      entering={FadeIn.duration(300)}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, iconStyle]}>
          <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(103, 15, 164, 0.2)' : 'rgba(103, 15, 164, 0.1)' }]}>
            <Ionicons name="cloud-offline" size={64} color={colors.primary} />
          </View>
        </Animated.View>
        
        <Text style={[styles.title, { color: colors.text.primary }]}>
          No Connection
        </Text>
        
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          Unable to connect to the server.{'\n'}Please check your internet connection.
        </Text>
        
        <Pressable
          onPress={onRetry}
          disabled={isRetrying}
          style={({ pressed }) => [
            styles.retryButton,
            { 
              backgroundColor: colors.primary,
              opacity: pressed ? 0.7 : (isRetrying ? 0.6 : 1),
            }
          ]}
        >
          {isRetrying ? (
            <Ionicons name="sync" size={20} color="#FFF" />
          ) : (
            <>
              <Ionicons name="refresh" size={20} color="#FFF" />
              <Text style={styles.retryText}>Try Again</Text>
            </>
          )}
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 30,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 40,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },
  retryText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
