import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFont } from '@/hooks/use-fonts';
import { useAppSelector } from '@/store/hooks';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 60) / 2; // 2 cards per row with padding

export default function QuizzScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const currentUser = useAppSelector((state) => state.user);
  
  // Get user gender (default to male if not set)
  const userGender = currentUser.gender || 'male';
  
  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  // State for mode selection modal
  const [showModeModal, setShowModeModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  // Quiz modes
  const modes = [
    { 
      id: 'solo', 
      title: 'Solo', 
      icon: 'person',
      color: '#8B5CF6',
      route: '/quiz/level-selection' // Navigate to level selection
    },
    { 
      id: 'duo', 
      title: 'Duo', 
      icon: 'people',
      color: '#8B5CF6',
      route: '/quiz' // Navigate to find opponent
    },
    { 
      id: 'equipe', 
      title: 'Équipe', 
      icon: 'people',
      color: '#8B5CF6',
      route: '/challenge' // Team mode
    },
    { 
      id: 'groupe', 
      title: 'Groupe', 
      icon: 'people',
      color: '#8B5CF6',
      route: '/challenge' // Group mode
    },
  ];

  const handleModePress = (mode: typeof modes[0]) => {
    if (mode.id === 'solo') {
      // Solo goes to level selection
      router.push('/quiz/level-selection');
    } else {
      // Duo, Équipe, Groupe show the Présentiel/À distance modal
      setSelectedMode(mode.id);
      setShowModeModal(true);
    }
  };

  const handlePlayModeSelect = (playMode: 'presentiel' | 'distance') => {
    setShowModeModal(false);
    
    if (playMode === 'presentiel') {
      // Présentiel: Add participants in real-time mode
      router.push('/quiz/add-participants');
    } else {
      // À distance: Invite contacts
      router.push('/quiz/invite-contacts');
    }
  };

  // Render avatar based on gender and mode
  const renderAvatar = (mode: typeof modes[0]) => {
    const avatarSource = userGender === 'female' 
      ? require('@/assets/images/woman.png')
      : require('@/assets/images/man.png');

    const renderCount = mode.id === 'solo' ? 1 : mode.id === 'duo' ? 2 : mode.id === 'equipe' ? 4 : 6;

    // Layout configurations for different modes
    const layouts = {
      solo: [{ top: 40, left: '50%', transform: [{ translateX: -25 }] }],
      duo: [
        { top: 35, left: 20 },
        { top: 35, right: 20 },
      ],
      equipe: [
        { top: 25, left: 10 },
        { top: 25, right: 10 },
        { bottom: 25, left: 10 },
        { bottom: 25, right: 10 },
      ],
      groupe: [
        { top: 20, left: 15 },
        { top: 20, right: 15 },
        { top: 50, left: '50%', transform: [{ translateX: -20 }] },
        { bottom: 20, left: 5 },
        { bottom: 20, right: 5 },
        { bottom: 50, left: '50%', transform: [{ translateX: -20 }] },
      ],
    };

    return (
      <View style={styles.avatarContainer}>
        {layouts[mode.id as keyof typeof layouts].map((position, index) => (
          <Image
            key={index}
            source={avatarSource}
            style={[styles.avatar, position]}
            contentFit="contain"
          />
        ))}
        
        {/* VS text for duo and equipe */}
        {(mode.id === 'duo' || mode.id === 'equipe') && (
          <Text style={styles.vsText}>vs</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background Pattern Image */}
      <Image
        source={require('@/assets/images/quizz_background.png')}
        style={styles.backgroundImage}
        contentFit="cover"
      />

      {/* Decorative curved header */}
      <View style={styles.curvedHeader}>
        <LinearGradient
          colors={['#7C3AED', '#A855F7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          {/* Star decorations */}
          <Ionicons name="star" size={60} color="#FCD34D" style={styles.starLeft} />
          <Ionicons name="star" size={40} color="#FCD34D" style={styles.starRight} />
          
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <View style={styles.logoContainer}>
              <Text style={[styles.logo, { fontFamily: fontBold }]}>QUIZZ</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Welcome Message */}
      <View style={styles.welcomeContainer}>
        <Text style={[styles.welcomeText, { fontFamily: fontRegular }]}>
          Hello ! Vous souhaitez
        </Text>
        <Text style={[styles.welcomeText, { fontFamily: fontRegular }]}>
          participer en :
        </Text>
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>😊</Text>
        </View>
      </View>

      {/* Play Mode Selection Modal */}
      <Modal
        visible={showModeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            entering={FadeIn.duration(200)}
            style={styles.modalContent}
          >
            {/* Curved Header */}
            <View style={styles.modalCurvedHeader}>
              <LinearGradient
                colors={['#7C3AED', '#A855F7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalHeaderGradient}
              >
                <View style={styles.modalHeader}>
                  <View style={styles.modalLogoContainer}>
                    <Text style={[styles.modalLogo, { fontFamily: fontBold }]}>QUIZZ</Text>
                    <Ionicons name="star" size={28} color="#FCD34D" style={styles.starIcon} />
                  </View>
                  <Pressable onPress={() => setShowModeModal(false)}>
                    <Ionicons name="settings-outline" size={24} color="#FFF" />
                  </Pressable>
                </View>
              </LinearGradient>
            </View>

            {/* Modal Content */}
            <View style={styles.modalBody}>
              <Text style={[styles.modalTitle, { fontFamily: fontBold }]}>
                Mode de jeu :
              </Text>
              <View style={styles.modalEmojiContainer}>
                <Text style={styles.emoji}>😊</Text>
              </View>

              {/* Play Mode Cards */}
              <View style={styles.modalCardsContainer}>
                {/* Présentiel Card */}
                <Animated.View entering={FadeInDown.delay(100).springify()}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalCard,
                      { transform: [{ scale: pressed ? 0.95 : 1 }] }
                    ]}
                    onPress={() => handlePlayModeSelect('presentiel')}
                  >
                    <View style={styles.modalCardContent}>
                      {/* 3 avatars for Présentiel */}
                      <View style={styles.modalAvatarContainer}>
                        <Image
                          source={require('@/assets/images/man.png')}
                          style={[styles.modalAvatar, { top: 20, left: 10 }]}
                          contentFit="contain"
                        />
                        <Image
                          source={require('@/assets/images/man.png')}
                          style={[styles.modalAvatar, { top: 5, left: '50%', transform: [{ translateX: -25 }] }]}
                          contentFit="contain"
                        />
                        <Image
                          source={require('@/assets/images/man.png')}
                          style={[styles.modalAvatar, { top: 20, right: 10 }]}
                          contentFit="contain"
                        />
                      </View>
                      <Text style={[styles.modalCardTitle, { fontFamily: fontBold }]}>
                        Présentiel
                      </Text>
                    </View>
                  </Pressable>
                </Animated.View>

                {/* À distance Card */}
                <Animated.View entering={FadeInDown.delay(200).springify()}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modalCard,
                      { transform: [{ scale: pressed ? 0.95 : 1 }] }
                    ]}
                    onPress={() => handlePlayModeSelect('distance')}
                  >
                    <View style={styles.modalCardContent}>
                      {/* 2 avatars with phones for À distance */}
                      <View style={styles.modalAvatarContainer}>
                        <Image
                          source={require('@/assets/images/man_with_phone.png')}
                          style={[styles.modalAvatar, { top: 15, left: 20 }]}
                          contentFit="contain"
                        />
                        <Image
                          source={require('@/assets/images/man_with_phone_back.png')}
                          style={[styles.modalAvatar, { top: 15, right: 20 }]}
                          contentFit="contain"
                        />
                      </View>
                      <Text style={[styles.modalCardTitle, { fontFamily: fontBold }]}>
                        À distance
                      </Text>
                    </View>
                  </Pressable>
                </Animated.View>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Quiz Mode Cards */}
      <View style={styles.cardsContainer}>
        {modes.map((mode, index) => (
          <Animated.View
            key={mode.id}
            entering={FadeInDown.delay(index * 100).springify()}
          >
            <Pressable
              style={({ pressed }) => [
                styles.card,
                { transform: [{ scale: pressed ? 0.95 : 1 }] }
              ]}
              onPress={() => handleModePress(mode)}
            >
              <View style={styles.cardContent}>
                {renderAvatar(mode)}
                <Text style={[styles.cardTitle, { fontFamily: fontBold }]}>
                  {mode.title}
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        ))}
      </View>

      {/* Settings Button at Bottom */}
      <Pressable 
        style={[styles.settingsButtonBottom, { paddingBottom: insets.bottom + 16 }]}
        onPress={() => router.push('/settings')}
      >
        <Ionicons name="settings-outline" size={28} color="#7C3AED" />
      </Pressable>

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
    marginBottom: 20,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    color: '#FFFFFF',
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  settingsButtonBottom: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 20,
    color: '#374151',
    textAlign: 'center',
  },
  emojiContainer: {
    marginTop: 10,
  },
  emoji: {
    fontSize: 40,
  },
  cardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    backgroundColor: '#7C3AED',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  avatarContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    position: 'absolute',
    width: 50,
    height: 50,
  },
  vsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalCurvedHeader: {
    width: '100%',
    height: 160,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    overflow: 'hidden',
  },
  modalHeaderGradient: {
    flex: 1,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modalLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalLogo: {
    fontSize: 32,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  modalBody: {
    padding: 20,
    paddingTop: 10,
  },
  modalTitle: {
    fontSize: 24,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 5,
  },
  modalEmojiContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  modalCard: {
    width: (width * 0.9 - 60) / 2,
    height: (width * 0.9 - 60) / 2,
    backgroundColor: '#7C3AED',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  modalAvatarContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatar: {
    position: 'absolute',
    width: 50,
    height: 50,
  },
  modalCardTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
