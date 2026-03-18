import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack, Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useFonts, AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold } from '@expo-google-fonts/atkinson-hyperlegible';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase-client';
import { Session } from '@supabase/supabase-js';
import { UserProvider } from '../context/user-context';
import tw from '../lib/tailwind';
import { View, ActivityIndicator } from 'react-native';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
  });

  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    console.log("Check session:", !!session, "Segments:", segments, "Initialized:", initialized);
    if (!initialized || !loaded) return;

    const isAuth = segments[0] === 'auth';
    const isTabs = segments[0] === '(tabs)';
    const isScanning = segments[0] === 'scanning';
    const isResults = segments[0] === 'results';

    if (session) {
      if (!isTabs && !isScanning && !isResults) {
        console.log("Redirecting to /t_inventory...");
        router.replace('/(tabs)/t_inventory');
      }
    } else {
      if (!isAuth) {
        console.log("Redirecting to /auth...");
        router.replace('/auth');
      }
    }
  }, [session, initialized, segments, loaded]);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  if (!initialized) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-aily-bg`}>
        <ActivityIndicator size="large" color="#1565C0" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <UserProvider>
        <Stack screenOptions={{ headerShown: false }} initialRouteName="(tabs)">
          <Stack.Screen name="(tabs)" options={{animation: 'fade'}} />
          <Stack.Screen name="auth" options={{animation: 'none'}} />
          <Stack.Screen name="scanning" options={{presentation: 'fullScreenModal'}} />
          <Stack.Screen name="results" options={{presentation: 'fullScreenModal'}}  />
        </Stack>
        <StatusBar style="auto" />
      </UserProvider>
    </SafeAreaProvider>
  );
}
