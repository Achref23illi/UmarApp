import { Image } from 'expo-image';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  ZoomIn
} from 'react-native-reanimated';

import { Images, Svgs } from '@/config/assets';

const { width, height } = Dimensions.get('window');

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
      {/* Background Color */}
      <View style={styles.background} />

      {/* Mosque Silhouette - Bottom Left, Low Opacity */}
      <View style={styles.mosqueContainer}>
        <Svgs.mosque width={width * 0.8} height={width * 0.8} style={styles.mosque} />
      </View>

      {/* Geometric Pattern - Overlay */}
      <View style={styles.geometricContainer}>
        <Svgs.geometric width={width} height={height} style={styles.geometric} />
      </View>

      {/* Logo - Center */}
      <Animated.View entering={ZoomIn.duration(800)} style={styles.logoContainer}>
        <Image source={Images.logo} style={styles.logo} contentFit="contain" />
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
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F5F5F5',
  },
  mosqueContainer: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    opacity: 0.15, // Low opacity as requested
    zIndex: 1,
  },
  mosque: {
    color: '#000', // Or a darker shade of the background
  },
  geometricContainer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1, // Subtle pattern
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  geometric: {
    color: '#000',
  },
  logoContainer: {
    zIndex: 10,
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    // Removed white background and shadows
  },
  logo: {
    width: 200,
    height: 200,
  },
});
