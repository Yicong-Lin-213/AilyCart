import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import tw from '../../lib/tailwind';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const WAVE_PATHS = [
    "M17 10C17.4 10.6 17.6 11.3 17.6 12C17.6 12.7 17.4 13.4 17 14",
    "M19 8C19.8 9.2 20.2 10.6 20.2 12C20.2 13.4 19.8 14.8 19 16",
    "M21 6C22.2 7.8 22.8 10 22.8 12C22.8 14 22.2 16.2 21 18"
];

const WaveLine = ({delay = 0, pathIndex = 0, color = tw.color('aily-blue') }: {delay?: number; pathIndex?: number; color: string | undefined}) => {
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(()=>{
        const animation = Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true })
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [delay]);

    return (
        <AnimatedPath 
            d={WAVE_PATHS[pathIndex]} 
            stroke={color} 
            strokeWidth="1" 
            strokeLinecap="round" 
            opacity={opacity}
            fill="none"
        />
    );
};

interface VoiceButtonProps {
    isPlaying: boolean;
    onPress: () => void;
    size?: number;
    activeColor?: string;
    inactiveColor?: string;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({ 
    isPlaying, 
    onPress,
    size = 45,
    activeColor = tw.color('aily-blue'),
    inactiveColor = tw.color('aily-primary'),
}) => {
    const currentColor = isPlaying ? activeColor : inactiveColor;

    return (
        <TouchableOpacity 
            onPress={onPress} 
            activeOpacity={0.7}
            style={tw`p-2 items-center justify-center`}
        >
            <Svg width={size} height={size} viewBox='0 0 24 24'>
                <G>
                    <Path d="M14.6 3.2L9.2 8.6H4.6V15.4H9.2L14.6 20.8V3.2Z" fill={currentColor}/>
                    {isPlaying && (
                        <>
                        <WaveLine delay={0} pathIndex={0} color={currentColor} />
                        <WaveLine delay={200} pathIndex={1} color={currentColor} />
                        <WaveLine delay={400} pathIndex={2} color={currentColor} />
                        </>
                    )}
                </G>
            </Svg>
        </TouchableOpacity>
    );
}