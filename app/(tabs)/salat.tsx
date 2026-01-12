/**
 * Salat Screen
 * =============
 * Main salat screen with custom tab navigation for Prayer Times, Qibla, and Mosques
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/store/hooks';

import { MosquesTab } from './salat/MosquesTab';
import { PrayerTimesTab } from './salat/PrayerTimesTab';
import { QiblaTab } from './salat/QiblaTab';

type TabType = 'prayer' | 'qibla' | 'mosques';

export default function SalatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  
  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontSemiBold = getFont(currentLanguage, 'semiBold');

  const [activeTab, setActiveTab] = useState<TabType>('prayer');

  const tabs: { id: TabType; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { id: 'prayer', icon: 'time-outline', label: 'Salat' },
    { id: 'qibla', icon: 'compass-outline', label: 'Qibla' },
    { id: 'mosques', icon: 'business-outline', label: 'Mosques' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'prayer':
        return <PrayerTimesTab />;
      case 'qibla':
        return <QiblaTab />;
      case 'mosques':
        return <MosquesTab />;
      default:
        return <PrayerTimesTab />;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Back Button */}
      <View style={[styles.header, { paddingTop: insets.top + 8, paddingBottom: 12 }]}>
        <Pressable 
          onPress={() => router.back()} 
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <View style={{ flex: 1 }} />
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>

      {/* Custom Tab Bar */}
      <View 
        style={[
          styles.tabBar, 
          { 
            backgroundColor: colors.surface,
            paddingBottom: insets.bottom + 8,
            borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          }
        ]}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={styles.tabItem}
            >
              <View style={[
                styles.tabIconContainer,
                isActive && { backgroundColor: colors.primary + '20' }
              ]}>
                <Ionicons
                  name={isActive ? tab.icon.replace('-outline', '') : tab.icon}
                  size={24}
                  color={isActive ? colors.primary : colors.text.secondary}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
