import React from 'react';
import { TouchableOpacity } from 'react-native';
import tw from '../../lib/tailwind';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { AilyText as Text } from '@/components/ui/AilyText';

interface ExpandButtonProps {
    onPress: () => void;
    isExpanded: boolean;
    count: number;
}

const ExpandButton : React.FC<ExpandButtonProps> = ({ isExpanded, onPress, count }) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={tw`flex-row items-center justify-center py-3 bg-gray-50 rounded-2xl border border-gray-100 mb-2`}
        >
            <Text style={tw`text-aily-blue text-aily-body-sm font-atkinson-bold mr-2`}>
                {isExpanded ? "Show Less" : `Show All (+${count})`}
            </Text>
            {isExpanded ? (
                <ChevronUp size={32} color={tw.color('aily-blue')} />
            ) : (
                <ChevronDown size={32} color={tw.color('aily-blue')} />
            )}
        </TouchableOpacity>
    );
}

export default ExpandButton;