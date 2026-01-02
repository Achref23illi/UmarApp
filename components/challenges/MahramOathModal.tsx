
import { getFont } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/store/hooks';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface MahramOathModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function MahramOathModal({ visible, onClose, onConfirm }: MahramOathModalProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  
  const fontRegular = getFont(currentLanguage, 'regular');
  const fontBold = getFont(currentLanguage, 'bold');
  const fontMedium = getFont(currentLanguage, 'medium');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Ionicons name="warning" size={32} color="#F59E0B" />
            <Text style={[styles.title, { fontFamily: fontBold, color: colors.text.primary }]}>
                Important Religious Disclaimer
            </Text>
          </View>

          <ScrollView style={styles.content}>
            <Text style={[styles.text, { fontFamily: fontRegular, color: colors.text.primary }]}>
              In accordance with Islamic principles regarding interactions between men and women (non-Mahram), this feature is strictly intended for necessary communication or with those who are your Mahram.
            </Text>
            
            <View style={styles.oathContainer}>
                <Text style={[styles.oathText, { fontFamily: fontBold, color: colors.error }]}>
                  "I swear by Allah that my interaction here is within the permissible boundaries of Sharia, or that the person I am inviting is my Mahram."
                </Text>
                <Text style={[styles.arabicText, { fontFamily: fontRegular, color: colors.text.primary }]}>
                   أقسم بالله أن تفاعلي هنا ضمن الحدود الشرعية المسموح بها، أو أن الشخص الذي أدعوه هو من محارمي.
                </Text>
            </View>

            <Text style={[styles.disclaimer, { fontFamily: fontRegular, color: colors.text.secondary }]}>
               The app developers are free from liability before Allah for any misuse of this feature.
            </Text>
          </ScrollView>

          <View style={styles.actions}>
            <Pressable 
                onPress={onClose} 
                style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
            >
              <Text style={[styles.buttonText, { fontFamily: fontMedium, color: colors.text.secondary }]}>
                {t('common.cancel')}
              </Text>
            </Pressable>
            
            <Pressable 
                onPress={onConfirm} 
                style={[styles.button, styles.confirmButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.buttonText, { fontFamily: fontMedium, color: '#FFF' }]}>
                I Agree & Confirm
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
  },
  content: {
    maxHeight: 400,
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  oathContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: 20,
  },
  oathText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  arabicText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 26,
  },
  disclaimer: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  confirmButton: {
    // bg color from props
  },
  buttonText: {
    fontSize: 15,
  },
});
