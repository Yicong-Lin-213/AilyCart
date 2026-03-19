import { Text, TextProps } from 'react-native';

export function AilyText(props: TextProps) {
  return (
    <Text 
      {...props} 
      maxFontSizeMultiplier={props.maxFontSizeMultiplier || 1.4} 
    />
  );
}