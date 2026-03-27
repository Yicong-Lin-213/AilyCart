// components/GlobalStatusBar.tsx
import { View, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTask } from '@/context/task-context';
import tw from '@/lib/tailwind';
import { ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { AilyText as Text } from '@/components/ui/AilyText';

export function GlobalStatusBar() {
  const { status, progressText, resetTask } = useTask();
  const router = useRouter();

  if (status === 'idle') return null;

  const handlePress = () => {
    console.debug("Status Bar Pressed, current status:", status);
    if (status === 'success') {
      router.push('/results');
      // setTimeout(() => resetTask(), 200);
    }
  };

  const bgColor = status === 'error' ? 'bg-aily-red' : status === 'success' ? 'bg-aily-green' : 'bg-aily-blue';

  return (
    <TouchableOpacity 
      activeOpacity={status === 'success' ? 0.8 : 1}
      onPress={handlePress}
      style={[
        tw`absolute z-50 flex-row items-center px-6 pb-4 pt-4 ${bgColor} shadow-lg border-width-2 rounded-full`,
        {
          bottom: 10 + (Platform.OS === 'ios' ? 100 : 80),
          right: 20,
          maxWidth: '70%'
        }
      ]}
    >
      <View style={tw`flex-1 flex-row items-center`}>
        {status === 'uploading' || status === 'analyzing' ? (
          <ActivityIndicator size="small" color="white" style={tw`mr-3`} />
        ) : status === 'success' ? (
          <CheckCircle2 size={20} color="white" style={tw`mr-3`} />
        ) : (
          <AlertCircle size={20} color="white" style={tw`mr-3`} />
        )}
        
        <Text 
          maxFontSizeMultiplier={1.3}
          numberOfLines={1}
          style={tw`text-white font-atkinson-bold text-aily-body-lg`}
        >
          {progressText}
        </Text>
      </View>

      {status === 'success' && (
        <View style={tw`flex-row items-center`}>
          <Text style={tw`text-white text-aily-body-sm mr-1 underline`}>View</Text>
          <ChevronRight size={20} color="white" />
        </View>
      )}

      {status === 'error' && (
        <TouchableOpacity onPress={resetTask}>
          <Text style={tw`text-white underline ml-2`}>Close</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}