import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import tw from '../lib/tailwind';
import { SCAN_PHASES } from '../constants/scan-steps';
import { useState } from 'react';
import { useUser } from '../context/user-context';
import { supabase } from '@/lib/supabase-client';
import CameraButton from '@/components/ui/camera-button';

export default function Welcome() {
    const router = useRouter();
    const [phase, setPhase] = useState(SCAN_PHASES.HELLO);
    const { displayName, loading } = useUser();

    const onLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error("Logout error:", error);
    };

    return (
        <View style={tw`flex-1 items-center justify-around bg-aily-bg py-50`}>
            {/* Logout Button */}
            <TouchableOpacity
                onPress={onLogout}
                style={tw`absolute top-16 right-8 p-4 bg-aily-bg`}
            >
                <Text style={tw`text-aily-secondary text-aily-body-lg font-atkinson-bold text-center underline`}>Logout</Text>
            </TouchableOpacity>

            <Text style={tw`text-aily-h1 font-atkinson-bold text-aily-primary text-center leading-tight w-full`}>
                {loading ? " Loading..." : `Hello, ${displayName}.\nReady to scan?`}
            </Text>

            <View style={tw`flex-1 items-center justify-center w-full`}>
                <CameraButton onPress={()=>router.push('/scanning')} />
                <Text style={tw`text-aily-primary text-aily-action font-atkinson-bold text-center w-full`}>Scan Receipt</Text>
            </View>
        </View>
    );
}