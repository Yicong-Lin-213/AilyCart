import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import tw from '../lib/tailwind';
import { SCAN_PHASES } from '../constants/scan-steps';
import { useState } from 'react';
import Svg, { Path } from 'react-native-svg';

export default function Welcome() {
    const router = useRouter();
    const [phase, setPhase] = useState(SCAN_PHASES.HELLO);
    const [userName] = useState("Maggie");

    return (
        <View style={tw`flex-1 items-center justify-around bg-aily-bg py-50`}>
            <Text style={tw`text-[32px] font-atkinson-bold text-aily-primary text-center leading-tight`}>
                Hello, {userName.toString()}.{"\n"}Ready to scan?
            </Text>

            <View style={tw`flex-1 items-center justify-center`}>
                <Pressable
                    style={({ pressed }) => [
                        tw`w-36 h-28 bg-aily-blue rounded-[32px] items-center justify-center shadow-lg`,
                        pressed && tw`scale-90`
                    ]}
                    onPress={() => router.push("/scanning")}
                >
                    {/* Camera Icon */}
                    <Svg width="64" height="64" viewBox="0 0 24 24" fill="white">
                        <Path d="M4 4h3l2-2h6l2 2h3a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm8 15a5 5 0 100-10 5 5 0 000 10z" />
                    </Svg>
                </Pressable>
                <Text style={tw`text-aily-primary text-aily-body-lg font-atkinson-bold text-center py-4`}>Scan Receipt</Text>
            </View>
        </View>
    );
}