
import { Fonts } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

interface SuccessModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  buttonText?: string;
}

export default function SuccessModal({ 
  visible, 
  title, 
  message, 
  onConfirm,
  buttonText 
}: SuccessModalProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onConfirm}
    >
      <View style={styles.overlay}>
        <Animated.View 
          entering={ZoomIn.duration(300)}
          style={[styles.container, { backgroundColor: colors.surface }]}
        >
          <View style={styles.iconContainer}>
            <Animated.View entering={FadeIn.delay(200)}>
              <Ionicons name="checkmark-circle" size={80} color={colors.primary} />
            </Animated.View>
          </View>
          
          <Text style={[styles.title, { color: colors.text.primary, fontFamily: Fonts.bold }]}>
            {title || t('common.success')}
          </Text>
          
          {message && (
            <Text style={[styles.message, { color: colors.text.secondary, fontFamily: Fonts.regular }]}>
              {message}
            </Text>
          )}

          <Pressable
            onPress={onConfirm}
            style={({ pressed }) => [
              styles.button,
              { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 }
            ]}
          >
            <Text style={[styles.buttonText, { fontFamily: Fonts.semiBold }]}>
              {buttonText || t('common.done')}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
  },
});
