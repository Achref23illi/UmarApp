import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Images } from '@/config/assets';
import { Colors } from '@/config/colors';
import { Fonts } from '@/hooks/use-fonts';
import { useAppSelector } from '@/store/hooks';

export type GenderValue = 'male' | 'female';

type Props = {
  visible: boolean;
  value: GenderValue | null;
  title: string;
  confirmLabel: string;
  onChange: (gender: GenderValue) => void;
  onClose: () => void;
  onConfirm: () => void;
};

const PRIMARY = Colors.palette.purple.primary;
const WHITE = Colors.palette.neutral.white;

export function GenderSelectModal({
  visible,
  value,
  title,
  confirmLabel,
  onChange,
  onClose,
  onConfirm,
}: Props) {
  const { t } = useTranslation();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const isRTL = currentLanguage === 'ar';
  const fontRegular = isRTL ? Fonts.arabicRegular : Fonts.regular;
  const fontMedium = isRTL ? Fonts.arabicMedium : Fonts.medium;
  const fontSemiBold = isRTL ? Fonts.arabicSemiBold : Fonts.semiBold;

  const canConfirm = !!value;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <View style={styles.card}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.closeButton}>
            <Ionicons name="close" size={22} color="#111" />
          </Pressable>

          <Text style={[styles.title, { fontFamily: fontSemiBold }]}>{title}</Text>

          <View style={styles.optionsRow}>
            <Pressable
              onPress={() => onChange('male')}
              style={({ pressed }) => [
                styles.option,
                value === 'male' && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}
            >
              <Image source={Images.man} style={styles.optionImage} contentFit="contain" />
              <Text style={[styles.optionLabel, { fontFamily: fontMedium }]}>
                {t('common.brother')}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => onChange('female')}
              style={({ pressed }) => [
                styles.option,
                value === 'female' && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}
            >
              <Image source={Images.woman} style={styles.optionImage} contentFit="contain" />
              <Text style={[styles.optionLabel, { fontFamily: fontMedium }]}>
                {t('common.sister')}
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={onConfirm}
            disabled={!canConfirm}
            style={({ pressed }) => [
              styles.confirmButton,
              !canConfirm && styles.confirmButtonDisabled,
              pressed && canConfirm && styles.confirmButtonPressed,
            ]}
          >
            <Text style={[styles.confirmText, { fontFamily: fontRegular }]}>{confirmLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: 24,
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    backgroundColor: WHITE,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 18,
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    color: '#111',
    marginBottom: 24,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  option: {
    width: 150,
    height: 180,
    borderRadius: 20,
    backgroundColor: '#F2F2F2',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  optionSelected: {
    backgroundColor: 'rgba(103, 15, 164, 0.08)',
    borderColor: PRIMARY,
  },
  optionPressed: {
    opacity: 0.92,
  },
  optionImage: {
    width: 110,
    height: 110,
    marginBottom: 12,
  },
  optionLabel: {
    fontSize: 16,
    color: '#111',
    marginTop: 4,
  },
  confirmButton: {
    height: 42,
    minWidth: 140,
    borderRadius: 12,
    backgroundColor: Colors.palette.gold.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  confirmButtonPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmText: {
    fontSize: 14,
    color: '#111',
  },
});

