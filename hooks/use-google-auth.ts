import { showCompleteProfileModal } from '@/components/auth/CompleteProfileModal';
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const APP_SCHEME = 'umarapp';
const OAUTH_PATH = 'google-auth';

/** Redirect URL that works on physical device. Never use localhost when on device. */
function getRedirectUrl(): string {
  const isExpoGo = Constants.appOwnership === 'expo';
  if (isExpoGo) return Linking.createURL(OAUTH_PATH);
  return `${APP_SCHEME}://${OAUTH_PATH}`;
}

export const useGoogleAuth = () => {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    let redirectUrl = getRedirectUrl();
    const isExpoGo = Constants.appOwnership === 'expo';
    const hasLocalhostRedirect = /localhost|127\.0\.0\.1/i.test(redirectUrl);

    if (hasLocalhostRedirect) {
      Alert.alert(
        'Google Sign-In on Device',
        'Google sign-in cannot use localhost on a physical device. Use a development build (npx expo run:ios) so the app uses umarapp://, or in Expo Go start the dev server with: npx expo start --tunnel'
      );
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (!data?.url) return;

      const redirectToFromSupabase = new URL(data.url).searchParams.get('redirect_to');
      if (
        redirectToFromSupabase &&
        /localhost|127\.0\.0\.1/i.test(decodeURIComponent(redirectToFromSupabase))
      ) {
        Alert.alert(
          'Google Sign-In Setup',
          `Supabase is redirecting to localhost (${decodeURIComponent(redirectToFromSupabase)}). Add this redirect URL in Supabase Auth URL configuration: ${redirectUrl}`
        );
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'cancel' || result.type === 'dismiss') {
        return;
      }

      if (result.type !== 'success' || !result.url) {
        throw new Error('Google sign-in did not complete. Please try again.');
      }

      const parsed = Linking.parse(result.url);
      if (parsed.queryParams?.error) {
        throw new Error(
          (parsed.queryParams.error_description as string) || 'Authentication failed'
        );
      }

      const authCode = parsed.queryParams?.code as string | undefined;
      if (!authCode) {
        throw new Error('Missing OAuth code in callback URL.');
      }

      const { error: sessionError } = await supabase.auth.exchangeCodeForSession(authCode);
      if (sessionError) throw sessionError;

      // Trigger the complete-profile modal right away
      showCompleteProfileModal();
      router.replace('/(tabs)');
    } catch (e: any) {
      console.error(e);
      let message = e?.message || 'Could not sign in with Google';
      if (typeof e?.message === 'string' && e.message.includes('redirect_uri_mismatch')) {
        message = `Redirect URI mismatch. In Supabase Dashboard → Authentication → URL Configuration, add: ${redirectUrl}`;
      } else if (typeof e?.message === 'string' && (e.message.includes('timed out') || e.message.includes('Network request'))) {
        message = 'Request timed out. If you saw Safari open "localhost", add umarapp://google-auth in Supabase → Authentication → URL Configuration → Redirect URLs, and set Site URL to umarapp:// (not localhost).';
      }
      Alert.alert('Login Failed', message);
    }
  };

  return { handleGoogleLogin };
};
