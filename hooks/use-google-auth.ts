
import { supabase } from '@/lib/supabase';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const router = useRouter();

  const handleGoogleLogin = async () => {
    try {
      // Create redirect URL: umarapp://google-auth
      const redirectUrl = Linking.createURL('google-auth', { scheme: 'umarapp' });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (!data?.url) return;

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type === 'success' && result.url) {
        // Parse the URL to get the code (PKCE flow)
        // URL Format: umarapp://google-auth?code=...
        const parsed = Linking.parse(result.url);

        if (parsed.queryParams?.code) {
          const { error: sessionError } = await supabase.auth.exchangeCodeForSession(
            parsed.queryParams.code as string
          );

          if (sessionError) throw sessionError;

          router.replace('/(tabs)');
        } else if (parsed.queryParams?.error) {
          throw new Error(
            (parsed.queryParams.error_description as string) || 'Authentication failed'
          );
        }
      }
    } catch (e: any) {
      console.error(e);
      Alert.alert('Login Failed', e.message || 'Could not sign in with Google');
    }
  };

  return { handleGoogleLogin };
};
