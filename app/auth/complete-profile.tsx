import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BirthdayPicker } from '@/components/auth/BirthdayPicker';
import { Country, CountryPickerModal, DEFAULT_COUNTRY } from '@/components/auth/CountryPickerModal';
import { GenderSelectModal, GenderValue } from '@/components/auth/GenderSelectModal';
import { Images } from '@/config/assets';
import { Colors } from '@/config/colors';
import { Fonts } from '@/hooks/use-fonts';
import { supabase } from '@/lib/supabase';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadUser } from '@/store/slices/userSlice';

const PURPLE = Colors.palette.purple.primary;
const PURPLE_DARK = Colors.palette.purple.dark;
const PURPLE_LIGHT = Colors.palette.purple.light;
const GOLD = Colors.palette.gold.primary;
const WHITE = Colors.palette.neutral.white;

export default function CompleteProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);

  const isRTL = currentLanguage === 'ar';

  const [birthday, setBirthday] = useState<Date | null>(null);
  const [birthdayPickerVisible, setBirthdayPickerVisible] = useState(false);
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [genderModalVisible, setGenderModalVisible] = useState(true); // Open immediately
  const [genderDraft, setGenderDraft] = useState<GenderValue | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(DEFAULT_COUNTRY);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [phone, setPhone] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fontRegular = isRTL ? Fonts.arabicRegular : Fonts.regular;
  const fontMedium = isRTL ? Fonts.arabicMedium : Fonts.medium;
  const fontSemiBold = isRTL ? Fonts.arabicSemiBold : Fonts.semiBold;
  const fontBold = isRTL ? Fonts.arabicBold : Fonts.bold;

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleComplete = async () => {
    if (!gender) {
      setGenderModalVisible(true);
      return;
    }
    if (!birthday) {
      Alert.alert(t('common.error'), t('auth.register.birthday') + ' is required');
      setBirthdayPickerVisible(true);
      return;
    }
    if (!selectedCountry || !phone) {
      Alert.alert(t('common.error'), t('auth.register.phone') + ' is required');
      if (!selectedCountry) {
        setCountryPickerVisible(true);
      }
      return;
    }
    if (!agreedToTerms) {
      Alert.alert(t('common.error'), 'Please agree to terms');
      return;
    }

    setIsSubmitting(true);

    try {
      const age = calculateAge(birthday);
      const fullPhone = `${selectedCountry.dialCode}${phone.replace(/\D/g, '')}`;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user found');

      // Update profile in Supabase (upsert in case no profile row exists yet for OAuth users)
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
            gender,
            age,
            phone_number: fullPhone,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (error) throw error;

      // Reload user profile in Redux — the navigation guard in _layout.tsx
      // will automatically redirect to /(tabs) once gender & phone_number are set
      await dispatch(loadUser()).unwrap();
    } catch (e: any) {
      console.error('Complete profile error:', e);
      Alert.alert(t('common.error'), e?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[PURPLE_LIGHT, PURPLE, PURPLE_DARK]} style={styles.gradient} />
      <StatusBar style="light" />

      <GenderSelectModal
        visible={genderModalVisible}
        value={genderDraft}
        title={t('auth.register.genderModal.title')}
        confirmLabel={t('auth.register.genderModal.confirm')}
        onChange={setGenderDraft}
        onClose={() => setGenderModalVisible(false)}
        onConfirm={() => {
          if (!genderDraft) return;
          setGender(genderDraft);
          setGenderModalVisible(false);
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View style={[styles.content, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 18 }]}>
            {/* Brand */}
            <Animated.View entering={FadeInDown.duration(450)} style={styles.header}>
              <Image source={Images.logoWhite} style={styles.logo} contentFit="contain" />
            </Animated.View>

            {/* Card */}
            <Animated.View entering={FadeInDown.delay(160).duration(450)} style={styles.card}>
              <Text style={[styles.cardTitle, { fontFamily: fontBold }]}>
                {t('auth.register.completeProfile') || 'Complete Your Profile'}
              </Text>
              <Text style={[styles.cardSubtitle, { fontFamily: fontRegular }]}>
                {t('auth.register.completeProfileSubtitle') || 'Just a few more details to get started'}
              </Text>

              {/* Gender display */}
              <Pressable
                onPress={() => {
                  setGenderDraft(gender);
                  setGenderModalVisible(true);
                }}
                style={[styles.field, !gender && styles.fieldError]}
              >
                <Ionicons name={gender === 'male' ? 'male' : gender === 'female' ? 'female' : 'person-outline'} size={20} color="rgba(255,255,255,0.9)" />
                <Text
                  style={[
                    styles.input,
                    { fontFamily: fontRegular },
                    !gender && { color: 'rgba(255,255,255,0.65)' },
                  ]}
                >
                  {gender
                    ? t(`auth.register.genderModal.${gender}`) || (gender === 'male' ? 'Male' : 'Female')
                    : t('auth.register.selectGender') || 'Select Gender'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="rgba(255,255,255,0.7)" />
              </Pressable>

              {/* Birthday */}
              <Pressable
                onPress={() => setBirthdayPickerVisible(true)}
                style={[styles.field, !birthday && styles.fieldError]}
              >
                <Ionicons name="calendar-outline" size={20} color="rgba(255,255,255,0.9)" />
                <Text
                  style={[
                    styles.input,
                    { fontFamily: fontRegular },
                    !birthday && { color: 'rgba(255,255,255,0.65)' },
                  ]}
                >
                  {birthday
                    ? birthday.toLocaleDateString(isRTL ? 'ar' : 'en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : t('auth.register.birthdayPlaceholder')}
                </Text>
              </Pressable>

              {/* Phone */}
              <View style={styles.phoneContainer}>
                <Pressable
                  onPress={() => {
                    setGenderModalVisible(false);
                    setBirthdayPickerVisible(false);
                    setCountryPickerVisible(true);
                  }}
                  style={[styles.countryButton, !selectedCountry && styles.fieldError]}
                >
                  <Text style={[styles.countryCode, { fontFamily: fontMedium }]}>
                    {selectedCountry ? `${selectedCountry.flag} ${selectedCountry.dialCode}` : t('auth.register.selectCountry')}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="rgba(255,255,255,0.9)" />
                </Pressable>
                <View style={[styles.phoneInput, !phone && styles.fieldError]}>
                  <Ionicons name="call-outline" size={20} color="rgba(255,255,255,0.9)" />
                  <TextInput
                    style={[styles.input, { fontFamily: fontRegular, flex: 1 }]}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder={t('auth.register.phonePlaceholder')}
                    placeholderTextColor="rgba(255,255,255,0.65)"
                    keyboardType="phone-pad"
                    onFocus={() => setFocusedInput('phone')}
                    onBlur={() => setFocusedInput(null)}
                    textAlign={isRTL ? 'right' : 'left'}
                  />
                </View>
              </View>

              {/* Terms */}
              <Pressable onPress={() => setAgreedToTerms(!agreedToTerms)} style={styles.termsRow}>
                <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                  {agreedToTerms && <Ionicons name="checkmark" size={14} color="#000" />}
                </View>
                <Text style={[styles.termsText, { fontFamily: fontRegular }]}>
                  I agree to the <Text style={styles.termsLink}>Terms</Text> and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </Pressable>

              {/* Submit */}
              <Pressable
                onPress={handleComplete}
                disabled={isSubmitting}
                style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed, isSubmitting && styles.ctaDisabled]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Text style={[styles.ctaText, { fontFamily: fontSemiBold }]}>
                      {t('auth.register.getStarted') || 'Get Started'}
                    </Text>
                    <Ionicons name="checkmark-done" size={20} color="#000" />
                  </>
                )}
              </Pressable>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Birthday Picker Modal */}
      <BirthdayPicker
        visible={birthdayPickerVisible}
        value={birthday}
        onSelect={setBirthday}
        onClose={() => setBirthdayPickerVisible(false)}
      />

      {/* Country Picker Modal */}
      <CountryPickerModal
        visible={countryPickerVisible}
        selectedCountry={selectedCountry}
        onSelect={setSelectedCountry}
        onClose={() => setCountryPickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 18,
  },
  logo: {
    width: 56,
    height: 56,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
  },
  cardTitle: {
    color: WHITE,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 6,
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 18,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 12,
    marginBottom: 14,
  },
  fieldError: {
    borderBottomColor: '#FF6B6B',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: WHITE,
    paddingVertical: 4,
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    minWidth: 120,
  },
  countryCode: {
    fontSize: 15,
    color: WHITE,
  },
  phoneInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 12,
  },
  cta: {
    height: 54,
    borderRadius: 16,
    backgroundColor: GOLD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
  },
  ctaPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.92,
  },
  ctaDisabled: {
    opacity: 0.75,
  },
  ctaText: {
    color: '#000',
    fontSize: 16,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    borderColor: GOLD,
    backgroundColor: GOLD,
  },
  termsText: {
    flex: 1,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    lineHeight: 18,
  },
  termsLink: {
    color: WHITE,
    textDecorationLine: 'underline',
  },
});
