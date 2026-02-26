import { View, Text, TouchableOpacity, Image, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useRef, useCallback } from 'react';
import tw from '../lib/tailwind';
import { CameraView, useCameraPermissions, FlashMode } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { X, Zap } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import DocumentScanner from 'react-native-document-scanner-plugin';

interface FrameLayout {
    x: number;
    y: number;
    width: number;
    height: number;
}

const screen = Dimensions.get('window');

export default function Scanning() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const [capturedUri, setCapturedUri] = useState<string | null>(null);
    const [processedUri, setProcessedUri] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const cameraRef = useRef<CameraView>(null);
    const [flash, setFlash] = useState<FlashMode>('off');
    const [frameLayout, setFrameLayout] = useState<FrameLayout | null>(null);

    const insets = useSafeAreaInsets();

    useFocusEffect(
        useCallback(() => {
            setCapturedUri(null);
            setProcessedUri(null);
            setIsProcessing(false);
        }, [])
    );

    const onFrameLayout = (event: any) => {
        const { x, y, width, height } = event.nativeEvent.layout;
        setFrameLayout({ x, y, width, height });
    };

    const toggleFlash = () => {
        setFlash((current) => {
            if (current === 'off') return 'on';
            if (current === 'on') return 'auto';
            return 'off';
        });
    };

    if (!permission?.granted) {
        return (
            <View style={tw`flex-1 justify-center items-center`}>
                <TouchableOpacity onPress={requestPermission}>
                    <Text style={tw`text-black font-atkinson-bold`}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const takeAndProcessPicture = async () => {
        if (cameraRef.current && frameLayout) {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 1,
                base64: false,
                exif: false,
            });

            setCapturedUri(photo.uri);
            setIsProcessing(true);

            const scale = photo.width / screen.width;
            const cropConfig = {
                originX: frameLayout.x * scale,
                originY: (frameLayout.y + insets.top + 10 + 35 + 16) * scale,   // 10: top bar height, 35: button height, 16: margin
                width: frameLayout.width * scale,
                height: frameLayout.height * scale,
            };

            try {
                const result = await ImageManipulator.manipulateAsync(
                    photo.uri,
                    [{ crop: cropConfig }, { resize: { width: 1200 } }],
                    {
                        format: ImageManipulator.SaveFormat.JPEG,
                        compress: 0.8,
                        base64: false,
                    }
                );

                setProcessedUri(result.uri);
            } catch (error) {
                console.error("Image processing error:", error);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    return (
        <View style={tw`flex-1 bg-black`}>
            {!capturedUri ? (
                <>
                    <CameraView 
                        ref={cameraRef} 
                        style={StyleSheet.absoluteFill} 
                        facing="back"
                        autofocus="on"
                        enableTorch={flash === 'on'} 
                        flash={flash} />
                    <View style={[StyleSheet.absoluteFill, tw`justify-between`]}>
                        {/* Top Bar */}
                        <View style={[tw`flex-row justify-between px-6 mt-4`, { marginTop: insets.top + 10 }]}>
                            <TouchableOpacity onPress={() => router.back()} style={tw`p-2 bg-black/40 rounded-full`}>
                                <X size={35} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={toggleFlash} style={tw`p-2 ${flash !== 'off' ? 'bg-aily-blue' : 'bg-black/40'} rounded-full`}>
                                <Zap size={35} color="white" fill={flash === 'on' ? 'white' : 'transparent'} />
                            </TouchableOpacity>
                        </View>
                        {/* Guidelines */}
                        <View style={[tw`flex-1 items-center w-full px-12 py-6`]}>
                            <View 
                                style={[tw`w-full h-full border-2 border-white rounded-3xl`, { borderStyle: 'dashed' }]}
                                onLayout={onFrameLayout}
                            >
                                <View style={tw`absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-aily-blue rounded-tl`} />
                                <View style={tw`absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-aily-blue rounded-tr`} />
                                <View style={tw`absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-aily-blue rounded-bl`} />
                                <View style={tw`absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-aily-blue rounded-br`} />
                                <View style={tw`flex-1 justify-end items-center`}>
                                    <Text style={tw`items-center text-white mt-8 font-atkinson-bold text-aily-body-lg text-center px-5 shadow-lg`}>Align receipt within the frame</Text>
                                </View>
                            </View>
                        </View>
                        {/* Button */}
                        <View style={[tw`mb-12 items-center`, { marginBottom: insets.bottom + 10 }]}>
                            <TouchableOpacity
                                onPress={takeAndProcessPicture}
                                style={tw`w-20 h-20 bg-white rounded-full border-4 justify-center items-center border-aily-blue`}
                            >
                                <View style={tw`w-16 h-16 bg-aily-blue rounded-full justify-center items-center`} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </>
            ) : (
                <View style={tw`flex-1 bg-white p-6 justify-center items-center`}>
                    {isProcessing ? (
                        <ActivityIndicator size="large" color="#1565C0" />
                    ) : (
                        <>
                            <Text style={tw`text-aily-primary text-center mb-4 text-aily-h2 font-atkinson-bold`}>
                                Scanning Result
                            </Text>
                            <Image source={{ uri: processedUri || capturedUri }} style={tw`w-full h-3/4 shadow-2xl rounded-xl`} resizeMode="contain" />
                            <TouchableOpacity
                                onPress={() => router.push({
                                    pathname: '/results',
                                    params: { images: JSON.stringify([processedUri || capturedUri]) }
                                })}
                                style={tw`bg-aily-blue px-6 py-3 rounded-full mt-8`}>
                                <Text style={tw`text-aily-bg text-aily-action font-atkinson-bold text-center px-4 py-2`}>Confirm</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            )}
        </View>
    );
}