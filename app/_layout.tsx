import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';

// Import i18n configuration
import '@/locales/i18n';

import { AuthLoader } from '@/components/AuthLoader';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import SplashScreen from '@/components/SplashScreen';
import { useAppFonts } from '@/hooks/use-fonts';
import { useTheme } from '@/hooks/use-theme';
import { QueryProvider } from '@/providers/QueryProvider';
import { store } from '@/store';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';

// ... imports
import i18n from '@/locales/i18n';
import { useAppSelector } from '@/store/hooks';
import { useEffect } from 'react';

function ThemedApp() {
  const { isDark, colors } = useTheme();
  const { fontsLoaded, fontError } = useAppFonts();
  const [isSplashFinished, setIsSplashFinished] = useState(false);
  const currentLanguage = useAppSelector((state) => state.language.currentLanguage);
  
  // Auth & Navigation
  const { isAuthenticated, isAdmin, isLoading: isUserLoading } = useAppSelector((state) => state.user);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (i18n.language !== currentLanguage) {
      i18n.changeLanguage(currentLanguage);
    }
  }, [currentLanguage]);

  useEffect(() => {
    if (!isSplashFinished || !fontsLoaded || isUserLoading) return;

    const inAuthGroup = segments[0] === 'auth' || segments[0] === 'welcome';
    const inAdminGroup = segments[0] === 'admin';
    const inUserGroup = segments[0] === '(tabs)' || segments[0] === 'settings';
    const inProtectedGroup = inAdminGroup || inUserGroup;

    console.log('Navigation check:', { isAuthenticated, isAdmin, segment: segments[0], isUserLoading });

    if (isAuthenticated && inAuthGroup) {
      // Logged in user trying to access auth screens - redirect based on role
      if (isAdmin) {
        router.replace('/admin');
      } else {
        router.replace('/(tabs)');
      }
    } else if (!isAuthenticated && inProtectedGroup) {
      // Not logged in but in protected area - go to welcome
      router.replace('/welcome');
    } else if (isAuthenticated && isAdmin && inUserGroup) {
      // Admin in user area - redirect to admin
      router.replace('/admin');
    }
  }, [isAuthenticated, isAdmin, segments, isSplashFinished, fontsLoaded, isUserLoading]);

  const handleSplashFinish = () => {
    setIsSplashFinished(true);
  };

  if (fontError) {
     console.error("Font loading error", fontError);
  }

  // Create Navigation Theme based on our colors
  const NavTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text.primary,
      border: colors.border,
      notification: colors.secondary,
    },
  };

  return (
    <ThemeProvider value={NavTheme}>
      <AuthLoader>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="welcome" />
            <Stack.Screen name="auth/login" />
            <Stack.Screen name="auth/register" />
            <Stack.Screen name="auth/forgot-password" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="modal"
              options={{
                presentation: 'modal',
                headerShown: true,
                title: 'Modal',
              }}
            />
            {/* New Settings Screen */}
            <Stack.Screen
              name="settings"
              options={{
                presentation: 'card', 
                headerShown: true,
                title: 'Settings',
                 headerStyle: { backgroundColor: colors.surface },
                 headerTintColor: colors.text.primary,
              }}
            />
          </Stack>
          <StatusBar style={isDark ? 'light' : 'dark'} />
        </View>
      </AuthLoader>

      {(!isSplashFinished || !fontsLoaded) && (
        <SplashScreen onFinish={handleSplashFinish} />
      )}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <Provider store={store}>
            <QueryProvider>
               <ThemedApp />
            </QueryProvider>
          </Provider>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
