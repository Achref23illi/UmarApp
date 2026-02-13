import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Images } from '@/config/assets';
import { Colors } from '@/config/colors';
import { Fonts } from '@/hooks/use-fonts';
import { supabase } from '@/lib/supabase';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadUser } from '@/store/slices/userSlice';

// ─── Constants ───

const PURPLE = Colors.palette.purple.primary;
const GOLD = Colors.palette.gold.primary;
const WHITE = Colors.palette.neutral.white;

const COUNTRIES = [
  { code: 'PS', name: 'Palestine', dialCode: '+970', flag: '🇵🇸' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'MA', name: 'Morocco', dialCode: '+212', flag: '🇲🇦' },
  { code: 'DZ', name: 'Algeria', dialCode: '+213', flag: '🇩🇿' },
  { code: 'TN', name: 'Tunisia', dialCode: '+216', flag: '🇹🇳' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦' },
  { code: 'TR', name: 'Turkey', dialCode: '+90', flag: '🇹🇷' },
  { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'BE', name: 'Belgium', dialCode: '+32', flag: '🇧🇪' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', flag: '🇨🇭' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', flag: '🇸🇪' },
].sort((a, b) => a.name.localeCompare(b.name));

const DEFAULT_COUNTRY = COUNTRIES.find(c => c.code === 'FR') || COUNTRIES[0];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_IN_MONTH = (month: number, year: number) => new Date(year, month + 1, 0).getDate();

// ─── Shared Trigger Logic ───
let _pendingShow = false;
const _listeners: Array<(v: boolean) => void> = [];
export function showCompleteProfileModal() {
  _pendingShow = true;
  _listeners.forEach((fn) => fn(true));
}
function usePendingFlag() {
  const [flag, setFlag] = useState(_pendingShow);
  useEffect(() => {
    _listeners.push(setFlag);
    return () => {
      const i = _listeners.indexOf(setFlag);
      if (i >= 0) _listeners.splice(i, 1);
    };
  }, []);
  return flag;
}

// ─── Main Component ───
export function CompleteProfileModal() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const currentLanguage = useAppSelector((s) => s.language.currentLanguage);
  const { gender: savedGender, phone_number: savedPhone, isAuthenticated } = useAppSelector((s) => s.user);

  const isRTL = currentLanguage === 'ar';
  const fontRegular = isRTL ? Fonts.arabicRegular : Fonts.regular;
  const fontMedium = isRTL ? Fonts.arabicMedium : Fonts.medium;
  const fontSemiBold = isRTL ? Fonts.arabicSemiBold : Fonts.semiBold;
  const fontBold = isRTL ? Fonts.arabicBold : Fonts.bold;

  const pendingFromHook = usePendingFlag();
  const shouldShow = pendingFromHook || (isAuthenticated && (!savedGender || !savedPhone));

  const [visible, setVisible] = useState(false);
  
  // Steps: 'main' | 'country' | 'birthday'
  const [step, setStep] = useState<'main' | 'country' | 'birthday'>('main');

  // Form State
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [birthday, setBirthday] = useState<Date | null>(null);

  // Picker State
  const [pYear, setPYear] = useState(CURRENT_YEAR - 20);
  const [pMonth, setPMonth] = useState(0);
  const [pDay, setPDay] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (shouldShow) setVisible(true);
  }, [shouldShow]);

  // Derived
  const filteredCountries = useMemo(() => {
    return COUNTRIES.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.dialCode.includes(searchQuery)
    );
  }, [searchQuery]);

  const daysInMonth = useMemo(() => {
    const d = DAYS_IN_MONTH(pMonth, pYear);
    return Array.from({ length: d }, (_, i) => i + 1);
  }, [pMonth, pYear]);

  // Handlers
  const handleCountrySelect = (c: typeof DEFAULT_COUNTRY) => {
    setCountry(c);
    setStep('main');
  };

  const handleBirthdayConfirm = () => {
    // constrain day if needed
    const maxD = DAYS_IN_MONTH(pMonth, pYear);
    const validDay = Math.min(pDay, maxD);
    setBirthday(new Date(pYear, pMonth, validDay));
    setStep('main');
  };

  const calculateAge = (d: Date) => {
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
  };

  const handleSubmit = async () => {
    if (!gender) {
        Alert.alert(t('common.error'), t('auth.register.selectGender') || 'Please select gender');
        return;
    }
    if (!birthday) {
        Alert.alert(t('common.error'), t('auth.register.birthdayPlaceholder') || 'Please select birthday');
        return;
    }
    if (!phone) {
        Alert.alert(t('common.error'), t('auth.register.phonePlaceholder') || 'Please enter phone');
        return;
    }

    setIsSubmitting(true);
    try {
      const age = calculateAge(birthday);
      const fullPhone = `${country.dialCode}${phone.replace(/\D/g, '')}`;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const { error } = await supabase.rpc('upsert_user_profile', {
        p_contact_email: user.email || null,
        p_full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        p_gender: gender,
        p_age: age,
        p_phone_number: fullPhone,
      });

      if (error) throw error;

      // Reset & Close
      _pendingShow = false;
      _listeners.forEach((fn) => fn(false));
      setVisible(false);
      await dispatch(loadUser()).unwrap();

    } catch (e: any) {
      console.error(e);
      Alert.alert('Error', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.overlay}>
          {/* Spacer to push content down when keyboard opens */}
          <View style={{ flex: 1 }} />

          <Animated.View 
            entering={SlideInDown} 
            style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
          >
            {/* ─── HEADER ─── */}
            <View style={styles.handle} />
            <Text style={[styles.sheetTitle, { fontFamily: fontBold }]}>
              {step === 'main' ? (t('auth.register.completeProfile') || 'Complete Profile') : 
               step === 'country' ? (t('auth.register.selectCountry') || 'Select Country') :
               (t('auth.register.selectBirthday') || 'Select Birth Date')}
            </Text>
            
            {step === 'main' && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <Text style={[styles.sheetSubtitle, { fontFamily: fontRegular }]}>
                   {t('auth.register.completeProfileSubtitle') || 'Just a few more details to get started'}
                </Text>

                {/* GENDER */}
                <Text style={[styles.label, { fontFamily: fontMedium }]}>{t('auth.register.selectGender') || 'Gender'}</Text>
                <View style={styles.genderRow}>
                  <Pressable 
                    onPress={() => setGender('male')}
                    style={[styles.genderOption, gender === 'male' && styles.genderSelected]}
                  >
                     <Image source={Images.man} style={styles.genderImg} contentFit="contain" />
                     <Text style={[styles.genderText, { fontFamily: fontMedium }]}>{t('common.brother') || 'Brother'}</Text>
                     {gender === 'male' && <Ionicons name="checkmark-circle" color={GOLD} size={24} style={styles.checkIcon} />}
                  </Pressable>
                  <Pressable 
                    onPress={() => setGender('female')}
                    style={[styles.genderOption, gender === 'female' && styles.genderSelected]}
                  >
                     <Image source={Images.woman} style={styles.genderImg} contentFit="contain" />
                     <Text style={[styles.genderText, { fontFamily: fontMedium }]}>{t('common.sister') || 'Sister'}</Text>
                     {gender === 'female' && <Ionicons name="checkmark-circle" color={GOLD} size={24} style={styles.checkIcon} />}
                  </Pressable>
                </View>

                {/* BIRTHDAY */}
                <Text style={[styles.label, { fontFamily: fontMedium, marginTop: 16 }]}>{t('auth.register.birthday') || 'Date of Birth'}</Text>
                <Pressable onPress={() => setStep('birthday')} style={styles.inputBox}>
                  <Ionicons name="calendar-outline" size={20} color={PURPLE} />
                  <Text style={[styles.inputText, { fontFamily: fontRegular }, !birthday && { color: '#999' }]}>
                    {birthday ? birthday.toLocaleDateString() : (t('auth.register.birthdayPlaceholder') || 'Select Date')}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#ccc" />
                </Pressable>

                {/* PHONE */}
                <Text style={[styles.label, { fontFamily: fontMedium, marginTop: 16 }]}>{t('auth.register.phone') || 'Phone Number'}</Text>
                <View style={styles.phoneContainer}>
                  <Pressable onPress={() => setStep('country')} style={styles.countryTrigger}>
                    <Text style={{ fontSize: 24, marginRight: 4 }}>{country.flag}</Text>
                    <Text style={{ fontFamily: fontMedium, fontSize: 16 }}>{country.dialCode}</Text>
                    <Ionicons name="chevron-down" size={14} color="#666" style={{ marginLeft: 4 }} />
                  </Pressable>
                  <TextInput
                    style={[styles.phoneInput, { fontFamily: fontRegular }]}
                    placeholder="123456789"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="number-pad"
                    placeholderTextColor="#999"
                    returnKeyType="done"
                  />
                </View>

                {/* SUBMIT */}
                <Pressable
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.9 }, isSubmitting && { opacity: 0.7 }]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={WHITE} />
                  ) : (
                    <Text style={[styles.submitText, { fontFamily: fontSemiBold }]}>
                       {t('auth.register.getStarted') || 'Get Started'}
                    </Text>
                  )}
                </Pressable>
              </ScrollView>
            )}

            {/* ─── COUNTRY PICKER OVERLAY ─── */}
            {step === 'country' && (
              <Animated.View entering={FadeIn} style={styles.subScreen}>
                <View style={styles.searchBox}>
                   <Ionicons name="search" size={20} color="#999" />
                   <TextInput 
                     style={[styles.searchInput, { fontFamily: fontRegular }]}
                     placeholder={t('common.search') || 'Search...'}
                     value={searchQuery}
                     onChangeText={setSearchQuery}
                     autoFocus
                   />
                </View>
                <FlatList
                   data={filteredCountries}
                   keyExtractor={i => i.code}
                   keyboardShouldPersistTaps="handled" 
                   renderItem={({ item }) => (
                     <Pressable onPress={() => handleCountrySelect(item)} style={styles.countryRow}>
                        <Text style={styles.countryFlag}>{item.flag}</Text>
                        <Text style={[styles.countryName, { fontFamily: fontMedium }]}>{item.name} ({item.dialCode})</Text>
                        {country.code === item.code && <Ionicons name="checkmark" color={PURPLE} size={20} />}
                     </Pressable>
                   )}
                />
                <Pressable onPress={() => setStep('main')} style={styles.backBtn}>
                   <Text style={{ fontFamily: fontMedium, color: '#666' }}>{t('common.back') || 'Back'}</Text>
                </Pressable>
              </Animated.View>
            )}

            {/* ─── BIRTHDAY PICKER OVERLAY ─── */}
            {step === 'birthday' && (
              <Animated.View entering={FadeIn} style={styles.subScreen}>
                <View style={styles.pickerRow}>
                   {/* Day */}
                   <View style={styles.pickerCol}>
                      <Text style={[styles.pickerLabel, { fontFamily: fontMedium }]}>{t('auth.register.day')}</Text>
                      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroller}>
                        {daysInMonth.map(d => (
                           <Pressable key={d} onPress={() => setPDay(d)} style={[styles.pItem, pDay === d && styles.pSelected]}>
                              <Text style={[styles.pText, pDay === d && styles.pTextSel, { fontFamily: fontRegular }]}>{d}</Text>
                           </Pressable>
                        ))}
                      </ScrollView>
                   </View>
                   {/* Month */}
                   <View style={styles.pickerCol}>
                      <Text style={[styles.pickerLabel, { fontFamily: fontMedium }]}>{t('auth.register.month')}</Text>
                      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroller}>
                        {MONTHS.map((m, i) => (
                           <Pressable key={m} onPress={() => setPMonth(i)} style={[styles.pItem, pMonth === i && styles.pSelected]}>
                              <Text style={[styles.pText, pMonth === i && styles.pTextSel, { fontFamily: fontRegular }]}>{m.slice(0,3)}</Text>
                           </Pressable>
                        ))}
                      </ScrollView>
                   </View>
                   {/* Year */}
                   <View style={styles.pickerCol}>
                      <Text style={[styles.pickerLabel, { fontFamily: fontMedium }]}>{t('auth.register.year')}</Text>
                      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroller}>
                        {YEARS.map(y => (
                           <Pressable key={y} onPress={() => setPYear(y)} style={[styles.pItem, pYear === y && styles.pSelected]}>
                              <Text style={[styles.pText, pYear === y && styles.pTextSel, { fontFamily: fontRegular }]}>{y}</Text>
                           </Pressable>
                        ))}
                      </ScrollView>
                   </View>
                </View>

                <Pressable onPress={handleBirthdayConfirm} style={styles.confirmBtn}>
                   <Text style={[styles.submitText, { fontFamily: fontSemiBold }]}>{t('common.confirm') || 'Confirm'}</Text>
                </Pressable>
                <Pressable onPress={() => setStep('main')} style={styles.backBtn}>
                    <Text style={{ fontFamily: fontMedium, color: '#666' }}>{t('common.cancel') || 'Cancel'}</Text>
                </Pressable>
              </Animated.View>
            )}

          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '90%',
  },
  handle: {
    width: 40, 
    height: 4, 
    borderRadius: 2, 
    backgroundColor: '#DDDDDD', 
    alignSelf: 'center', 
    marginBottom: 20 
  },
  sheetTitle: {
    fontSize: 20, 
    color: '#333', 
    textAlign: 'center', 
    marginBottom: 8 
  },
  sheetSubtitle: {
    fontSize: 14, 
    color: '#888', 
    textAlign: 'center', 
    marginBottom: 20 
  },
  label: {
    fontSize: 14, 
    color: '#333', 
    marginBottom: 8 
  },
  genderRow: {
    flexDirection: 'row', 
    gap: 12 
  },
  genderOption: {
    flex: 1, 
    backgroundColor: '#F7F7F7', 
    borderRadius: 16, 
    alignItems: 'center', 
    paddingVertical: 16, 
    borderWidth: 2, 
    borderColor: 'transparent'
  },
  genderSelected: {
    backgroundColor: 'rgba(103, 15, 164, 0.05)', 
    borderColor: PURPLE 
  },
  genderImg: {
    width: 60, 
    height: 60, 
    marginBottom: 8 
  },
  genderText: {
    fontSize: 16, 
    color: '#333' 
  },
  checkIcon: {
    position: 'absolute', 
    top: 8, 
    right: 8 
  },
  inputBox: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F7F7F7', 
    borderRadius: 14, 
    padding: 14, 
    gap: 12 
  },
  inputText: {
    flex: 1, 
    fontSize: 16, 
    color: '#333' 
  },
  phoneContainer: {
    flexDirection: 'row', 
    gap: 12 
  },
  countryTrigger: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F7F7F7', 
    borderRadius: 14, 
    paddingHorizontal: 12, 
    height: 52 
  },
  phoneInput: {
    flex: 1, 
    backgroundColor: '#F7F7F7', 
    borderRadius: 14, 
    paddingHorizontal: 14, 
    fontSize: 16, 
    height: 52, 
    color: '#333' 
  },
  submitBtn: {
    backgroundColor: PURPLE, 
    marginTop: 24, 
    borderRadius: 14, 
    height: 54, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  submitText: {
    color: WHITE, 
    fontSize: 16 
  },
  subScreen: {
    height: 400, // Fixed height for consistency
    marginTop: 10
  },
  searchBox: {
    flexDirection: 'row', 
    backgroundColor: '#f0f0f0', 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    alignItems: 'center', 
    height: 44, 
    marginBottom: 12 
  },
  searchInput: {
    flex: 1, 
    marginLeft: 8, 
    fontSize: 16, 
    color: '#333' 
  },
  countryRow: {
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  countryFlag: {
    fontSize: 24, 
    marginRight: 12 
  },
  countryName: {
     flex: 1, 
     fontSize: 16, 
     color: '#333' 
  },
  backBtn: {
    alignItems: 'center', 
    paddingVertical: 16 
  },
  // Picker Styles
  pickerRow: {
    flexDirection: 'row', 
    height: 200, 
    marginBottom: 20 
  },
  pickerCol: {
    flex: 1, 
    marginHorizontal: 4 
  },
  pickerLabel: {
    textAlign: 'center', 
    marginBottom: 8, 
    color: '#888' 
  },
  scroller: {
    backgroundColor: '#f9f9f9', 
    borderRadius: 12 
  },
  pItem: {
    height: 44, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  pSelected: {
    backgroundColor: '#e6e6fa' 
  },
  pText: {
    fontSize: 16, 
    color: '#666', 
    textAlign: 'center' 
  },
  pTextSel: {
    color: PURPLE, 
    fontWeight: 'bold' 
  },
  confirmBtn: {
    backgroundColor: GOLD, 
    borderRadius: 14, 
    height: 50, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 4 
  }
});
