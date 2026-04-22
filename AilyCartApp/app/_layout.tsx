// Copyright 2026 Yicong Lin
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     https://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useFonts, AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold } from '@expo-google-fonts/atkinson-hyperlegible';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase-client';
import { Session } from '@supabase/supabase-js';
import { UserProvider } from '../context/user-context';
import tw from '../lib/tailwind';
import { View, ActivityIndicator, TextInput } from 'react-native';
import { TaskProvider, useTask } from '@/context/task-context';
import { GlobalStatusBar } from '@/components/ui/global-statusbar';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

if ((TextInput as any).defaultProps) {
  (TextInput as any).defaultProps.maxFontSizeMultiplier = 1.4;
} else {
  (TextInput as any).defaultProps = { maxFontSizeMultiplier: 1.4 };
}

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
      const timer = setTimeout(async () => {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          console.warn(e);
        }
      }, 5000);
      // SplashScreen.hideAsync();
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
        <TaskProvider>
          <Stack screenOptions={{ headerShown: false }} initialRouteName="(tabs)">
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen name="auth" options={{ animation: 'none' }} />
            <Stack.Screen name="scanning" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="results" options={{ presentation: 'fullScreenModal' }} />
          </Stack>
          {/* <StatusBar style="auto" translucent={true} /> */}
          <GlobalStatusBar />
        </TaskProvider>
      </UserProvider>
    </SafeAreaProvider>
  );
}
