import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';

export default function VerifyEmailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { email, fullName, age, gender, phone } = useLocalSearchParams<{ 
    email: string;
    fullName: string;
    age?: string;
    gender?: string;
    phone?: string;
  }>();
  const { colors } = useTheme();

  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const fontRegular = Fonts.regular;
  const fontMedium = Fonts.medium;
  const fontSemiBold = Fonts.semiBold;
  const fontBold = Fonts.bold;

  const handleVerify = async () => {
    if (!code || code.length < 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit code');
      return;
    }

    setIsVerifying(true);
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          code,
          fullName,
          age: age ? parseInt(age) : null,
          gender,
          phone
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        Alert.alert('Error', data.error || 'Verification failed');
        return;
      }

      // Success - account created
      Alert.alert(
        'Success!',
        'Your account has been created. You can now log in.',
        [{ text: 'Log In', onPress: () => router.replace('/auth/login') }]
      );

    } catch (error) {
      Alert.alert('Error', 'Unable to connect to server');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
      } else {
        const data = await response.json();
        Alert.alert('Error', data.error || 'Failed to resend code');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to connect to server');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
            
            {/* Back Button */}
            <Animated.View entering={FadeInUp.delay(100)}>
              <Pressable 
                onPress={() => router.back()} 
                style={[styles.backButton, { backgroundColor: colors.surface }]}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
              </Pressable>
            </Animated.View>

            {/* Icon */}
            <Animated.View entering={FadeInDown.delay(150)} style={styles.iconContainer}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="mail" size={48} color={colors.primary} />
              </View>
            </Animated.View>

            {/* Header */}
            <Animated.View entering={FadeInDown.delay(200)} style={styles.header}>
              <Text style={[styles.title, { fontFamily: fontBold, color: colors.text.primary }]}>
                Verify Your Email
              </Text>
              <Text style={[styles.subtitle, { fontFamily: fontRegular, color: colors.text.secondary }]}>
                We've sent a 6-digit code to{'\n'}
                <Text style={{ color: colors.secondary, fontFamily: fontMedium }}>{email}</Text>
              </Text>
            </Animated.View>

            {/* Input */}
            <Animated.View entering={FadeInDown.delay(300)} style={styles.form}>
              <View style={[styles.inputContainer, { backgroundColor: colors.input.background, borderColor: colors.input.border }]}>
                <TextInput
                  style={[styles.input, { fontFamily: fontSemiBold, color: colors.text.primary }]}
                  value={code}
                  onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ''))}
                  placeholder="000000"
                  placeholderTextColor={colors.input.placeholder}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />
              </View>

              <Pressable
                onPress={handleVerify}
                disabled={isVerifying || code.length < 6}
                style={({ pressed }) => [
                  styles.button,
                  { 
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.7 : (isVerifying || code.length < 6 ? 0.5 : 1),
                  }
                ]}
              >
                {isVerifying ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={[styles.buttonText, { fontFamily: fontSemiBold }]}>
                    Verify & Create Account
                  </Text>
                )}
              </Pressable>

              <Pressable 
                onPress={handleResend} 
                disabled={isResending}
                style={styles.resendButton}
              >
                {isResending ? (
                  <ActivityIndicator size="small" color={colors.secondary} />
                ) : (
                  <Text style={[styles.resendText, { fontFamily: fontMedium, color: colors.secondary }]}>
                    Didn't receive the code? Resend
                  </Text>
                )}
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
    marginBottom: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    height: 64,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  input: {
    fontSize: 28,
    textAlign: 'center',
    letterSpacing: 12,
  },
  button: {
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 17,
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 15,
  },
});
