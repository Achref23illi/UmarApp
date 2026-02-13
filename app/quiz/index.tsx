import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/config/colors';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/store/hooks';

export default function QuizEntryScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);

  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontBold = getFont(currentLanguage, 'bold');

  const tr = (key: string, fallback: string) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { fontFamily: fontBold, color: colors.text.primary }]}>
          {tr('quiz.v2.duo_title', 'Duo Online')}
        </Text>
        <Text style={[styles.subtitle, { fontFamily: fontRegular, color: colors.text.secondary }]}>
          {tr('quiz.v2.duo_desc', 'Create or join a backend-driven live room.')}
        </Text>

        <Pressable
          style={[styles.actionButton, { backgroundColor: Colors.palette.purple.primary }]}
          onPress={() => router.push({ pathname: '/quiz/game-settings', params: { mode: 'duo' } })}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={[styles.actionText, { fontFamily: fontMedium }]}>
            {tr('quiz.v2.create_room', 'Create room')}
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.actionButton,
            styles.secondaryButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => router.push('/quiz/join-room')}
        >
          <Ionicons name="log-in-outline" size={20} color={colors.text.primary} />
          <Text
            style={[styles.secondaryText, { fontFamily: fontMedium, color: colors.text.primary }]}
          >
            {tr('quiz.v2.join_room', 'Join room')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 14,
  },
  title: {
    fontSize: 30,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  actionButton: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  actionText: {
    color: '#fff',
    fontSize: 15,
  },
  secondaryText: {
    fontSize: 15,
  },
});
