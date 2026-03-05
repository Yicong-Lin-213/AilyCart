import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { supabase } from '../../lib/supabase-client';
import tw from '../../lib/tailwind';
import { useUser } from '../../context/user-context';
import { User, LogOut, ChevronRight, Settings, Bell, ShieldCheck } from 'lucide-react-native';

export default function MeTab() {
  const { displayName, loading } = useUser();

  const onLogout = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out of AilyCart?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) console.error("Logout error:", error);
          }
        }
      ]
    );
  };

  // Generic component for menu items to maintain consistency
  const MenuItem = ({ icon: Icon, label, onPress, isDestructive = false }: any) => (
    <TouchableOpacity 
      onPress={onPress}
      activeOpacity={0.7}
      style={tw`flex-row items-center justify-between bg-white p-5 mb-3 rounded-2xl border border-gray-100 shadow-sm`}
    >
      <View style={tw`flex-row items-center`}>
        <Icon size={24} color={isDestructive ? "#D32F2F" : "#1565C0"} />
        <Text style={tw`ml-4 text-aily-body-lg font-atkinson-bold ${isDestructive ? 'text-aily-red' : 'text-aily-primary'}`}>
          {label}
        </Text>
      </View>
      <ChevronRight size={20} color="#595959" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={tw`flex-1 bg-aily-bg`} contentContainerStyle={tw`p-6 pt-16`}>
      {/* Profile Header */}
      <View style={tw`items-center mb-10`}>
        <View style={tw`bg-blue-100 p-6 rounded-full mb-4`}>
          <User size={60} color="#1565C0" />
        </View>
        <Text style={tw`text-aily-h1 font-atkinson-bold text-aily-primary`}>
          {loading ? "Loading..." : displayName}
        </Text>
        <Text style={tw`text-aily-body-sm text-aily-secondary font-atkinson`}>
          AilyCart Premium Member
        </Text>
      </View>

      {/* Settings Sections */}
      <View style={tw`mb-8`}>
        <Text style={tw`text-aily-body-sm font-atkinson-bold text-aily-secondary mb-4 px-2 uppercase`}>
          Preferences
        </Text>
        <MenuItem icon={Settings} label="Accessibility Settings" onPress={() => {}} />
        <MenuItem icon={Bell} label="Notification Rules" onPress={() => {}} />
        <MenuItem icon={ShieldCheck} label="Privacy & Security" onPress={() => {}} />
      </View>

      {/* Danger Zone */}
      <View style={tw`mt-4`}>
        <MenuItem 
          icon={LogOut} 
          label="Sign Out" 
          onPress={onLogout} 
          isDestructive={true} 
        />
      </View>

      {/* App Version Info */}
      <Text style={tw`text-center text-aily-body-sm text-gray-400 font-atkinson mt-10`}>
        AilyCart Version 1.0.2
      </Text>
    </ScrollView>
  );
}