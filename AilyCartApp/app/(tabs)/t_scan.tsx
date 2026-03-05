import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import tw from '../../lib/tailwind';
import { Camera, Zap, Info } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function ScanTab() {
  const router = useRouter();

  const handleStartScan = async () => {
    // Provide haptic feedback for elderly users to confirm the press
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    // Navigate to the full-screen scanning page
    router.push('/scanning');
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-aily-bg`}>
      <View style={tw`flex-1 px-8 justify-center items-center`}>
        
        {/* Header Illustration / Icon Section */}
        <View style={tw`mb-12 items-center`}>
          <View style={tw`bg-blue-50 p-10 rounded-full mb-6`}>
            <Camera size={80} color="#1565C0" strokeWidth={1.5} />
          </View>
          <Text style={tw`text-aily-h1 font-atkinson-bold text-aily-primary text-center`}>
            Receipt Scanner
          </Text>
          <Text style={tw`text-aily-body-lg text-aily-secondary text-center mt-4 font-atkinson`}>
            Take a photo of your grocery receipt to update your inventory automatically.
          </Text>
        </View>

        {/* Main Action Button - Oversized for accessibility */}
        <TouchableOpacity
          onPress={handleStartScan}
          activeOpacity={0.8}
          style={tw`w-full bg-aily-blue py-8 rounded-3xl flex-row justify-center items-center shadow-lg`}
        >
          <Camera size={32} color="white" style={tw`mr-3`} />
          <Text style={tw`text-white text-aily-action font-atkinson-bold`}>
            START SCANNING
          </Text>
        </TouchableOpacity>

        {/* Tips Section for elderly users */}
        <View style={tw`mt-12 bg-gray-50 p-6 rounded-2xl w-full border border-gray-100`}>
          <View style={tw`flex-row items-center mb-3`}>
            <Info size={20} color="#595959" />
            <Text style={tw`ml-2 text-aily-body-sm font-atkinson-bold text-aily-secondary`}>
              Tips for better results:
            </Text>
          </View>
          
          <View style={tw`flex-row items-start mb-2`}>
            <Zap size={16} color="#1565C0" style={tw`mt-1 mr-2`} />
            <Text style={tw`flex-1 text-aily-body-sm text-aily-secondary font-atkinson`}>
              Ensure the receipt is flat and in a bright room.
            </Text>
          </View>

          <View style={tw`flex-row items-start`}>
            <Zap size={16} color="#1565C0" style={tw`mt-1 mr-2`} />
            <Text style={tw`flex-1 text-aily-body-sm text-aily-secondary font-atkinson`}>
              Try to capture the entire receipt from top to bottom.
            </Text>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}