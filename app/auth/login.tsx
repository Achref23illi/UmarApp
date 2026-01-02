import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Images } from '@/config/assets';
import { Fonts } from '@/hooks/use-fonts';
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { useTheme } from '@/hooks/use-theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginUser } from '@/store/slices/userSlice';
import { checkUserProviders } from '@/utils/auth-checks';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LoginScreen() {
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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Fonts
  const fontRegular = isRTL ? Fonts.arabicRegular : Fonts.regular;
  const fontMedium = isRTL ? Fonts.arabicMedium : Fonts.medium;
  const fontSemiBold = isRTL ? Fonts.arabicSemiBold : Fonts.semiBold;
  const fontBold = isRTL ? Fonts.arabicBold : Fonts.bold;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('auth.login.fillAllFields') || 'Please fill in all fields');
      return;
    }

    try {
      // Check if user should use Google
      const providers = await checkUserProviders(email);
      if (providers && providers.includes('google') && !providers.includes('email')) {
         Alert.alert(
           t('common.attention') || 'Attention', 
           'You previously signed in with Google. Please use the Google button to log in.'
         );
         return;
      }

      const resultAction = await dispatch(loginUser({ email, password }));
      
      if (loginUser.fulfilled.match(resultAction)) {
        // Check if user is admin
        const profile = resultAction.payload.profile;
        if (profile?.is_admin) {
          router.replace('/admin');
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert(t('common.error'), 'An unexpected error occurred');
    }
  };


  // Check if screen is small (for compact layout)
  const isSmallScreen = SCREEN_HEIGHT < 700;

  // Dynamic Background Gradient
  const gradientColors = (isDark 
    ? [colors.background, '#1A1A2E', colors.background]
    : [colors.background, colors.surface, colors.background]) as [string, string, string];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background */}
      <LinearGradient
        colors={gradientColors}
        style={styles.gradient}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
          {/* Back Button */}
          <Animated.View entering={FadeInUp.delay(100)}>
            <Pressable 
              onPress={() => router.back()} 
              style={[styles.backButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
            >
              <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={24} color={colors.text.primary} />
            </Pressable>
          </Animated.View>

          {/* Logo & Header */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
            <Image
              source={Images.logo}
              style={[styles.logo, isSmallScreen && styles.logoSmall]}
              contentFit="contain"
            />
            <Text style={[styles.title, { fontFamily: fontBold, color: colors.text.primary }, isSmallScreen && styles.titleSmall]}>
              {t('auth.login.title')}
            </Text>
            <Text style={[styles.subtitle, { fontFamily: fontRegular, color: colors.text.secondary }]}>
              {t('auth.login.subtitle')}
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View entering={FadeInDown.delay(300)} style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { fontFamily: fontMedium, color: colors.text.secondary }]}>
                {t('auth.login.email')}
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { 
                    backgroundColor: colors.input.background, 
                    borderColor: focusedInput === 'email' ? colors.secondary : colors.input.border 
                  },
                  focusedInput === 'email' && { backgroundColor: isDark ? 'rgba(245,198,97,0.05)' : colors.input.background }
                ]}
              >
                <Ionicons name="mail-outline" size={20} color={colors.input.placeholder} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { fontFamily: fontRegular, color: colors.text.primary }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('auth.login.emailPlaceholder')}
                  placeholderTextColor={colors.input.placeholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <View style={styles.passwordLabelRow}>
                <Text style={[styles.inputLabel, { fontFamily: fontMedium, color: colors.text.secondary }]}>
                  {t('auth.login.password')}
                </Text>
                <Pressable onPress={() => router.push('/auth/forgot-password')}>
                  <Text style={[styles.forgotText, { fontFamily: fontMedium, color: colors.secondary }]}>
                    {t('auth.login.forgotPassword')}
                  </Text>
                </Pressable>
              </View>
              <View
                style={[
                  styles.inputContainer,
                  { 
                    backgroundColor: colors.input.background, 
                    borderColor: focusedInput === 'password' ? colors.secondary : colors.input.border 
                  },
                  focusedInput === 'password' && { backgroundColor: isDark ? 'rgba(245,198,97,0.05)' : colors.input.background }
                ]}
              >
                <Ionicons name="lock-closed-outline" size={20} color={colors.input.placeholder} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { fontFamily: fontRegular, color: colors.text.primary }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('auth.login.passwordPlaceholder')}
                  placeholderTextColor={colors.input.placeholder}
                  secureTextEntry={!showPassword}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.input.placeholder}
                  />
                </Pressable>
              </View>
            </View>

            {/* Login Button */}
            <Pressable onPress={handleLogin} style={[styles.loginButton, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.loginButtonText, { fontFamily: fontSemiBold, color: isDark ? '#000' : '#000' }]}>
                {t('auth.login.signIn')}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#000" />
            </Pressable>
          </Animated.View>

          {/* Divider */}
          <Animated.View entering={FadeInDown.delay(400)} style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
            <Text style={[styles.dividerText, { fontFamily: fontRegular, color: colors.text.disabled }]}>
              {t('common.or')}
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
          </Animated.View>

          {/* Social Buttons - Side by Side */}
          <Animated.View entering={FadeInDown.delay(500)} style={styles.socialContainer}>
            <Pressable 
              style={[styles.socialButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.surface, borderColor: colors.border }]} 
              onPress={handleGoogleLogin}
            >
              <Ionicons name="logo-google" size={22} color={colors.text.primary} />
            </Pressable>

            {/* <Pressable style={styles.socialButton}>
              <Ionicons name="logo-apple" size={22} color={WHITE} />
            </Pressable> */}
          </Animated.View>

          {/* Spacer to push signup to bottom */}
          <View style={styles.spacer} />

          {/* Sign Up Link */}
          <Animated.View entering={FadeInDown.delay(600)} style={styles.signupContainer}>
            <Text style={[styles.signupText, { fontFamily: fontRegular, color: colors.text.secondary }]}>
              {t('auth.login.noAccount')}{' '}
            </Text>
            <Pressable onPress={() => router.push('/auth/register')}>
              <Text style={[styles.signupLink, { fontFamily: fontSemiBold, color: colors.secondary }]}>
                {t('auth.login.signUp')}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
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
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: 16,
  },
  logoSmall: {
    width: 56,
    height: 56,
    marginBottom: 12,
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
    textAlign: 'center',
  },
  form: {
    marginBottom: 16,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
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
  forgotText: {
    fontSize: 13,
  },
  loginButton: {
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
  loginButtonText: {
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    flex: 1,
    minHeight: 16,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  signupText: {
    fontSize: 15,
  },
  signupLink: {
    fontSize: 15,
  },
});
