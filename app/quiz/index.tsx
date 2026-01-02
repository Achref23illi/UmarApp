
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MahramOathModal } from '@/components/challenges/MahramOathModal';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { MOCK_USERS, User, socialService } from '@/services/socialService';
import { useAppSelector } from '@/store/hooks';

export default function QuizScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  
  // User State
  const currentUser = useAppSelector((state) => state.user);
  // Fallback if gender is not set (e.g. mock or old profile)
  const userGender = currentUser.gender || 'male'; 

  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontBold = getFont(currentLanguage, 'bold');
  const fontSemiBold = getFont(currentLanguage, 'semiBold');

  // Logic State
  const [selectedOpponent, setSelectedOpponent] = useState<User | null>(null);
  const [oathVisible, setOathVisible] = useState(false);

  const handleChallenge = (opponent: User) => {
    setSelectedOpponent(opponent);

    if (userGender === opponent.gender) {
      // Same gender: Allow immediately
      startChallenge(opponent);
    } else {
      // Different gender: Require Oath
      setOathVisible(true);
    }
  };

  const confirmOath = () => {
    setOathVisible(false);
    if (selectedOpponent) {
      startChallenge(selectedOpponent);
    }
  };

  const startChallenge = async (opponent: User) => {
    // Optimistic UI update or wait for result
    const success = await socialService.createMatch(opponent.id);
    
    if (success) {
        Alert.alert(
        "Challenge Sent!",
        `You have challenged ${opponent.name}. Waiting for them to accept.`,
        [{ text: "OK" }]
        );
    } else {
        Alert.alert("Error", "Failed to send challenge. Please try again.");
    }
  };

  const renderUserItem = ({ item }: { item: User }) => {
    if (item.id === currentUser.id) return null; // Don't show self

    return (
      <View style={[styles.userCard, { backgroundColor: colors.surface }]}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} contentFit="cover" />
        <View style={styles.userInfo}>
           <Text style={[styles.userName, { fontFamily: fontBold, color: colors.text.primary }]}>
             {item.name}
           </Text>
           <Text style={[styles.userLevel, { fontFamily: fontRegular, color: colors.text.secondary }]}>
             Level 5 • {item.gender ? (item.gender === 'male' ? 'Brother' : 'Sister') : 'User'}
           </Text>
        </View>
        <Pressable 
          style={[styles.challengeButton, { backgroundColor: colors.primary }]}
          onPress={() => handleChallenge(item)}
        >
           <Text style={[styles.challengeText, { fontFamily: fontMedium }]}>{t('common.play') || "Play"}</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          onPress={() => router.back()} 
          style={[styles.backButton, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { fontFamily: fontSemiBold, color: colors.text.primary }]}>
           Challenges
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.titleContainer}>
        <Text style={[styles.pageTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
            Find an Opponent
        </Text>
        <Text style={[styles.pageSubtitle, { fontFamily: fontRegular, color: colors.text.secondary }]}>
            Challenge others in Quran & Sunnah quizzes.
        </Text>
      </View>

      <FlatList
        data={MOCK_USERS}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <MahramOathModal
        visible={oathVisible}
        onClose={() => setOathVisible(false)}
        onConfirm={confirmOath}
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
  },
  headerTitle: {
      fontSize: 18,
  },
  titleContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  pageTitle: {
    fontSize: 28,
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#DDD',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
  },
  userLevel: {
    fontSize: 13,
    marginTop: 2,
  },
  challengeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  challengeText: {
    color: '#FFF',
    fontSize: 14,
  },
});
