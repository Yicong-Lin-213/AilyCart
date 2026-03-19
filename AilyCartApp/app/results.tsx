import { View, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import tw from '../lib/tailwind';
import { useEffect, useState } from 'react';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useUser } from '../context/user-context';
import * as Speech from 'expo-speech';
import { VoiceButton } from '@/components/ui/voice-button';
import { useTask } from '@/context/task-context';
import { AilyText as Text } from '@/components/ui/AilyText';

export default function Results() {
    const router = useRouter();
    const [originalItemNames, setOriginalItemNames] = useState<string[]>([]);
    const [nameMapping, setNameMapping] = useState<{ [key: string]: string }>({});
    const [showDataPicker, setShowDataPicker] = useState(false);
    const { userId, displayName, voiceEnabled } = useUser();

    const { receiptData, status, progressText, resetTask, setReceiptData } = useTask();

    // Track which item is currently being spoken, -1 for summary and null for none
    const [playingIndex, setPlayingIndex] = useState<number | null>(null);

    const getDateObject = () => {
        if (receiptData?.transaction?.date) {
            const d = new Date(receiptData?.transaction.date);
            return isNaN(d.getTime()) ? new Date() : d;
        }
        return new Date();
    }

    const handleNameChange = (newName: string, index: number) => {
        if (!receiptData) return;

        const originalName = originalItemNames[index];
        const newItems = [...receiptData.items];
        newItems[index].name = newName;
        setReceiptData({ ...receiptData, items: newItems });

        if (newName !== originalName) {
            setNameMapping(prev => ({ ...prev, [originalName]: newName }));
        }
    };

    const handlePriceChange = (newPrice: string, index: number) => {
        if (!receiptData) return;
        const newItems = [...receiptData.items];
        newItems[index].total_price = parseFloat(newPrice) || 0;
        setReceiptData({ ...receiptData, items: newItems });
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        console.debug("Date change event:", event.type, selectedDate);
        if (event.type === 'dismissed') {
            setShowDataPicker(false);
            return;
        }

        if (selectedDate) {
            if (Platform.OS === 'android') setShowDataPicker(false);
        }

        console.debug("Selected date:", selectedDate);
        const formattedDate = selectedDate?.toISOString().split('T')[0] || "";
        console.debug("Setting date to:", formattedDate);
        setReceiptData(prev => prev ? { ...prev, transaction: { ...prev.transaction, date: formattedDate } } : null);
        console.debug("updated date: ", receiptData?.transaction?.date);
    };

    const onToggleVoice = (index: number) => {
        Speech.stop();

        if (playingIndex === index) {
            setPlayingIndex(null);
            return;
        }

        setPlayingIndex(index);
        let message = "";
        if (index === -1) {
            const merchantName = receiptData?.merchant?.name || "the store";
            const totalAmount = receiptData?.totals?.total?.toFixed(2) || "0.00";
            message = `Hello ${displayName}, you have purchased items from ${merchantName} for a total of ${totalAmount}.`;
        } else {
            const item = receiptData?.items[index];
            if (item) {
                message = `You have purchased ${item.name} for ${item.total_price?.toFixed(2) || "0.00"} dollars.`;
            }
        }
        if (message) {
            Speech.speak(message, {
                language: 'en-US',
                onDone: () => setPlayingIndex(null),
                onStopped: () => setPlayingIndex(null),
                onError: (error) => {
                    console.error("TTS error:", error);
                    setPlayingIndex(null);
                }
            });
        }
    };

    const onSaveReceipt = async () => {
        try {
            const rsp = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/archive-receipt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    receipt_data: receiptData,
                    name_mapping: nameMapping,
                }),
            });
            console.debug("Save receipt response:", rsp.ok);
        } catch (error) {
            console.error("Save receipt failed", error);
        }
        finally {
            resetTask();
            if (router.canDismiss()) {
                router.dismissAll();
            }
            router.replace("/(tabs)/t_inventory");
        }
    }

    useEffect(() => {
        if (voiceEnabled && receiptData && receiptData.merchant?.name && status === 'success') {
            onToggleVoice(-1);
        }
        return () => {
            Speech.stop();
        }
    }, [status, receiptData, voiceEnabled]);

    if (!receiptData) {
        console.debug("No receipt data, status:", status, "progressText:", progressText);
        return (
            <View style={tw`flex-1 justify-center items-center bg-aily-bg`}>
                <ActivityIndicator size="large" color="#1565C0" />
                <Text style={tw`mt-4`}>Analyzing receipt...</Text>
            </View>
        );
    }

    return (
        <View style={tw`flex-1 bg-aily-bg p-8 pt-22`}>
            <View style={tw`mb-6`}>
                <TextInput style={tw`text-aily-h2 font-atkinson-bold text-aily-primary`}
                    value={receiptData?.merchant?.name || ""}
                    maxFontSizeMultiplier={1.4}
                    multiline={true}
                    onChangeText={(text) => setReceiptData(prev => prev ? { ...prev, merchant: { ...prev?.merchant, name: text } } : null)}
                />
                {receiptData && receiptData.merchant?.name && (<View style={tw`mb-6`}>
                    <TouchableOpacity
                        onPress={() => setShowDataPicker(true)}
                        style={tw`bg-white pt-4 flex-row justify-between items-center`}
                    >
                        <Text style={tw`text-aily-body-sm font-atkinson text-aily-secondary`}>
                            {receiptData?.transaction?.date || "Select Date"}
                        </Text>
                    </TouchableOpacity>
                    {showDataPicker && (
                        <DateTimePicker
                            value={getDateObject()}
                            mode='date'
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onDateChange}
                            maximumDate={new Date()}
                        />
                    )}

                    {showDataPicker && Platform.OS === 'ios' && (
                        <TouchableOpacity
                            onPress={() => setShowDataPicker(false)}
                            style={tw`mt-2 items-end`}
                        >
                            <Text style={tw`text-aily-blue text-aily-body-sm font-atkinson-bold p-2`}>Done</Text>
                        </TouchableOpacity>
                    )}
                </View>)}
            </View>

            {/* Goods */}
            <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
                {receiptData?.items && receiptData?.items.length > 0 ? (receiptData.items.map((item: any, index: number) => (
                    <View key={index} style={tw`flex-row justify-between py-4 border-b border-gray-100`}>
                        <View style={tw`flex-1`}>
                            <TextInput
                                style={tw`text-aily-body-lg font-atkinson text-aily-primary`}
                                value={item.name}
                                maxFontSizeMultiplier={1.4}
                                multiline={true}
                                onChangeText={(text) => handleNameChange(text, index)}
                                placeholder="Item Name"
                            />
                            <Text style={tw`text-aily-body-sm font-atkinson-bold text-aily-primary`}>Qty: {item.quantity} x {item.price_per_unit}</Text>
                        </View>
                        <View style={tw`flex-row items-center gap-1`}>
                            <TextInput
                                style={tw`text-aily-body-lg font-atkinson-bold text-aily-primary`}
                                value={item.total_price.toFixed(2)}
                                maxFontSizeMultiplier={1.4}
                                multiline={true}
                                onChangeText={(text) => handlePriceChange(text, index)}
                                keyboardType='numeric'
                            />
                            <VoiceButton isPlaying={playingIndex === index} onPress={() => onToggleVoice(index)} size={30} />
                        </View>
                    </View>
                ))) : (
                    <View style={tw`h-full flex items-center justify-center`}>
                        <Text style={tw`text-[20px] font-atkinson text-aily-secondary`}>No items detected.</Text>
                    </View>
                )}
            </ScrollView>

            <View style={tw`mb-6 pt-4 border-t-2 border-aily-secondary`}>
                {receiptData?.merchant?.name && (
                    <View style={tw`flex-row justify-between mb-2 items-center`}>
                        <View style={tw`flex-row items-center gap-1`}>
                            <VoiceButton isPlaying={playingIndex === -1} onPress={() => onToggleVoice(-1)} size={35} />
                            <Text style={tw`text-aily-h2 font-atkinson-bold text-aily-primary`}>TOTAL</Text>
                        </View>
                        <Text style={tw`text-aily-h2 font-atkinson-bold text-aily-primary`}>${receiptData?.totals?.total?.toFixed(2) || "---"}</Text>
                    </View>
                )}
            </View>

            {/* Buttons */}
            <View style={tw`flex-row gap-4 w-full`}>
                <TouchableOpacity style={tw`flex-1 py-5 bg-aily-red rounded-2xl py-4`} onPress={() => {
                    router.replace('/scanning');
                    resetTask();
                }}>
                    <Text style={tw`text-aily-bg text-aily-action font-atkinson-bold text-center uppercase`}>Retake</Text>
                </TouchableOpacity>

                {receiptData?.merchant?.name ? (
                    <TouchableOpacity style={tw`flex-1 py-5 bg-aily-blue rounded-2xl py-4`} onPress={() => onSaveReceipt()}>
                        <Text style={tw`text-aily-bg text-aily-action font-atkinson-bold text-center uppercase`}>Confirm</Text>
                    </TouchableOpacity>
                ):(
                    <TouchableOpacity style={tw`flex-1 py-5 bg-aily-blue rounded-2xl py-4`} onPress={() => router.replace("/(tabs)/t_inventory")}>
                        <Text style={tw`text-aily-bg text-aily-action font-atkinson-bold text-center uppercase`}>Cancel</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}