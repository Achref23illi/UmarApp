import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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

import { AuthTabs } from '@/components/auth/AuthTabs';
import { BirthdayPicker } from '@/components/auth/BirthdayPicker';
import { Country, CountryPickerModal, DEFAULT_COUNTRY } from '@/components/auth/CountryPickerModal';
import { GenderSelectModal, GenderValue } from '@/components/auth/GenderSelectModal';
import { Images } from '@/config/assets';
import { Colors } from '@/config/colors';
import { Fonts } from '@/hooks/use-fonts';
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { registerUser } from '@/store/slices/userSlice';

const PURPLE = Colors.palette.purple.primary;
const PURPLE_DARK = Colors.palette.purple.dark;
const PURPLE_LIGHT = Colors.palette.purple.light;
const GOLD = Colors.palette.gold.primary;
const WHITE = Colors.palette.neutral.white;

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const { handleGoogleLogin } = useGoogleAuth();

  const isRTL = currentLanguage === 'ar';

  // Step 1 State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 State
  const [step, setStep] = useState(1);
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [birthdayPickerVisible, setBirthdayPickerVisible] = useState(false);
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const [genderDraft, setGenderDraft] = useState<GenderValue | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(DEFAULT_COUNTRY);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [phone, setPhone] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fonts
  const fontRegular = isRTL ? Fonts.arabicRegular : Fonts.regular;
  const fontMedium = isRTL ? Fonts.arabicMedium : Fonts.medium;
  const fontSemiBold = isRTL ? Fonts.arabicSemiBold : Fonts.semiBold;
  const fontBold = isRTL ? Fonts.arabicBold : Fonts.bold;

  const tabLabels = useMemo(
    () => ({
      register: t('auth.tabs.register'),
      login: t('auth.tabs.login'),
    }),
    [t]
  );

  const openGenderModal = () => {
    setGenderDraft(gender);
    setGenderModalVisible(true);
  };

  const handleNextStep = () => {
    if (!name || !email || !password) {
      Alert.alert(t('common.error'), t('auth.register.fillAllFields') || 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('common.error'), 'Password must be at least 6 characters');
      return;
    }
    openGenderModal();
  };

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleRegister = async () => {
    if (!gender) {
      openGenderModal();
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
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedName = name.trim();

      const resultAction = await dispatch(
        registerUser({
          email: normalizedEmail,
          password,
          fullName: normalizedName,
          age,
          gender,
          phoneNumber: fullPhone,
        })
      );

      if (registerUser.rejected.match(resultAction)) {
        const message =
          typeof resultAction.payload === 'string'
            ? resultAction.payload
            : resultAction.error?.message || 'Registration failed';
        Alert.alert(t('common.error'), message);
        return;
      }

      const requiresEmailConfirmation = !resultAction.payload.session;
      if (requiresEmailConfirmation) {
        Alert.alert(
          t('common.success') || 'Success',
          'Account created. Please verify your email from your inbox, then log in.',
          [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
        );
        return;
      }

      router.replace('/(tabs)');

    } catch (e) {
      console.error('Registration Error:', e);
      Alert.alert(t('common.error'), 'Registration failed. Please try again.');
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
          setStep(2);
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

            {/* Tabs */}
            <Animated.View entering={FadeInDown.delay(80).duration(450)} style={styles.tabs}>
              <AuthTabs
                active="register"
                labels={tabLabels}
                onChange={(tab) => {
                  if (tab === 'login') router.replace('/auth/login');
                }}
              />
            </Animated.View>

            {/* Card */}
            <Animated.View entering={FadeInDown.delay(160).duration(450)} style={styles.card}>
              <Text style={[styles.cardTitle, { fontFamily: fontBold }]}>
                {t('auth.register.title')}
              </Text>
              <Text style={[styles.cardSubtitle, { fontFamily: fontRegular }]}>
                {step === 1 ? t('auth.register.subtitle') : t('auth.register.subtitle')}
              </Text>

              {step === 1 ? (
                <>
                  <View style={[styles.field, focusedInput === 'name' && styles.fieldFocused]}>
                    <Ionicons name="person-outline" size={20} color="rgba(255,255,255,0.9)" />
                    <TextInput
                      style={[styles.input, { fontFamily: fontRegular }]}
                      value={name}
                      onChangeText={setName}
                      placeholder={t('auth.register.namePlaceholder')}
                      placeholderTextColor="rgba(255,255,255,0.65)"
                      onFocus={() => setFocusedInput('name')}
                      onBlur={() => setFocusedInput(null)}
                      textAlign={isRTL ? 'right' : 'left'}
                    />
                  </View>

                  <View style={[styles.field, focusedInput === 'email' && styles.fieldFocused]}>
                    <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.9)" />
                    <TextInput
                      style={[styles.input, { fontFamily: fontRegular }]}
                      value={email}
                      onChangeText={setEmail}
                      placeholder={t('auth.register.emailPlaceholder')}
                      placeholderTextColor="rgba(255,255,255,0.65)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onFocus={() => setFocusedInput('email')}
                      onBlur={() => setFocusedInput(null)}
                      textAlign={isRTL ? 'right' : 'left'}
                    />
                  </View>

                  <View style={[styles.field, focusedInput === 'password' && styles.fieldFocused]}>
                    <Ionicons name="lock-closed-outline" size={20} color="rgba(255,255,255,0.9)" />
                    <TextInput
                      style={[styles.input, { fontFamily: fontRegular }]}
                      value={password}
                      onChangeText={setPassword}
                      placeholder={t('auth.register.passwordPlaceholder')}
                      placeholderTextColor="rgba(255,255,255,0.65)"
                      secureTextEntry={!showPassword}
                      onFocus={() => setFocusedInput('password')}
                      onBlur={() => setFocusedInput(null)}
                      textAlign={isRTL ? 'right' : 'left'}
                    />
                    <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton} hitSlop={10}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="rgba(255,255,255,0.75)"
                      />
                    </Pressable>
                  </View>

                  <Pressable onPress={handleNextStep} style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
                    <Text style={[styles.ctaText, { fontFamily: fontSemiBold }]}>{t('common.next')}</Text>
                    <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={20} color="#000" />
                  </Pressable>

                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={[styles.dividerText, { fontFamily: fontRegular }]}>{t('common.or')}</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <View style={styles.socialRow}>
                    <Pressable onPress={handleGoogleLogin} style={({ pressed }) => [styles.socialButton, pressed && styles.socialPressed]}>
                      <Ionicons name="logo-google" size={20} color={WHITE} />
                      <Text style={[styles.socialText, { fontFamily: fontMedium }]}>{t('auth.social.google')}</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
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

                  <View style={styles.phoneContainer}>
                    <Pressable
                      onPress={() => {
                        // Close other modals first
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

                  <Pressable onPress={() => setAgreedToTerms(!agreedToTerms)} style={styles.termsRow}>
                    <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                      {agreedToTerms && <Ionicons name="checkmark" size={14} color="#000" />}
                    </View>
                    <Text style={[styles.termsText, { fontFamily: fontRegular }]}>
                      I agree to the <Text style={styles.termsLink}>Terms</Text> and{' '}
                      <Text style={styles.termsLink}>Privacy Policy</Text>
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleRegister}
                    disabled={isSubmitting}
                    style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed, isSubmitting && styles.ctaDisabled]}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <>
                        <Text style={[styles.ctaText, { fontFamily: fontSemiBold }]}>{t('auth.register.signUp')}</Text>
                        <Ionicons name="checkmark-done" size={20} color="#000" />
                      </>
                    )}
                  </Pressable>
                </>
              )}

              <View style={styles.bottomRow}>
                <Text style={[styles.bottomText, { fontFamily: fontRegular }]}>{t('auth.register.haveAccount')}</Text>
                <Pressable onPress={() => router.replace('/auth/login')} hitSlop={10}>
                  <Text style={[styles.bottomLink, { fontFamily: fontSemiBold }]}>{t('auth.register.signIn')}</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Gender Modal */}
      <GenderSelectModal
        visible={genderModalVisible}
        value={genderDraft}
        title={t('auth.register.genderModal.title')}
        confirmLabel={t('auth.register.genderModal.confirm')}
        onChange={setGenderDraft}
        onClose={() => setGenderModalVisible(false)}
        onConfirm={() => {
          if (genderDraft) {
            setGender(genderDraft);
            setGenderModalVisible(false);
            setStep(2);
          }
        }}
      />

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
  tabs: {
    width: '100%',
    marginBottom: 18,
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
  fieldFocused: {
    borderBottomColor: GOLD,
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
  eyeButton: {
    padding: 4,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    marginHorizontal: 12,
  },
  socialRow: {
    gap: 10,
    marginBottom: 16,
  },
  socialButton: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  socialPressed: {
    opacity: 0.92,
  },
  socialText: {
    color: WHITE,
    fontSize: 14,
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
  bottomRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  bottomText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  bottomLink: {
    color: WHITE,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
