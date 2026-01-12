/**
 * Game Settings Screen
 * ====================
 * Configure quiz settings before starting: response time, questions, jokers, helps
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFont } from '@/hooks/use-fonts';
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
    // Navigate to quiz game with settings
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
      label: 'Temps de réponse',
      icon: 'time-outline',
      value: `${settings.responseTime} sec`,
      options: [15, 30, 45, 60],
      current: settings.responseTime,
    },
    {
      id: 'numberOfQuestions',
      label: 'Nombre de question',
      icon: 'help-circle-outline',
      value: settings.numberOfQuestions.toString(),
      options: [10, 20, 30, 40],
      current: settings.numberOfQuestions,
    },
    {
      id: 'numberOfJokers',
      label: 'Nombre de joker',
      icon: 'happy-outline',
      value: settings.numberOfJokers.toString(),
      options: [0, 1, 2, 3],
      current: settings.numberOfJokers,
    },
    {
      id: 'numberOfHelps',
      label: "Nombre d'aide",
      icon: 'lifebuoy-outline',
      value: settings.numberOfHelps.toString(),
      options: [0, 1, 2, 3],
      current: settings.numberOfHelps,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Background Pattern */}
      <Image
        source={require('@/assets/images/quizz_background.png')}
        style={styles.backgroundImage}
        contentFit="cover"
      />

      {/* Curved Header */}
      <View style={styles.curvedHeader}>
        <LinearGradient
          colors={['#7C3AED', '#A855F7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <Ionicons name="star" size={60} color="#FCD34D" style={styles.starLeft} />
          <Ionicons name="star" size={40} color="#FCD34D" style={styles.starRight} />
          
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <View style={styles.logoContainer}>
              <Ionicons name="settings-outline" size={48} color="#FFFFFF" />
              <Text style={[styles.logo, { fontFamily: fontBold }]}>Paramètre de jeu</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Settings List */}
        <View style={styles.settingsList}>
          {settingsList.map((setting) => (
            <View key={setting.id} style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name={setting.icon as any} size={24} color="#374151" />
                <Text style={[styles.settingLabel, { fontFamily: fontRegular }]}>
                  {setting.label}
                </Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={[styles.settingValue, { fontFamily: fontBold }]}>
                  {setting.value}
                </Text>
                <View style={styles.valueButtons}>
                  <Pressable
                    style={styles.valueButton}
                    onPress={() => {
                      const currentIndex = setting.options.indexOf(setting.current);
                      const prevIndex = Math.max(0, currentIndex - 1);
                      updateSetting(setting.id as keyof GameSettings, setting.options[prevIndex]);
                    }}
                  >
                    <Ionicons name="remove" size={20} color="#6B7280" />
                  </Pressable>
                  <Pressable
                    style={styles.valueButton}
                    onPress={() => {
                      const currentIndex = setting.options.indexOf(setting.current);
                      const nextIndex = Math.min(setting.options.length - 1, currentIndex + 1);
                      updateSetting(setting.id as keyof GameSettings, setting.options[nextIndex]);
                    }}
                  >
                    <Ionicons name="add" size={20} color="#6B7280" />
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={[styles.backButtonText, { fontFamily: fontMedium }]}>
              Revenir
            </Text>
          </Pressable>
          <Pressable
            style={styles.startButton}
            onPress={handleStart}
          >
            <LinearGradient
              colors={['#FCD34D', '#F59E0B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.startButtonGradient}
            >
              <Text style={[styles.startButtonText, { fontFamily: fontMedium }]}>
                Commencer
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.4,
  },
  curvedHeader: {
    width: '100%',
    height: 200,
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
    paddingBottom: 30,
    position: 'relative',
  },
  starLeft: {
    position: 'absolute',
    top: 30,
    left: 80,
    opacity: 0.9,
    transform: [{ rotate: '-15deg' }],
  },
  starRight: {
    position: 'absolute',
    top: 20,
    right: 60,
    opacity: 0.9,
    transform: [{ rotate: '15deg' }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
    color: '#FFFFFF',
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  settingsList: {
    gap: 24,
    marginBottom: 40,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#374151',
  },
  settingRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  settingValue: {
    fontSize: 18,
    color: '#374151',
  },
  valueButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  valueButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonText: {
    fontSize: 16,
    color: '#F59E0B',
  },
  startButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  startButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});
