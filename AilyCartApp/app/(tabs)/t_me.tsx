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

import React, { useState, useEffect } from 'react';
import { 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Switch, 
  LayoutAnimation, 
  Platform, 
  UIManager,
  StyleSheet
} from 'react-native';
import { supabase } from '../../lib/supabase-client';
import tw from '../../lib/tailwind';
import { useUser } from '../../context/user-context';
import { 
  User, 
  LogOut, 
  ChevronDown, 
  ChevronUp, 
  Settings, 
  Bell, 
  ShieldCheck, 
  Trash2, 
  Download,
  Volume2,
  Type
} from 'lucide-react-native';
import { AilyText as Text } from '@/components/ui/AilyText';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function MeTab() {
  const { displayName, loading, userId } = useUser();
  
  // --- UI States ---
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  // --- Functional States (Preferences) ---
  const [isLargeText, setIsLargeText] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  /**
   * Toggle collapse section with smooth animation
   * @param sectionId The ID of the section to toggle
   */
  const toggleSection = (sectionId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  /**
   * Handle user logout via Supabase
   */
  const onLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  /**
   * Reusable Collapse Item Component
   */
  const CollapseItem = ({ icon: Icon, label, sectionId, children }: any) => {
    const isExpanded = expandedSection === sectionId;
    return (
      <View style={tw`mb-3 overflow-hidden bg-white rounded-3xl border border-gray-100 shadow-sm`}>
        <TouchableOpacity 
          onPress={() => toggleSection(sectionId)}
          activeOpacity={0.7}
          style={tw`flex-row items-center justify-between p-5`}
        >
          <View style={tw`flex-row items-center`}>
            <View style={tw`p-2 rounded-xl bg-blue-50`}>
              <Icon size={22} color="#1565C0" />
            </View>
            <Text style={tw`ml-4 text-aily-body-lg font-atkinson-bold text-aily-primary`}>
              {label}
            </Text>
          </View>
          {isExpanded ? <ChevronUp size={20} color="#595959" /> : <ChevronDown size={20} color="#595959" />}
        </TouchableOpacity>

        {isExpanded && (
          <View style={tw`px-5 pb-5 pt-2 border-t border-gray-50`}>
            {children}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView 
        style={tw`flex-1 bg-aily-bg`} 
        contentContainerStyle={tw`p-6 pt-16 pb-24`}
    >
      {/* Profile Section */}
      <View style={tw`items-center mb-10`}>
        <View style={tw`bg-blue-100 p-6 rounded-full mb-4 shadow-inner`}>
          <User size={60} color="#1565C0" />
        </View>
        <Text style={tw`text-aily-h1 font-atkinson-bold text-aily-primary`}>
          {loading ? "..." : displayName}
        </Text>
        <Text style={tw`text-aily-body-sm text-aily-secondary mt-1 uppercase tracking-widest`}>
            Premium Member
        </Text>
      </View>

      <Text style={tw`text-aily-body-sm font-atkinson-bold text-aily-secondary mb-4 px-2 uppercase`}>
        Application Settings
      </Text>

      {/* 1. Accessibility Implementation */}
      <CollapseItem icon={Settings} label="Accessibility" sectionId="access">
        <View style={tw`gap-4`}>
          {/* Toggle for Large Text Mode */}
          <View style={tw`flex-row justify-between items-center`}>
            <View style={tw`pl-6 flex-row items-center`}>
                <Type size={18} color="#595959" style={tw`mr-2`} />
                <Text style={tw`text-aily-primary text-aily-body-sm`}>Large Text Mode</Text>
            </View>
            <Switch 
              value={isLargeText} 
              onValueChange={setIsLargeText}
              trackColor={{ false: "#E0E0E0", true: "#1565C0" }}
            />
          </View>
          {/* Toggle for AI Voice Feedback */}
          <View style={tw`flex-row justify-between items-center`}>
            <View style={tw`pl-6 flex-row items-center`}>
                <Volume2 size={18} color="#595959" style={tw`mr-2`} />
                <Text style={tw`text-aily-primary text-aily-body-sm`}>Voice Feedback</Text>
            </View>
            <Switch 
              value={isVoiceEnabled} 
              onValueChange={setIsVoiceEnabled}
              trackColor={{ false: "#E0E0E0", true: "#1565C0" }}
            />
          </View>
        </View>
      </CollapseItem>

      {/* 2. Notification Rules Implementation */}
      <CollapseItem icon={Bell} label="Notification Rules" sectionId="notify">
        <View style={tw`gap-4`}>
          <View style={tw`flex-row justify-between items-center`}>
            <View style={tw`flex-1 mr-4`}>
              <Text style={tw`pl-6 text-aily-body-sm text-aily-secondary`}>
                  Receive alerts when essential items are running low
              </Text>
            </View>
            <Switch 
              value={pushEnabled} 
              onValueChange={setPushEnabled}
              trackColor={{ false: "#E0E0E0", true: "#1565C0" }}
            />
          </View>
        </View>
      </CollapseItem>

      {/* 3. Privacy & Security Implementation */}
      <CollapseItem icon={ShieldCheck} label="Privacy & Security" sectionId="privacy">
        <View style={tw`pl-6 gap-3`}>
          {/* Action to clear local application data */}
          <TouchableOpacity 
            style={tw`flex-row items-center p-3 bg-gray-50 rounded-2xl`}
            onPress={() => console.log("Cache cleared")}
          >
            <Trash2 size={18} color={tw.color('aily-red')} />
            <Text style={tw`ml-3 text-aily-red font-atkinson-bold text-aily-body-sm`}>Clear Application Cache</Text>
          </TouchableOpacity>
          {/* Action to export all user data in JSON format */}
          <TouchableOpacity 
            style={tw`flex-row items-center p-3 bg-gray-50 rounded-2xl`}
            onPress={() => console.log("Data exported")}
          >
            <Download size={18} color={tw.color('aily-blue')} />
            <Text style={tw`ml-3 text-aily-blue font-atkinson-bold text-aily-body-sm`}>Export Personal Data (JSON)</Text>
          </TouchableOpacity>
        </View>
      </CollapseItem>

      {/* Sign Out Button */}
      <TouchableOpacity 
        onPress={onLogout}
        activeOpacity={0.8}
        style={tw`flex-row items-center justify-between bg-white p-5 mt-4 rounded-3xl border border-red-100 shadow-sm`}
      >
        <View style={tw`flex-row items-center`}>
          <View style={tw`p-2 rounded-xl bg-red-50`}>
            <LogOut size={22} color="#D32F2F" />
          </View>
          <Text style={tw`ml-4 text-aily-body-lg font-atkinson-bold text-aily-red`}>
              Sign Out
          </Text>
        </View>
      </TouchableOpacity>

      {/* Build Info */}
      <Text style={tw`text-center text-aily-body-sm text-gray-400 mt-12`}>
        AilyCart Version 1.0.5 • Production Build
      </Text>
    </ScrollView>
  );
}