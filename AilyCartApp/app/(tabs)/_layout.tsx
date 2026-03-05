import { Tabs } from 'expo-router';
import { ClipboardList, Camera, UserCircle } from 'lucide-react-native';
import tw from '../../lib/tailwind';
import { Platform, View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{        
        tabBarActiveTintColor: '#1565C0',         
        tabBarInactiveTintColor: '#595959',
        tabBarStyle: {
          ...tw`bg-white border-t border-gray-100`,
          height: Platform.OS === 'ios' ? 100 : 80,
          paddingBottom: Platform.OS === 'ios' ? 30 : 15,
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