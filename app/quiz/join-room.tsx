import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/config/colors';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { quizSessionService } from '@/services/quizSessionService';
import { useAppSelector } from '@/store/hooks';

export default function JoinRoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const currentUser = useAppSelector((state) => state.user);

  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  const [accessCode, setAccessCode] = useState('');
  const [displayName, setDisplayName] = useState(currentUser.name || 'Player');
  const [isJoining, setIsJoining] = useState(false);

  const canJoin = useMemo(
    () => accessCode.trim().length >= 4 && displayName.trim().length >= 2,
    [accessCode, displayName]
  );

  const tr = (key: string, fallback: string) => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };

  const handleJoin = async () => {
    if (!canJoin || isJoining) return;

    try {
      setIsJoining(true);
      const result = await quizSessionService.joinSessionByCode(
        accessCode.trim().toUpperCase(),
        displayName.trim()
      );

      if (result.state === 'in_progress') {
        router.replace({ pathname: '/quiz/game', params: { sessionId: result.sessionId } });
      } else {
        router.replace({ pathname: '/quiz/lobby', params: { sessionId: result.sessionId } });
      }
    } catch (error: any) {
      console.error('Failed to join quiz room', error);
      Alert.alert(
        'Join failed',
        error?.message || 'Unable to join room. Verify the room code and retry.'
      );
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { fontFamily: fontBold, color: colors.text.primary }]}>
          {tr('quiz.v2.join_room', 'Join room')}
        </Text>
        <Text style={[styles.subtitle, { fontFamily: fontRegular, color: colors.text.secondary }]}>
          {tr('quiz.v2.join_room_desc', 'Enter the 6-character room code and your display name.')}
        </Text>

        <Text style={[styles.label, { fontFamily: fontMedium, color: colors.text.secondary }]}>
          {tr('quiz.settings.room_code', 'Room code')}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text.primary,
              fontFamily: fontBold,
            },
          ]}
          autoCapitalize="characters"
          autoCorrect={false}
          value={accessCode}
          onChangeText={(value) =>
            setAccessCode(
              value
                .replace(/[^a-zA-Z0-9]/g, '')
                .slice(0, 6)
                .toUpperCase()
            )
          }
          placeholder="ABC123"
          placeholderTextColor={colors.text.secondary}
        />

        <Text style={[styles.label, { fontFamily: fontMedium, color: colors.text.secondary }]}>
          {tr('quiz.settings.display_name', 'Display name')}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              color: colors.text.primary,
              fontFamily: fontRegular,
            },
          ]}
          autoCapitalize="words"
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your name"
          placeholderTextColor={colors.text.secondary}
        />

        <Pressable
          onPress={handleJoin}
          style={[
            styles.joinButton,
            {
              backgroundColor: canJoin ? Colors.palette.purple.primary : colors.text.disabled,
              opacity: isJoining ? 0.75 : 1,
            },
          ]}
          disabled={!canJoin || isJoining}
        >
          {isJoining ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.joinButtonText, { fontFamily: fontBold }]}>
              {tr('quiz.v2.join_now', 'Join now')}
            </Text>
          )}
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
    paddingVertical: 10,
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
    paddingTop: 20,
  },
  title: {
    fontSize: 30,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 28,
  },
  label: {
    fontSize: 13,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 18,
    marginBottom: 16,
  },
  joinButton: {
    marginTop: 10,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
