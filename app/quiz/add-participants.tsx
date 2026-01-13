/**
 * Quiz Add Participants Screen (Real-time Mode)
 * ==============================================
 * Add participants by username for real-time quiz
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QuizBottomNav } from '@/components/quiz/QuizBottomNav';
import { Colors } from '@/config/colors';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/store/hooks';

interface Participant {
  id: string;
  username: string;
}

export default function AddParticipantsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);

  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  const [username, setUsername] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);

  const handleAddParticipant = () => {
    if (username.trim() === '') {
      Alert.alert('Erreur', t('quiz.participants.error_empty'));
      return;
    }

    // Check if user already added
    if (participants.some(p => p.username.toLowerCase() === username.toLowerCase())) {
      Alert.alert('Erreur', t('quiz.participants.error_exists'));
      return;
    }

    const newParticipant: Participant = {
      id: Date.now().toString(),
      username: username.trim(),
    };

    setParticipants([...participants, newParticipant]);
    setUsername('');
  };

  const handleRemoveParticipant = (id: string) => {
    setParticipants(participants.filter(p => p.id !== id));
  };

  const handleNext = () => {
    if (participants.length === 0) {
      Alert.alert('Erreur', t('quiz.participants.error_min'));
      return;
    }
    // Navigate to level/theme selection
    router.push({
      pathname: '/quiz/setup-game',
      params: { participantCount: participants.length.toString() }
    });
  };

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
            {t('quiz.participants.title')}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Username Section */}
        <View style={styles.addSection}>
          <Text style={[styles.addTitle, { fontFamily: fontRegular, color: colors.text.primary }]}>
            {t('quiz.participants.add')} :
          </Text>
        </View>

        {/* Username Input */}
        <View style={styles.inputContainer}>
          <View style={[styles.inputRow, { backgroundColor: colors.surface, shadowColor: colors.text.primary }]}>
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceHighlight || '#F3F4F6' }]}>
              <Ionicons name="person" size={24} color={colors.icon} />
            </View>
            
            <TextInput
              style={[styles.input, { fontFamily: fontRegular, color: colors.text.primary }]}
              placeholder={t('quiz.participants.placeholder')}
              placeholderTextColor={colors.text.secondary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleAddParticipant}
            />
            
            <Pressable
              style={[styles.validateButton, { borderColor: Colors.palette.purple.primary }]}
              onPress={handleAddParticipant}
            >
              <Text style={[styles.validateButtonText, { fontFamily: fontMedium, color: Colors.palette.purple.primary }]}>
                {t('quiz.participants.validate')}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Participants List */}
        {participants.length > 0 && (
          <View style={styles.participantsSection}>
            <Text style={[styles.participantsTitle, { fontFamily: fontMedium, color: colors.text.secondary }]}>
              {t('quiz.participants.list_title')} ({participants.length})
            </Text>
            
            <View style={styles.participantsList}>
              {participants.map((participant, index) => (
                <Animated.View
                  key={participant.id}
                  entering={FadeInDown.delay(index * 50).springify()}
                >
                  <View style={[styles.participantCard, { backgroundColor: colors.surface, shadowColor: colors.text.primary }]}>
                    <View style={[styles.participantAvatar, { backgroundColor: colors.surfaceHighlight || '#F3F4F6' }]}>
                      <Ionicons name="person" size={20} color={Colors.palette.purple.primary} /> 
                    </View>
                    
                    <Text style={[styles.participantName, { fontFamily: fontMedium, color: colors.text.primary }]}>
                      {participant.username}
                    </Text>
                    
                    <Pressable
                      style={styles.removeButton}
                      onPress={() => handleRemoveParticipant(participant.id)}
                    >
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </Pressable>
                  </View>
                </Animated.View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Add Button */}
      <Pressable
        style={[styles.floatingButton, { bottom: insets.bottom + 110, backgroundColor: Colors.palette.purple.primary }]}
        onPress={handleAddParticipant}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </Pressable>

      {/* Custom Bottom Navigation */}
      <QuizBottomNav
        onBack={() => router.back()}
        onNext={handleNext}
      />
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
      fontSize: 18,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  addSection: {
    marginBottom: 20,
  },
  addTitle: {
    fontSize: 20,
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 30,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  validateButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  validateButtonText: {
    fontSize: 14,
  },
  participantsSection: {
    marginTop: 10,
  },
  participantsTitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  participantsList: {
    gap: 12,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  participantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantName: {
    flex: 1,
    fontSize: 16,
  },
  removeButton: {
    padding: 4,
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
