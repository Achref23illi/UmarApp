import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/config/colors';
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/store/hooks';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_SIZE = (width - 40 - CARD_MARGIN) / 2;

export default function QuizzScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const currentUser = useAppSelector((state) => state.user);
  const { colors, isDark } = useTheme();
  

  
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
      title: t('quiz.modes.solo'), 
      subtitle: t('quiz.modes.solo_desc'),
      icon: 'person',
      gradient: [Colors.palette.purple.light, Colors.palette.purple.primary] as const,
      route: '/quiz/level-selection' 
    },
    { 
      id: 'duo', 
      title: t('quiz.modes.duo'), 
      subtitle: t('quiz.modes.duo_desc'),
      icon: 'people',
      gradient: [Colors.palette.purple.primary, Colors.palette.purple.dark] as const,
      route: '/quiz' 
    },
    { 
      id: 'equipe', 
      title: t('quiz.modes.team'), 
      subtitle: t('quiz.modes.team_desc'),
      icon: 'people-circle',
      gradient: [Colors.palette.purple.light, Colors.palette.purple.primary] as const,
      route: '/challenge' 
    },
    { 
      id: 'groupe', 
      title: t('quiz.modes.group'), 
      subtitle: t('quiz.modes.group_desc'),
      icon: 'grid',
      gradient: [Colors.palette.gold.primary, Colors.palette.gold.dark] as const,
      route: '/challenge' 
    },
  ];

  const handleModePress = (mode: typeof modes[0]) => {
    if (mode.id === 'solo') {
      router.push('/quiz/level-selection');
    } else {
      setSelectedMode(mode.id);
      setShowModeModal(true);
    }
  };

  const handlePlayModeSelect = (playMode: 'presentiel' | 'distance') => {
    setShowModeModal(false);
    
    if (playMode === 'presentiel') {
      router.push('/quiz/add-participants');
    } else {
      router.push('/quiz/invite-contacts');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Header Section */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View>
          <Text style={[styles.headerTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
            {t('quiz.title')}
          </Text>
          <Text style={[styles.headerSubtitle, { fontFamily: fontRegular, color: colors.text.secondary }]}>
            {t('quiz.subtitle')}
          </Text>
        </View>
        <Pressable 
          style={[styles.settingsButton, { backgroundColor: colors.surfaceHighlight }]}
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={24} color={colors.icon} />
        </Pressable>
      </View>

      {/* Main Content */}
      <View style={styles.gridContainer}>
        {modes.map((mode, index) => (
          <Animated.View
            key={mode.id}
            entering={FadeInDown.delay(index * 100).springify()}
            style={styles.cardWrapper}
          >
            <Pressable
              style={({ pressed }) => [
                styles.card,
                { transform: [{ scale: pressed ? 0.98 : 1 }] }
              ]}
              onPress={() => handleModePress(mode)}
            >
              <LinearGradient
                colors={mode.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.cardGradient}
              >
                <View style={styles.cardIconContainer}>
                  <Ionicons name={mode.icon as any} size={32} color="#FFF" />
                </View>
                <View>
                  <Text style={[styles.cardTitle, { fontFamily: fontBold }]}>
                    {mode.title}
                  </Text>
                  <Text style={[styles.cardSubtitle, { fontFamily: fontMedium }]}>
                    {mode.subtitle}
                  </Text>
                </View>
                
                {/* Decorative circle */}
                <View style={styles.decorativeCircle} />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        ))}
      </View>

      {/* Play Mode Selection Modal */}
      <Modal
        visible={showModeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModeModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowModeModal(false)}>
          <Animated.View 
            entering={FadeInDown.springify()}
            style={[styles.modalContent, { backgroundColor: colors.surface }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
                {t('quiz.play_style.title')}
              </Text>
              <Text style={[styles.modalSubtitle, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                {t('quiz.play_style.subtitle')}
              </Text>
            </View>

            <View style={styles.modalOptionsContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalOption,
                  { 
                    backgroundColor: colors.surfaceHighlight,
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  }
                ]}
                onPress={() => handlePlayModeSelect('presentiel')}
              >
                <View style={[styles.modalIconBox, { backgroundColor: Colors.palette.purple.light }]}>
                  <Ionicons name="location" size={24} color="#FFF" />
                </View>
                <View style={styles.modalOptionText}>
                  <Text style={[styles.modalOptionTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
                    {t('quiz.play_style.face_to_face')}
                  </Text>
                  <Text style={[styles.modalOptionDesc, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                    {t('quiz.play_style.face_to_face_desc')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.icon} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.modalOption,
                  { 
                    backgroundColor: colors.surfaceHighlight,
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  }
                ]}
                onPress={() => handlePlayModeSelect('distance')}
              >
                <View style={[styles.modalIconBox, { backgroundColor: Colors.palette.purple.dark }]}>
                  <Ionicons name="phone-portrait" size={24} color="#FFF" />
                </View>
                <View style={styles.modalOptionText}>
                  <Text style={[styles.modalOptionTitle, { fontFamily: fontBold, color: colors.text.primary }]}>
                    {t('quiz.play_style.remote')}
                  </Text>
                  <Text style={[styles.modalOptionDesc, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                    {t('quiz.play_style.remote_desc')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.icon} />
              </Pressable>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: CARD_MARGIN,
    justifyContent: 'center',
  },
  cardWrapper: {
    width: CARD_SIZE,
    height: CARD_SIZE * 1.2,
  },
  card: {
    flex: 1,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  cardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cardTitle: {
    fontSize: 20,
    color: '#FFF',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  decorativeCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: -20,
    right: -20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    marginBottom: 32,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
  },
  modalOptionsContainer: {
    gap: 16,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
  },
  modalIconBox: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalOptionText: {
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  modalOptionDesc: {
    fontSize: 14,
  },
});
