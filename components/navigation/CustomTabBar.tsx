/**
 * Custom Tab Bar
 * ==============
 * Simple bottom tab bar without floating center button.
 */

import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';

const TAB_BAR_HEIGHT = 70;

interface TabItem {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconOutline: keyof typeof Ionicons.glyphMap;
  label: string;
}

const TABS: TabItem[] = [
  { name: 'index', icon: 'home', iconOutline: 'home-outline', label: 'Home' },
  { name: 'agenda', icon: 'calendar', iconOutline: 'calendar-outline', label: 'Agenda' },
  { name: 'challenges', icon: 'flame', iconOutline: 'flame-outline', label: 'Challenges' },
  { name: 'quizz', icon: 'school', iconOutline: 'school-outline', label: 'Quizz' },
  { name: 'salat', icon: 'time', iconOutline: 'time-outline', label: 'Salat' },
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

  // Hide tab bar on salat screen
  const currentRoute = state.routes[state.index];
  if (currentRoute?.name === 'salat') {
    return null;
  }

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
    <View 
      style={[
        styles.container, 
        { 
          bottom: 0,
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          shadowColor: isDark ? '#000' : '#8B3DB8',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'transparent',
          borderWidth: isDark ? 1 : 0,
        }
      ]}
    >
      <View style={styles.tabBar}>
          {TABS.map((tab) => {
              const focused = isFocused(tab.name);
              return (
                  <Pressable
                      key={tab.name}
                      style={styles.tabItem}
                      onPress={() => handleTabPress(tab.name)}
                  >
                      <Ionicons
                          name={focused ? tab.icon : tab.iconOutline}
                          size={22}
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
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 0,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    height: TAB_BAR_HEIGHT,
    paddingHorizontal: 16,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    minWidth: 60,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
    fontFamily: Fonts.medium,
  },
});

export default CustomTabBar;
