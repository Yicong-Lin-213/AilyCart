import { View, Text, Pressable, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import tw from '../lib/tailwind';
import { SCAN_PHASES } from '../constants/scan-steps';
import { useState } from 'react';
import Svg, { Path } from 'react-native-svg';
import { useUser } from '../context/user-context';
import { supabase } from '@/lib/supabase-client';

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
                <Pressable
                    style={({ pressed }) => [
                        tw`w-36 h-28 bg-aily-blue rounded-[20px] items-center justify-center shadow-lg`,
                        pressed && tw`scale-90`
                    ]}
                    onPress={() => router.push("/scanning")}
                >
                    {/* Camera Icon */}
                    <Svg width="64" height="64" viewBox="0 0 24 24" fill="white">
                        <Path d="M4 4h3l2-2h6l2 2h3a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm8 15a5 5 0 100-10 5 5 0 000 10z" />
                    </Svg>
                </Pressable>
                <Text style={tw`text-aily-primary text-aily-action font-atkinson-bold text-center py-4 w-full`}>Scan Receipt</Text>
            </View>
        </View>
    );
}