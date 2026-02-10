
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MahramOathModal } from '@/components/challenges/MahramOathModal';
import { Colors } from '@/config/colors';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { User, socialService } from '@/services/socialService';
import { useAppSelector } from '@/store/hooks';

export default function QuizScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  
  // User State
  const currentUser = useAppSelector((state) => state.user);
  // Fallback if gender is not set
  const userGender = currentUser.gender || 'male'; 

  const fontRegular = getFont(currentLanguage, 'regular');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontBold = getFont(currentLanguage, 'bold');
  const fontSemiBold = getFont(currentLanguage, 'semiBold');

  // Logic State
  const [selectedOpponent, setSelectedOpponent] = useState<User | null>(null);
  const [oathVisible, setOathVisible] = useState(false);
  const [opponents, setOpponents] = useState<User[]>([]);
  const [isLoadingOpponents, setIsLoadingOpponents] = useState(true);
  const [opponentsError, setOpponentsError] = useState<string | null>(null);

  const loadOpponents = async () => {
    try {
      setIsLoadingOpponents(true);
      setOpponentsError(null);

      const { data, error } = await supabase
        .from('public_profiles')
        .select('id, full_name, avatar_url, gender, is_verified, updated_at')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const mapped = ((data ?? []) as any[])
        .filter((p) => p?.id && p.id !== currentUser.id)
        .map<User>((p) => ({
          id: p.id,
          name: p.full_name || 'User',
          avatar: p.avatar_url || `https://i.pravatar.cc/150?u=${encodeURIComponent(p.id)}`,
          isVerified: p.is_verified ?? undefined,
          gender: p.gender === 'female' ? 'female' : p.gender === 'male' ? 'male' : undefined,
        }));

      setOpponents(mapped);
    } catch (e) {
      console.error('Failed to load opponents:', e);
      setOpponents([]);
      setOpponentsError('Unable to load opponents');
    } finally {
      setIsLoadingOpponents(false);
    }
  };

  useEffect(() => {
    loadOpponents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id]);

  const handleChallenge = (opponent: User) => {
    setSelectedOpponent(opponent);

    if (userGender === opponent.gender) {
      startChallenge(opponent);
    } else {
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
    const success = await socialService.createMatch(opponent.id);
    
    if (success) {
        Alert.alert(
        t('quiz.challenges.sent'),
        t('quiz.challenges.sent_desc', { name: opponent.name }),
        [{ text: "OK" }]
        );
    } else {
        Alert.alert("Error", "Failed to send challenge. Please try again.");
    }
  };

  const renderUserItem = ({ item }: { item: User }) => {
    if (item.id === currentUser.id) return null;

    return (
      <View style={[styles.userCard, { backgroundColor: colors.surface, shadowColor: colors.text.primary }]}>
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
          style={[styles.challengeButton, { backgroundColor: Colors.palette.purple.primary }]}
          onPress={() => handleChallenge(item)}
        >
           <Text style={[styles.challengeText, { fontFamily: fontMedium }]}>{t('quiz.challenges.play')}</Text>
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
           {t('quiz.challenges.title')}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.titleContainer}>
        <Text style={[styles.pageTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
            {t('quiz.challenges.find_opponent')}
        </Text>
        <Text style={[styles.pageSubtitle, { fontFamily: fontRegular, color: colors.text.secondary }]}>
            {t('quiz.challenges.subtitle')}
        </Text>
      </View>

      {isLoadingOpponents ? (
        <View style={{ paddingVertical: 24, alignItems: 'center' }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : opponentsError ? (
        <View style={{ paddingHorizontal: 16, paddingVertical: 24, alignItems: 'center', gap: 12 }}>
          <Text style={{ color: colors.text.secondary, fontFamily: fontRegular }}>{opponentsError}</Text>
          <Pressable
            onPress={loadOpponents}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={{ color: colors.primary, fontFamily: fontSemiBold }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={opponents}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
      fontSize: 18,
  },
  titleContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 10,
  },
  pageTitle: {
    fontSize: 24,
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
    paddingTop: 10,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    borderRadius: 16,
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
    fontSize: 12,
    marginTop: 2,
  },
  challengeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  challengeText: {
    color: '#FFF',
    fontSize: 14,
  },
});
