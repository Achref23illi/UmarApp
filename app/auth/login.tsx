import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthTabs } from '@/components/auth/AuthTabs';
import { Images } from '@/config/assets';
import { Colors } from '@/config/colors';
import { Fonts } from '@/hooks/use-fonts';
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginUser } from '@/store/slices/userSlice';
import { checkUserProviders } from '@/utils/auth-checks';

const PURPLE = Colors.palette.purple.primary;
const PURPLE_DARK = Colors.palette.purple.dark;
const PURPLE_LIGHT = Colors.palette.purple.light;
const GOLD = Colors.palette.gold.primary;
const WHITE = Colors.palette.neutral.white;

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { isLoading, error } = useAppSelector((state) => state.user);
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  const { handleGoogleLogin } = useGoogleAuth();
  
  useEffect(() => {
    if (!error) return;
    Alert.alert(t('common.error'), error, [{ text: 'OK' }]);
  }, [error, t]);

  const isRTL = currentLanguage === 'ar';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'email' | 'password' | null>(null);

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

  return (
    <View style={styles.container}>
      <LinearGradient colors={[PURPLE_LIGHT, PURPLE, PURPLE_DARK]} style={styles.gradient} />
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={[styles.content, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 18 }]}>
          {/* Brand */}
          <Animated.View entering={FadeInDown.duration(450)} style={styles.header}>
            <Image
              source={Images.logoWhite}
              style={styles.logo}
              contentFit="contain"
            />
          </Animated.View>

          {/* Tabs */}
          <Animated.View entering={FadeInDown.delay(80).duration(450)} style={styles.tabs}>
            <AuthTabs
              active="login"
              labels={tabLabels}
              onChange={(tab) => {
                if (tab === 'register') router.replace('/auth/register');
              }}
            />
          </Animated.View>

          {/* Card */}
          <Animated.View entering={FadeInDown.delay(160).duration(450)} style={styles.card}>
            <Text style={[styles.cardTitle, { fontFamily: fontBold }]}>{t('auth.login.title')}</Text>
            <Text style={[styles.cardSubtitle, { fontFamily: fontRegular }]}>{t('auth.login.subtitle')}</Text>

            <View style={[styles.field, focusedInput === 'email' && styles.fieldFocused]}>
              <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.9)" />
              <TextInput
                style={[styles.input, { fontFamily: fontRegular }]}
                value={email}
                onChangeText={setEmail}
                placeholder={t('auth.login.emailPlaceholder')}
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
                placeholder={t('auth.login.passwordPlaceholder')}
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

            <View style={styles.actionsRow}>
              <Pressable onPress={() => router.push('/auth/forgot-password')} hitSlop={10}>
                <Text style={[styles.link, { fontFamily: fontMedium }]}>{t('auth.login.forgotPassword')}</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={handleLogin}
              disabled={isLoading}
              style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed, isLoading && styles.ctaDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Text style={[styles.ctaText, { fontFamily: fontSemiBold }]}>{t('auth.login.signIn')}</Text>
                  <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={20} color="#000" />
                </>
              )}
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={[styles.dividerText, { fontFamily: fontRegular }]}>{t('common.or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <Pressable onPress={handleGoogleLogin} style={({ pressed }) => [styles.socialButton, pressed && styles.socialPressed]}>
                <Ionicons name="logo-google" size={20} color={WHITE} />
              </Pressable>
              <Pressable disabled style={styles.socialButtonDisabled}>
                <Ionicons name="logo-apple" size={20} color="rgba(255,255,255,0.45)" />
              </Pressable>
              <Pressable disabled style={styles.socialButtonDisabled}>
                <Ionicons name="logo-facebook" size={20} color="rgba(255,255,255,0.45)" />
              </Pressable>
            </View>

            <View style={styles.bottomRow}>
              <Text style={[styles.bottomText, { fontFamily: fontRegular }]}>{t('auth.login.noAccount')}</Text>
              <Pressable onPress={() => router.replace('/auth/register')} hitSlop={10}>
                <Text style={[styles.bottomLink, { fontFamily: fontSemiBold }]}>{t('auth.login.signUp')}</Text>
              </Pressable>
            </View>
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
  input: {
    flex: 1,
    fontSize: 15,
    color: WHITE,
    paddingVertical: 4,
  },
  eyeButton: {
    padding: 4,
  },
  actionsRow: {
    alignItems: 'flex-end',
    marginTop: -6,
    marginBottom: 14,
  },
  link: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    textDecorationLine: 'underline',
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginBottom: 16,
  },
  socialButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialPressed: {
    opacity: 0.92,
  },
  socialButtonDisabled: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.8,
  },
  bottomRow: {
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
