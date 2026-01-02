import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { useAppSelector } from '@/store/hooks';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const isRTL = currentLanguage === 'ar';
  const { colors, isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // Fonts
  const fontRegular = isRTL ? Fonts.arabicRegular : Fonts.regular;
  const fontMedium = isRTL ? Fonts.arabicMedium : Fonts.medium;
  const fontSemiBold = isRTL ? Fonts.arabicSemiBold : Fonts.semiBold;
  const fontBold = isRTL ? Fonts.arabicBold : Fonts.bold;

  const handleSendReset = () => {
    // TODO: Implement password reset logic
    setSent(true);
  };

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
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
            <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(245,198,97,0.1)' : colors.surfaceHighlight }]}>
              <Ionicons name="key-outline" size={50} color={colors.secondary} />
            </View>
            <Text style={[styles.title, { fontFamily: fontBold, color: colors.text.primary }]}>
              {t('auth.forgotPassword.title')}
            </Text>
            <Text style={[styles.subtitle, { fontFamily: fontRegular, color: colors.text.secondary }]}>
              {t('auth.forgotPassword.subtitle')}
            </Text>
          </Animated.View>

          {!sent ? (
            <>
              {/* Form */}
              <Animated.View entering={FadeInDown.delay(300)} style={styles.form}>
                {/* Email Input */}
                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { fontFamily: fontMedium, color: colors.text.secondary }]}>
                    {t('auth.forgotPassword.email')}
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
                      placeholder={t('auth.forgotPassword.emailPlaceholder')}
                      placeholderTextColor={colors.input.placeholder}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onFocus={() => setFocusedInput('email')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </View>
                </View>

                {/* Send Button */}
                <Pressable onPress={handleSendReset} style={[styles.sendButton, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.sendButtonText, { fontFamily: fontSemiBold, color: '#000' }]}>
                    {t('auth.forgotPassword.send')}
                  </Text>
                  <Ionicons name="paper-plane-outline" size={20} color="#000" />
                </Pressable>
              </Animated.View>
            </>
          ) : (
            /* Success State */
            <Animated.View entering={FadeInDown.delay(300)} style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={80} color={colors.secondary} />
              </View>
              <Text style={[styles.successTitle, { fontFamily: fontSemiBold, color: colors.text.primary }]}>
                Check Your Email
              </Text>
              <Text style={[styles.successText, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                We've sent a password reset link to {email}
              </Text>
              <Pressable 
                onPress={() => router.push('/auth/login')} 
                style={[styles.backToLoginButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.surfaceHighlight }]}
              >
                <Text style={[styles.backToLoginText, { fontFamily: fontMedium, color: colors.text.primary }]}>
                  {t('auth.forgotPassword.backToLogin')}
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Back to Login Link */}
          {!sent && (
            <Animated.View entering={FadeInDown.delay(400)} style={styles.loginContainer}>
              <Pressable onPress={() => router.push('/auth/login')}>
                <Text style={[styles.loginLink, { fontFamily: fontMedium, color: colors.secondary }]}>
                  {t('auth.forgotPassword.backToLogin')}
                </Text>
              </Pressable>
            </Animated.View>
          )}

          <View style={{ height: insets.bottom + 20 }} />
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
  scrollContent: {
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  sendButton: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sendButtonText: {
    fontSize: 18,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  backToLoginButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  backToLoginText: {
    fontSize: 16,
  },
  loginContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  loginLink: {
    fontSize: 16,
  },
});
