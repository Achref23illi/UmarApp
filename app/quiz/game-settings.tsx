/**
 * Game Settings Screen
 * ====================
 * Configure quiz settings before starting: response time, questions, jokers, helps
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/config/colors';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/store/hooks';

interface GameSettings {
  responseTime: number; // in seconds
  numberOfQuestions: number;
  numberOfJokers: number;
  numberOfHelps: number;
}

export default function GameSettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors } = useTheme();
  
  const { theme, level } = useLocalSearchParams<{ theme?: string; level?: string }>();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);

  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  const [settings, setSettings] = useState<GameSettings>({
    responseTime: 30,
    numberOfQuestions: 20,
    numberOfJokers: 1,
    numberOfHelps: 3,
  });

  const handleStart = () => {
    router.push({
      pathname: '/quiz/game',
      params: {
        theme: theme || 'Histoire',
        level: level || 'intermediaire',
        responseTime: settings.responseTime.toString(),
        numberOfQuestions: settings.numberOfQuestions.toString(),
        numberOfJokers: settings.numberOfJokers.toString(),
        numberOfHelps: settings.numberOfHelps.toString(),
      },
    });
  };

  const updateSetting = (key: keyof GameSettings, value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const settingsList = [
    {
      id: 'responseTime',
      label: t('quiz.settings.response_time'),
      icon: 'time-outline',
      value: `${settings.responseTime} sec`,
      options: [15, 30, 45, 60],
      current: settings.responseTime,
    },
    {
      id: 'numberOfQuestions',
      label: t('quiz.settings.questions_count'),
      icon: 'help-circle-outline',
      value: settings.numberOfQuestions.toString(),
      options: [10, 20, 30, 40],
      current: settings.numberOfQuestions,
    },
    {
      id: 'numberOfJokers',
      label: t('quiz.settings.jokers_count'),
      icon: 'happy-outline',
      value: settings.numberOfJokers.toString(),
      options: [0, 1, 2, 3],
      current: settings.numberOfJokers,
    },
    {
      id: 'numberOfHelps',
      label: t('quiz.settings.helps_count'),
      icon: 'bulb-outline',
      value: settings.numberOfHelps.toString(),
      options: [0, 1, 2, 3],
      current: settings.numberOfHelps,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          onPress={() => router.back()} 
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
            {t('quiz.settings.title')}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Settings List */}
        <View style={styles.settingsList}>
          {settingsList.map((setting) => (
            <View 
                key={setting.id} 
                style={[styles.settingItem, { backgroundColor: colors.surface, shadowColor: colors.text.primary }]}
            >
              <View style={styles.settingLeft}>
                <Ionicons name={setting.icon as any} size={24} color={colors.text.secondary} />
                <Text style={[styles.settingLabel, { fontFamily: fontRegular, color: colors.text.primary }]}>
                  {setting.label}
                </Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={[styles.settingValue, { fontFamily: fontBold, color: Colors.palette.purple.primary }]}>
                  {setting.value}
                </Text>
                <View style={styles.valueButtons}>
                  <Pressable
                    style={[styles.valueButton, { backgroundColor: colors.surfaceHighlight || '#F3F4F6' }]}
                    onPress={() => {
                      const currentIndex = setting.options.indexOf(setting.current);
                      const prevIndex = Math.max(0, currentIndex - 1);
                      updateSetting(setting.id as keyof GameSettings, setting.options[prevIndex]);
                    }}
                  >
                    <Ionicons name="remove" size={20} color={colors.text.secondary} />
                  </Pressable>
                  <Pressable
                    style={[styles.valueButton, { backgroundColor: colors.surfaceHighlight || '#F3F4F6' }]}
                    onPress={() => {
                      const currentIndex = setting.options.indexOf(setting.current);
                      const nextIndex = Math.min(setting.options.length - 1, currentIndex + 1);
                      updateSetting(setting.id as keyof GameSettings, setting.options[nextIndex]);
                    }}
                  >
                    <Ionicons name="add" size={20} color={colors.text.secondary} />
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Pressable
            style={[styles.actionButton, styles.backActionButton, { backgroundColor: colors.surface, borderColor: colors.surfaceHighlight || '#E5E7EB' }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.actionButtonText, { fontFamily: fontMedium, color: colors.text.secondary }]}>
              {t('quiz.back')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, styles.startButton, { backgroundColor: Colors.palette.purple.primary }]}
            onPress={handleStart}
          >
             <Text style={[styles.actionButtonText, { fontFamily: fontMedium, color: '#FFFFFF' }]}>
                {t('quiz.settings.start')}
             </Text>
          </Pressable>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  settingsList: {
    gap: 16,
    marginBottom: 40,
  },
  settingItem: {
    flexDirection: 'column',
    gap: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  settingValue: {
    fontSize: 18,
  },
  valueButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  valueButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backActionButton: {
    borderWidth: 1,
  },
  startButton: {
  },
  actionButtonText: {
    fontSize: 16,
  },
});
