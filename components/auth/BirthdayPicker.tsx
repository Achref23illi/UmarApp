import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Colors } from '@/config/colors';
import { Fonts } from '@/hooks/use-fonts';
import { useAppSelector } from '@/store/hooks';

type Props = {
  visible: boolean;
  value: Date | null;
  onSelect: (date: Date) => void;
  onClose: () => void;
};

const PRIMARY = Colors.palette.purple.primary;
const WHITE = Colors.palette.neutral.white;

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const DAYS_IN_MONTH = (month: number, year: number) => {
  return new Date(year, month + 1, 0).getDate();
};

export function BirthdayPicker({ visible, value, onSelect, onClose }: Props) {
  const { t } = useTranslation();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const isRTL = currentLanguage === 'ar';
  const fontRegular = isRTL ? Fonts.arabicRegular : Fonts.regular;
  const fontMedium = isRTL ? Fonts.arabicMedium : Fonts.medium;
  const fontSemiBold = isRTL ? Fonts.arabicSemiBold : Fonts.semiBold;

  const initialDate = value || new Date(CURRENT_YEAR - 25, 0, 1);
  const [selectedYear, setSelectedYear] = useState(initialDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(initialDate.getMonth());
  const [selectedDay, setSelectedDay] = useState(initialDate.getDate());

  const maxDay = DAYS_IN_MONTH(selectedMonth, selectedYear);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  const handleConfirm = () => {
    const date = new Date(selectedYear, selectedMonth, selectedDay);
    onSelect(date);
    onClose();
  };

  const calculateAge = () => {
    const today = new Date();
    let age = today.getFullYear() - selectedYear;
    const monthDiff = today.getMonth() - selectedMonth;
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < selectedDay)) {
      age--;
    }
    return age;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { fontFamily: fontSemiBold }]}>
              {t('auth.register.selectBirthday')}
            </Text>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#111" />
            </Pressable>
          </View>

          <View style={styles.pickerContainer}>
            <View style={styles.pickerColumn}>
              <Text style={[styles.pickerLabel, { fontFamily: fontMedium }]}>
                {t('auth.register.day')}
              </Text>
              <ScrollView
                style={styles.picker}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.pickerContent}
              >
                {days.map((day) => (
                  <Pressable
                    key={day}
                    onPress={() => setSelectedDay(day)}
                    style={[
                      styles.pickerItem,
                      selectedDay === day && styles.pickerItemSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        { fontFamily: selectedDay === day ? fontSemiBold : fontRegular },
                        selectedDay === day && styles.pickerItemTextSelected,
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.pickerColumn}>
              <Text style={[styles.pickerLabel, { fontFamily: fontMedium }]}>
                {t('auth.register.month')}
              </Text>
              <ScrollView
                style={styles.picker}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.pickerContent}
              >
                {MONTHS.map((month, index) => (
                  <Pressable
                    key={index}
                    onPress={() => {
                      setSelectedMonth(index);
                      const newMaxDay = DAYS_IN_MONTH(index, selectedYear);
                      if (selectedDay > newMaxDay) {
                        setSelectedDay(newMaxDay);
                      }
                    }}
                    style={[
                      styles.pickerItem,
                      selectedMonth === index && styles.pickerItemSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        { fontFamily: selectedMonth === index ? fontSemiBold : fontRegular },
                        selectedMonth === index && styles.pickerItemTextSelected,
                      ]}
                    >
                      {month.substring(0, 3)}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.pickerColumn}>
              <Text style={[styles.pickerLabel, { fontFamily: fontMedium }]}>
                {t('auth.register.year')}
              </Text>
              <ScrollView
                style={styles.picker}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.pickerContent}
              >
                {YEARS.map((year) => (
                  <Pressable
                    key={year}
                    onPress={() => {
                      setSelectedYear(year);
                      const newMaxDay = DAYS_IN_MONTH(selectedMonth, year);
                      if (selectedDay > newMaxDay) {
                        setSelectedDay(newMaxDay);
                      }
                    }}
                    style={[
                      styles.pickerItem,
                      selectedYear === year && styles.pickerItemSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        { fontFamily: selectedYear === year ? fontSemiBold : fontRegular },
                        selectedYear === year && styles.pickerItemTextSelected,
                      ]}
                    >
                      {year}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.ageText, { fontFamily: fontRegular }]}>
              {t('auth.register.age')}: {calculateAge()} {t('auth.register.yearsOld')}
            </Text>
            <Pressable onPress={handleConfirm} style={styles.confirmButton}>
              <Text style={[styles.confirmText, { fontFamily: fontSemiBold }]}>
                {t('common.confirm')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    color: '#111',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    height: 300,
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  pickerLabel: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.6)',
    marginBottom: 8,
    textAlign: 'center',
  },
  picker: {
    flex: 1,
  },
  pickerContent: {
    paddingVertical: 100,
  },
  pickerItem: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(103, 15, 164, 0.1)',
    borderRadius: 8,
  },
  pickerItemText: {
    fontSize: 16,
    color: 'rgba(0,0,0,0.7)',
  },
  pickerItemTextSelected: {
    color: PRIMARY,
    fontSize: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  ageText: {
    fontSize: 16,
    color: '#111',
    textAlign: 'center',
    marginBottom: 16,
  },
  confirmButton: {
    backgroundColor: Colors.palette.gold.primary,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 16,
    color: '#111',
  },
});
