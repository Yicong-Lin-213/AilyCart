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
import 'react-native-reanimated';
import { useFonts, AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold } from '@expo-google-fonts/atkinson-hyperlegible';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase-client';
import { Session } from '@supabase/supabase-js';
import { UserProvider } from '../context/user-context';
import tw from '../lib/tailwind';
import { View, ActivityIndicator, TextInput, Pressable, Image, Animated, Dimensions } from 'react-native';
import { TaskProvider } from '@/context/task-context';
import { GlobalStatusBar } from '@/components/ui/global-statusbar';
import { AilyText as Text } from '@/components/ui/AilyText';

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

  const [splashVisible, setSplashVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const screenHeight = Dimensions.get('window').height;

  const hideSplashManual = async () => {
    if (splashVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -screenHeight,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start(async () => {
        setSplashVisible(false);
        await SplashScreen.hideAsync();
      });
    }
  }

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
      SplashScreen.hideAsync().catch(console.warn);

      const timer = setTimeout(async () => {
        hideSplashManual();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  if (splashVisible) {
    console.log(`splashVisible=${splashVisible}`);
    return (
      <Animated.View style={[tw`flex-1 bg-aily-bg justify-center items-center py-20`,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}>
        <Pressable
          style={tw`flex-1 w-full justify-center items-center`}
          onPress={hideSplashManual}
        >
          <View style={tw`items-center px-10`}>
            <Image
              source={require('../assets/images/logo-notext.png')}
              style={{ width: 110, height: 110, marginBottom: 28, resizeMode: 'contain' }}
            />
            <Text style={tw`text-aily-h1 text-aily-blue tracking-tighter text-center font-atkinson-bold`}>
              AilyCart
            </Text>
            <Text style={tw`text-aily-h2 mt-4 text-slate-500 text-center leading-6 font-atkinson`}>
              An AI-powered accessibility assistant
            </Text>
          </View>

          <View style={tw`items-center w-full mt-4`}>
            <Text style={tw`text-slate-400 text-aily-body-lg uppercase tracking-[0.25em] text-center px-6 font-atkinson`}>
              Bridging the data gap for seniors
            </Text>

            <Text style={tw`text-slate-300 text-aily-body-sm mt-50 uppercase tracking-[0.15em] font-atkinson`}>
              © 2026 Yicong Lin
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    );
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
