/**
 * Tab Layout
 * ==========
 * Main tab navigation with custom tab bar featuring
 * a center action button for the rotary dial selector.
 */

import { Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { CustomTabBar } from '@/components/navigation';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={(props) => (
          <CustomTabBar
            state={props.state}
            navigation={props.navigation as never}
          />
        )}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('common.home'),
          }}
        />
        <Tabs.Screen
          name="quizzes"
          options={{
            title: 'Quizzes',
          }}
        />
        <Tabs.Screen
          name="mosques"
          options={{
            title: t('mosques.title'),
            tabBarStyle: { display: 'none' },
          }}
        />
        <Tabs.Screen
            name="settings"
            options={{
                title: t('settings.title'),
            }}
        />
        {/* Hide explore from tabs - accessed via rotary dial */}
        <Tabs.Screen
          name="explore"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
