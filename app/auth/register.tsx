import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/hooks/use-fonts';
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { useTheme } from '@/hooks/use-theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { isLoading, error } = useAppSelector((state) => state.user);
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const { handleGoogleLogin } = useGoogleAuth();
  const { colors, isDark } = useTheme();

  // Show error effect
  if (error) {
     Alert.alert(t('common.error'), error, [
         { text: 'OK', onPress: () => { /* dispatch clearError */ } }
     ]);
  }

  const isRTL = currentLanguage === 'ar';

  // Step 1 State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 State
  const [step, setStep] = useState(1);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [phone, setPhone] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fonts
  const fontRegular = isRTL ? Fonts.arabicRegular : Fonts.regular;
  const fontMedium = isRTL ? Fonts.arabicMedium : Fonts.medium;
  const fontSemiBold = isRTL ? Fonts.arabicSemiBold : Fonts.semiBold;
  const fontBold = isRTL ? Fonts.arabicBold : Fonts.bold;

  const handleNextStep = () => {
    if (!name || !email || !password) {
      Alert.alert(t('common.error'), t('auth.register.fillAllFields') || 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert(t('common.error'), 'Password must be at least 6 characters');
      return;
    }
    setStep(2);
  };

  const handleRegister = async () => {
    if (!gender || !agreedToTerms) {
       Alert.alert(t('common.error'), 'Please select gender and agree to terms');
       return;
    }

    setIsSubmitting(true);

    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          fullName: name,
          age: age ? parseInt(age) : null,
          gender,
          phone 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(t('common.error'), data.error || 'Registration failed');
        return;
      }

      // Success - redirect to OTP verification, passing extra user details if backend sends email only
      router.push({ 
        pathname: '/auth/verify-email', 
        params: { email, fullName: name, age: age || undefined, gender, phone } 
      });

    } catch (e) {
      console.error('Registration Error:', e);
      Alert.alert(t('common.error'), 'Unable to connect to server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSmallScreen = SCREEN_HEIGHT < 700;
  
  // Dynamic Background Gradient
  const gradientColors = (isDark 
    ? [colors.background, '#1A1A2E', colors.background]
    : [colors.background, colors.surface, colors.background]) as [string, string, string];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={gradientColors} style={styles.gradient} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View style={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
            
            {/* Back Button */}
            <Animated.View entering={FadeInUp.delay(100)}>
              <Pressable 
                onPress={() => step === 2 ? setStep(1) : router.back()} 
                style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
              >
                <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text.primary} />
              </Pressable>
            </Animated.View>

            {/* Header */}
            <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
              <Text style={[styles.title, { fontFamily: fontBold, color: colors.text.primary }, isSmallScreen && styles.titleSmall]}>
                {step === 1 ? t('auth.register.title') : 'About You'}
              </Text>
              <Text style={[styles.subtitle, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                {step === 1 ? t('auth.register.subtitle') : 'Help us personalize your experience'}
              </Text>
            </Animated.View>

            {/* Form */}
            <Animated.View entering={FadeInDown.delay(300)} style={styles.form}>
              
              {step === 1 ? (
                // STEP 1 FIELDS
                <>
                  <View style={styles.inputWrapper}>
                    <Text style={[styles.inputLabel, { fontFamily: fontMedium, color: colors.text.secondary }]}>{t('auth.register.name')}</Text>
                    <View style={[styles.inputContainer, { backgroundColor: colors.input.background, borderColor: focusedInput === 'name' ? colors.secondary : colors.input.border }]}> 
                      <Ionicons name="person-outline" size={20} color={colors.input.placeholder} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { fontFamily: fontRegular, color: colors.text.primary }]}
                        value={name}
                        onChangeText={setName}
                        placeholder={t('auth.register.namePlaceholder')}
                        placeholderTextColor={colors.input.placeholder}
                        onFocus={() => setFocusedInput('name')}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </View>
                  </View>

                  <View style={styles.inputWrapper}>
                    <Text style={[styles.inputLabel, { fontFamily: fontMedium, color: colors.text.secondary }]}>{t('auth.register.email')}</Text>
                    <View style={[styles.inputContainer, { backgroundColor: colors.input.background, borderColor: focusedInput === 'email' ? colors.secondary : colors.input.border }]}> 
                      <Ionicons name="mail-outline" size={20} color={colors.input.placeholder} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { fontFamily: fontRegular, color: colors.text.primary }]}
                        value={email}
                        onChangeText={setEmail}
                        placeholder={t('auth.register.emailPlaceholder')}
                        placeholderTextColor={colors.input.placeholder}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        onFocus={() => setFocusedInput('email')}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </View>
                  </View>

                  <View style={styles.inputWrapper}>
                    <Text style={[styles.inputLabel, { fontFamily: fontMedium, color: colors.text.secondary }]}>{t('auth.register.password')}</Text>
                    <View style={[styles.inputContainer, { backgroundColor: colors.input.background, borderColor: focusedInput === 'password' ? colors.secondary : colors.input.border }]}> 
                      <Ionicons name="lock-closed-outline" size={20} color={colors.input.placeholder} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { fontFamily: fontRegular, color: colors.text.primary }]}
                        value={password}
                        onChangeText={setPassword}
                        placeholder={t('auth.register.passwordPlaceholder')}
                        placeholderTextColor={colors.input.placeholder}
                        secureTextEntry={!showPassword}
                        onFocus={() => setFocusedInput('password')}
                        onBlur={() => setFocusedInput(null)}
                      />
                      <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                        <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.input.placeholder} />
                      </Pressable>
                    </View>
                  </View>

                   <Pressable 
                    onPress={handleNextStep} 
                    style={({ pressed }) => [styles.registerButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 }]}
                  >
                    <Text style={[styles.registerButtonText, { fontFamily: fontSemiBold, color: '#000' }]}>Next</Text>
                    <Ionicons name="arrow-forward" size={20} color="#000" />
                  </Pressable>
                </>
              ) : (
                // STEP 2 FIELDS
                <>
                  <View style={styles.inputWrapper}>
                    <Text style={[styles.inputLabel, { fontFamily: fontMedium, color: colors.text.secondary }]}>I am a...</Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <Pressable 
                        onPress={() => setGender('male')}
                        style={[
                            styles.genderButton, 
                            { borderColor: gender === 'male' ? colors.secondary : colors.border, backgroundColor: gender === 'male' ? 'rgba(245,198,97,0.1)' : 'transparent' }
                        ]}
                      >
                         <Text style={{ fontSize: 24 }}>🧔‍♂️</Text>
                         <Text style={[styles.genderText, { fontFamily: fontMedium, color: colors.text.primary }]}>Akhi (Brother)</Text>
                      </Pressable>
                      <Pressable 
                        onPress={() => setGender('female')}
                         style={[
                            styles.genderButton, 
                            { borderColor: gender === 'female' ? colors.secondary : colors.border, backgroundColor: gender === 'female' ? 'rgba(245,198,97,0.1)' : 'transparent' }
                        ]}
                      >
                         <Text style={{ fontSize: 24 }}>🧕</Text>
                         <Text style={[styles.genderText, { fontFamily: fontMedium, color: colors.text.primary }]}>Okht (Sister)</Text>
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.inputWrapper}>
                    <Text style={[styles.inputLabel, { fontFamily: fontMedium, color: colors.text.secondary }]}>Age</Text>
                    <View style={[styles.inputContainer, { backgroundColor: colors.input.background, borderColor: focusedInput === 'age' ? colors.secondary : colors.input.border }]}> 
                      <Ionicons name="calendar-outline" size={20} color={colors.input.placeholder} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { fontFamily: fontRegular, color: colors.text.primary }]}
                        value={age}
                        onChangeText={setAge}
                        placeholder="Your Age (Optional)"
                        placeholderTextColor={colors.input.placeholder}
                        keyboardType="numeric"
                        onFocus={() => setFocusedInput('age')}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </View>
                  </View>

                  <View style={styles.inputWrapper}>
                    <Text style={[styles.inputLabel, { fontFamily: fontMedium, color: colors.text.secondary }]}>Phone Number</Text>
                     <View style={[styles.inputContainer, { backgroundColor: colors.input.background, borderColor: focusedInput === 'phone' ? colors.secondary : colors.input.border }]}> 
                      <Ionicons name="call-outline" size={20} color={colors.input.placeholder} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { fontFamily: fontRegular, color: colors.text.primary }]}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Phone Number (Optional)"
                         placeholderTextColor={colors.input.placeholder}
                        keyboardType="phone-pad"
                        onFocus={() => setFocusedInput('phone')}
                        onBlur={() => setFocusedInput(null)}
                      />
                    </View>
                  </View>

                  <Pressable onPress={() => setAgreedToTerms(!agreedToTerms)} style={styles.termsContainer}>
                     <View style={[styles.checkbox, { borderColor: agreedToTerms ? colors.secondary : colors.text.disabled, backgroundColor: agreedToTerms ? colors.secondary : 'transparent' }]}>
                        {agreedToTerms && <Ionicons name="checkmark" size={14} color="#000" />}
                     </View>
                     <Text style={[styles.termsText, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                        I agree to the <Text style={{ color: colors.secondary }}>Terms of Service</Text> and <Text style={{ color: colors.secondary }}>Privacy Policy</Text>
                     </Text>
                  </Pressable>

                  <Pressable 
                    onPress={handleRegister} 
                    disabled={isSubmitting}
                    style={({ pressed }) => [
                      styles.registerButton, 
                      { 
                        backgroundColor: colors.secondary,
                        opacity: pressed ? 0.7 : (isSubmitting ? 0.6 : 1),
                        transform: [{ scale: pressed ? 0.98 : 1 }]
                      }
                    ]}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <>
                        <Text style={[styles.registerButtonText, { fontFamily: fontSemiBold, color: '#000' }]}>
                          {t('auth.register.signUp')}
                        </Text>
                        <Ionicons name="checkmark-done" size={20} color="#000" />
                      </>
                    )}
                  </Pressable>
                </>
              )}
            </Animated.View>

            {/* Divider */}
            {step === 1 && (
            <Animated.View entering={FadeInDown.delay(400)} style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
              <Text style={[styles.dividerText, { fontFamily: fontRegular, color: colors.text.disabled }]}>
                {t('common.or')}
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
            </Animated.View>
            )}

            {/* Social Buttons */}
             {step === 1 && (
            <Animated.View entering={FadeInDown.delay(500)} style={styles.socialContainer}>
               <Pressable 
                style={[styles.socialButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.surface, borderColor: colors.border }]} 
                onPress={handleGoogleLogin}
              >
                <Ionicons name="logo-google" size={22} color={colors.text.primary} />
                <Text style={[styles.socialText, { fontFamily: fontMedium, color: colors.text.primary }]}>
                  {t('auth.social.google')}
                </Text>
              </Pressable>
            </Animated.View>
             )}

            {/* Login Link */}
            <Animated.View entering={FadeInDown.delay(600)} style={styles.loginContainer}>
              <Text style={[styles.loginText, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                {t('auth.register.haveAccount')}{' '}
              </Text>
              <Pressable onPress={() => router.push('/auth/login')}>
                <Text style={[styles.loginLink, { fontFamily: fontSemiBold, color: colors.secondary }]}>
                  {t('auth.register.signIn')}
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    marginBottom: 6,
  },
  titleSmall: {
    fontSize: 22,
  },
  subtitle: {
    fontSize: 15,
  },
  form: {
    marginBottom: 16,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  eyeButton: {
    padding: 4,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  registerButton: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  registerButtonText: {
    fontSize: 17,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    marginHorizontal: 14,
  },
  socialContainer: {
    gap: 12,
  },
  socialButton: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 10,
  },
  socialText: {
    fontSize: 15,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    paddingBottom: 24,
  },
  loginText: {
    fontSize: 15,
  },
  loginLink: {
    fontSize: 15,
  },
  genderButton: {
    flex: 1,
    height: 100,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  genderText: {
    fontSize: 15,
  },
});
