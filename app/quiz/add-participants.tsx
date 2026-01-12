/**
 * Quiz Add Participants Screen (Real-time Mode)
 * ==============================================
 * Add participants by username for real-time quiz
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, Alert } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QuizBottomNav } from '@/components/quiz/QuizBottomNav';
import { QuizHeader } from '@/components/quiz/QuizHeader';
import { getFont } from '@/hooks/use-fonts';
import { useAppSelector } from '@/store/hooks';

interface Participant {
  id: string;
  username: string;
}

export default function AddParticipantsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);

  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  const [username, setUsername] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);

  const handleAddParticipant = () => {
    if (username.trim() === '') {
      Alert.alert('Erreur', 'Veuillez entrer un nom d\'utilisateur');
      return;
    }

    // Check if user already added
    if (participants.some(p => p.username.toLowerCase() === username.toLowerCase())) {
      Alert.alert('Erreur', 'Cet utilisateur est déjà ajouté');
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
      Alert.alert('Erreur', 'Veuillez ajouter au moins un participant');
      return;
    }
    // Navigate to level/theme selection
    router.push({
      pathname: '/quiz/setup-game',
      params: { participantCount: participants.length.toString() }
    });
  };

  return (
    <View style={styles.container}>
      {/* Background Pattern */}
      <Image
        source={require('@/assets/images/quizz_background.png')}
        style={styles.backgroundImage}
        contentFit="cover"
      />

      {/* Header */}
      <QuizHeader />

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Username Section */}
        <View style={styles.addSection}>
          <Text style={[styles.addTitle, { fontFamily: fontRegular }]}>
            Ajouter :
          </Text>
          <Text style={styles.emoji}>😊</Text>
        </View>

        {/* Username Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={32} color="#D1D5DB" />
            </View>
            
            <TextInput
              style={[styles.input, { fontFamily: fontRegular }]}
              placeholder="Nom d'utilisateur"
              placeholderTextColor="#9CA3AF"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleAddParticipant}
            />
            
            <Pressable
              style={styles.validateButton}
              onPress={handleAddParticipant}
            >
              <Text style={[styles.validateButtonText, { fontFamily: fontMedium }]}>
                Valider
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Participants List */}
        {participants.length > 0 && (
          <View style={styles.participantsSection}>
            <Text style={[styles.participantsTitle, { fontFamily: fontMedium }]}>
              Participants ajoutés ({participants.length})
            </Text>
            
            <View style={styles.participantsList}>
              {participants.map((participant, index) => (
                <Animated.View
                  key={participant.id}
                  entering={FadeInDown.delay(index * 50).springify()}
                >
                  <View style={styles.participantCard}>
                    <View style={styles.participantAvatar}>
                      <Ionicons name="person" size={24} color="#8B5CF6" />
                    </View>
                    
                    <Text style={[styles.participantName, { fontFamily: fontMedium }]}>
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
        style={[styles.floatingButton, { bottom: insets.bottom + 110 }]}
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
    backgroundColor: '#F5F5F5',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  addSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  addTitle: {
    fontSize: 24,
    color: '#374151',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 32,
  },
  inputContainer: {
    marginBottom: 30,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    paddingVertical: 8,
  },
  validateButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    backgroundColor: 'transparent',
  },
  validateButtonText: {
    fontSize: 14,
    color: '#8B5CF6',
  },
  participantsSection: {
    marginTop: 20,
  },
  participantsTitle: {
    fontSize: 18,
    color: '#374151',
    marginBottom: 16,
  },
  participantsList: {
    gap: 12,
  },
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantName: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
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
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
