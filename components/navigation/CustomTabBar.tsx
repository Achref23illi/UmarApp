/**
 * Custom Tab Bar
 * ==============
 * A custom tab bar with a floating center action button
 * that triggers the rotary dial selector.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
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
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';

import { QuickActionMenu } from './QuickActionMenu';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 70;
const CENTER_BUTTON_SIZE = 64;

interface TabItem {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconOutline: keyof typeof Ionicons.glyphMap;
  label: string;
}

const TABS: TabItem[] = [
  { name: 'index', icon: 'home', iconOutline: 'home-outline', label: 'Home' },
  { name: 'mosques', icon: 'map', iconOutline: 'map-outline', label: 'Mosques' },
  { name: 'quizzes', icon: 'ribbon', iconOutline: 'ribbon-outline', label: 'Quizzes' },
  { name: 'settings', icon: 'settings', iconOutline: 'settings-outline', label: 'Settings' },
];

interface CustomTabBarProps {
  state: {
    index: number;
    routes: { name: string; key: string }[];
  };
  navigation: {
    navigate: (name: string) => void;
    emit: (event: { type: string; target: string; canPreventDefault: boolean }) => { defaultPrevented: boolean };
  };
}

export function CustomTabBar({ state, navigation }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [dialVisible, setDialVisible] = useState(false);
  const centerButtonScale = useSharedValue(1);

  const handleCenterPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    centerButtonScale.value = withSpring(0.9, { damping: 15 }, () => {
      centerButtonScale.value = withSpring(1, { damping: 10 });
    });
    setDialVisible(!dialVisible);
  };

  const centerButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: centerButtonScale.value }],
  }));

  const handleTabPress = (routeName: string) => {
    // Find route index in state
    const tabIndex = state.routes.findIndex(r => r.name === routeName);
    if (tabIndex === -1) {
        // If route not found in state (shouldn't happen for active tabs), just navigate
       navigation.navigate(routeName);
       return;
    }

    const event = navigation.emit({
      type: 'tabPress',
      target: state.routes[tabIndex]?.key || '',
      canPreventDefault: true,
    });

    if (!event.defaultPrevented && state.index !== tabIndex) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.navigate(routeName);
    }
  };

  // Helper to check if tab is active
  const isFocused = (name: string) => {
      const currentRoute = state.routes[state.index];
      return currentRoute?.name === name;
  };

  return (
    <>
      {/* Quick Action Overlay */}
      <QuickActionMenu
        visible={dialVisible}
        onClose={() => setDialVisible(false)}
      />

      {/* Tab Bar Container */}
      <View 
        style={[
          styles.container, 
          { 
            bottom: insets.bottom + 20,
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            shadowColor: isDark ? '#000' : '#8B3DB8',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'transparent',
            borderWidth: isDark ? 1 : 0,
          }
        ]}
      >
        <View style={styles.tabBar}>
            {/* Left Tabs */}
            <View style={styles.sideTabs}>
                {TABS.slice(0, 2).map((tab) => {
                    const focused = isFocused(tab.name);
                    return (
                        <Pressable
                            key={tab.name}
                            style={styles.tabItem}
                            onPress={() => handleTabPress(tab.name)}
                        >
                            <Ionicons
                                name={focused ? tab.icon : tab.iconOutline}
                                size={24}
                                color={focused ? colors.primary : (isDark ? colors.gray[400] : '#9CA3AF')}
                            />
                            <Text
                                style={[
                                    styles.tabLabel,
                                    { color: focused ? colors.primary : (isDark ? colors.gray[400] : '#9CA3AF') },
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

          {/* Center Button */}
          <View style={styles.centerContainer}>
            <Animated.View style={[styles.centerButtonWrapper, centerButtonStyle]}>
              <Pressable 
                style={[
                    styles.centerButton, 
                    { 
                        backgroundColor: colors.surface, 
                        borderColor: colors.surface
                    }
                ]} 
                onPress={handleCenterPress}
              >
                <LinearGradient
                    colors={['#F5C661', '#F59E0B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.centerButtonGradient}
                >
                  <Ionicons name="grid-outline" size={28} color="#FFF" />
                </LinearGradient>
              </Pressable>
            </Animated.View>
          </View>

          {/* Right Tabs */}
          <View style={styles.sideTabs}>
             {/* Only Profile for now, but configured to support more */}
             {TABS.slice(2).map((tab) => {
                    const focused = isFocused(tab.name);
                    return (
                        <Pressable
                            key={tab.name}
                            style={styles.tabItem}
                            onPress={() => handleTabPress(tab.name)}
                        >
                            <Ionicons
                                name={focused ? tab.icon : tab.iconOutline}
                                size={24}
                                color={focused ? colors.primary : (isDark ? colors.gray[400] : '#9CA3AF')}
                            />
                            <Text
                                style={[
                                    styles.tabLabel,
                                    { color: focused ? colors.primary : (isDark ? colors.gray[400] : '#9CA3AF') },
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </Pressable>
                    );
                })}
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 35,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: TAB_BAR_HEIGHT,
    paddingHorizontal: 10,
  },
  sideTabs: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minWidth: 50,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    fontFamily: Fonts.medium,
  },
  centerContainer: {
    width: 80,
    alignItems: 'center',
    marginTop: -45, // Pulling it up out of the floating bar
  },
  centerButtonWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  centerButton: {
    width: CENTER_BUTTON_SIZE,
    height: CENTER_BUTTON_SIZE,
    borderRadius: CENTER_BUTTON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4, 
    // Shadow for the button itself to make it pop
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  centerButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: CENTER_BUTTON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CustomTabBar;
