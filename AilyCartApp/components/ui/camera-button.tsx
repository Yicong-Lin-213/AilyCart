import React, { useState } from 'react';
import { Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import tw from '../../lib/tailwind';

interface CameraButtonProps {
    onPress: () => void;
}

const CameraButton : React.FC<CameraButtonProps> = ({ onPress }) => {
    const [isPressed, setIsPressed] = useState(false);

    const borderData = "M4,4h3l2-2h6l2,2h3c1.1,0,2,0.9,2,2v12c0,1.1-0.9,2-2,2H4c-1.1,0-2-0.9-2-2V6C2,4.9,2.9,4,4,4z";
    const pathData = "M4,4h3l2-2h6l2,2h3c1.1,0,2,0.9,2,2v12c0,1.1-0.9,2-2,2H4c-1.1,0-2-0.9-2-2V6C2,4.9,2.9,4,4,4z M12,8.5 c-2.48,0-4.5,2.02-4.5,4.5s2.02,4.5,4.5,4.5s4.5-2.02,4.5-4.5S14.48,8.5,12,8.5z M12,16c-1.65,0-3-1.35-3-3s1.35-3,3-3s3,1.35,3,3 S13.65,16,12,16z M18.5,8c0.83,0,1.5-0.67,1.5-1.5S19.33,5,18.5,5S17,5.67,17,6.5S17.67,8,18.5,8z";

    const strokeColor = isPressed ? tw.color('aily-primary') : tw.color('aily-secondary');

    return (
        <Pressable
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            style={tw`w-36 h-28 items-center justify-center shadow-lg`}
            onPress={onPress}
        >
            <Svg width="128" height="128" viewBox="0 0 24 24">
                <Path
                    d={borderData}
                    fill="transparent"
                    stroke={strokeColor}
                    strokeWidth="1"
                    strokeLinejoin='round'
                />
                <Path d={pathData} fill={tw.color('aily-blue')} />
            </Svg>
        </Pressable>
    );
}

export default CameraButton;