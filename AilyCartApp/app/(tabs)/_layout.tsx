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

import { Tabs } from 'expo-router';
import { ClipboardList, Camera, UserCircle } from 'lucide-react-native';
import tw from '../../lib/tailwind';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{        
        tabBarActiveTintColor: '#1565C0',         
        tabBarInactiveTintColor: '#595959',
        tabBarStyle: {
          ...tw`bg-white border-t border-gray-100`,
          height: Platform.OS === 'ios' ? 100 : 80 + insets.bottom,
          paddingBottom: Platform.OS === 'ios' ? 30 : Math.max(insets.bottom, 15),
          paddingTop: 10,
        },
        
        tabBarLabelStyle: {
          ...tw`font-atkinson-bold text-aily-body-sm`,
          marginTop: 4,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="t_inventory"
        options={{
          title: 'Inventory',
          tabBarLabel: 'Inventory',
          tabBarIcon: ({ color, size }) => (
            <ClipboardList size={32} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="t_scan"
        options={{
          title: 'Scan',
          tabBarLabel: 'Scan',
          tabBarIcon: ({ focused, color, size }) => (
            <View style={[tw`items-center justify-center rounded-full`, 
              focused ? tw`bg-blue-100 w-16 h-16 -mt-6 shadow-md` : tw`w-12 h-12`
            ]}>
              <Camera size={focused ? 36 : 32} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="t_me"
        options={{
          title: 'Me',
          tabBarLabel: 'Me',
          tabBarIcon: ({ color, size }) => (
            <UserCircle size={32} color={color} strokeWidth={2.5} />
          ),
        }}
      />
    </Tabs>
  );
}