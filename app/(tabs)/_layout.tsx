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
        <Tabs.Screen name="index" options={{ title: t('common.home') }} />
        <Tabs.Screen name="agenda" options={{ title: 'Agenda' }} />
        <Tabs.Screen name="challenges" options={{ title: 'Challenges' }} />
        <Tabs.Screen name="quizz" options={{ title: 'Quizz' }} />
        <Tabs.Screen name="salat" options={{ title: 'Salat' }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
