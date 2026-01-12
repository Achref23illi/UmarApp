/**
 * Quiz Theme Selection Screen
 * ============================
 * Users select a theme/topic for their quiz
 */

import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFont } from '@/hooks/use-fonts';
import { useAppSelector } from '@/store/hooks';

const themes = [
  { id: 1, name: 'La vie du Prophète sws' },
  { id: 2, name: "Les piliers de l'islam" },
  { id: 3, name: 'La foi' },
  { id: 4, name: 'Le Coran' },
  { id: 5, name: 'Jurisprudence' },
];

export default function ThemeSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { level } = useLocalSearchParams<{ level: string }>();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);

  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');
  const fontRegular = getFont(currentLanguage, 'regular');

  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleThemeSelect = (themeName: string) => {
    setSelectedTheme(themeName);
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    setShowConfirmation(false);
    // Navigate to game settings
    router.push({
      pathname: '/quiz/game-settings',
      params: { theme: selectedTheme || '', level: level || '' }
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
              <Text style={[styles.logo, { fontFamily: fontBold }]}>QUIZZ</Text>
            </View>
            <Pressable 
              style={styles.settingsButton}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings-outline" size={28} color="#FFF" />
            </Pressable>
          </View>
        </LinearGradient>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { fontFamily: fontBold }]}>
            Choisissez un thème :
          </Text>
          <View style={styles.emojiContainer}>
            <Text style={styles.emoji}>😊</Text>
          </View>
        </View>

        {/* Theme List */}
        <View style={styles.themesContainer}>
          {themes.map((theme, index) => (
            <Animated.View
              key={theme.id}
              entering={FadeInRight.delay(index * 50).springify()}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.themeButton,
                  { 
                    backgroundColor: '#FFFFFF',
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  }
                ]}
                onPress={() => handleThemeSelect(theme.name)}
              >
                <Text style={[styles.themeText, { fontFamily: fontRegular }]}>
                  {theme.name}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        {/* Back Button */}
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { fontFamily: fontMedium }]}>
            Revenir
          </Text>
        </Pressable>
      </View>

      {/* Theme Confirmation Modal */}
      <Modal
        visible={showConfirmation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmation(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            entering={FadeIn.duration(200)}
            style={styles.modalContent}
          >
            <View style={styles.modalCard}>
              {/* Close Button */}
              <Pressable
                style={styles.closeButton}
                onPress={() => setShowConfirmation(false)}
              >
                <Ionicons name="close" size={28} color="#374151" />
              </Pressable>

              <Text style={[styles.modalTitle, { fontFamily: fontRegular }]}>
                VOUS AVEZ SÉLECTIONNÉ LE THÈME :
              </Text>
              <Text style={[styles.modalTheme, { fontFamily: fontBold }]}>
                {selectedTheme}
              </Text>

              {/* Action Buttons */}
              <View style={styles.modalButtons}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => setShowConfirmation(false)}
                >
                  <Text style={[styles.cancelText, { fontFamily: fontMedium }]}>
                    Revenir
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.confirmButton}
                  onPress={handleConfirm}
                >
                  <Text style={[styles.confirmText, { fontFamily: fontMedium }]}>
                    Valider
                  </Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
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
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 20,
    top: 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    color: '#374151',
    textAlign: 'center',
  },
  emojiContainer: {
    marginTop: 10,
  },
  emoji: {
    fontSize: 40,
  },
  themesContainer: {
    gap: 16,
    marginBottom: 30,
  },
  themeButton: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  themeText: {
    fontSize: 16,
    color: '#374151',
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FCD34D',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  modalTheme: {
    fontSize: 20,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 30,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#FCD34D',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 16,
    color: '#374151',
  },
});
