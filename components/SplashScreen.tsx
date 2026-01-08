import { Image } from 'expo-image';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { Images } from '@/config/assets';
import { Fonts } from '@/hooks/use-fonts';

interface SplashScreenProps {
  onFinish?: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Wait for 2.5 seconds then fade out
    const timeout = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 500 }, (finished) => {
        if (finished && onFinish) {
          // onFinish called nicely by runOnJS if needed, but here simple timeout works
        }
      });
      // Call onFinish after animation + buffer
      setTimeout(() => {
        onFinish?.();
      }, 500);
    }, 2500);

    return () => clearTimeout(timeout);
  }, []);

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <Image source={Images.splashBackground} style={StyleSheet.absoluteFillObject} contentFit="cover" />

      {/* Logo + Slogan */}
      <Animated.View entering={ZoomIn.duration(800)} style={styles.centerContent}>
        <Image source={Images.logo} style={styles.logo} contentFit="contain" />
        <Text style={styles.slogan}>Les portes du bien</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999, // Ensure it's on top of everything
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    zIndex: 10,
    width: 260,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 180,
    height: 180,
  },
  slogan: {
    marginTop: 12,
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    fontFamily: Fonts.medium,
  },
});
