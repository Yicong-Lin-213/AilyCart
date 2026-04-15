// Copyright 2026 Yicong Lin
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     https://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, useWindowDimensions, Modal, TextInput, Platform } from 'react-native';
import { supabase } from '../../lib/supabase-client';
import tw from '../../lib/tailwind';
import { useUser } from '../../context/user-context';
import { AlertCircle, CheckCircle2, ShoppingCart, Clock, ChevronRight, Mic, MicOff, Square } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import ExpandButton from '@/components/ui/expand-button';
import { AilyText as Text } from '@/components/ui/AilyText';
import * as Speech from 'expo-speech';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface InventoryItem {
    item_name: string;
    status: 'low' | 'out' | 'sufficient';
    last_purchased_at: string;
    standard_product_id: string | null;
    avg_interval_days: number; // From the joined view
    alert_threshold_days: number; // From the inventory_items table
    unit_price: number;
}

export default function InventoryScreen() {
    const { displayName, userId } = useUser();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [showAllLowStock, setShowAllLowStock] = useState(false);
    const [showAllSufficient, setShowAllSufficient] = useState(false);
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [tempDays, setTempDays] = useState('14');
    const [showTip, setShowTip] = useState(false);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const playback = async (text: any) => {
        // This is a workaround, since the audio configuration does not work after recording.
        const { sound } = await Audio.Sound.createAsync(
            require('@/assets/sounds/blank.m4a'),
            { shouldPlay: true, volume: 1.0 }
        );
        sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
                sound.unloadAsync();
            }
        });
        Speech.speak(text, { language: 'en-US', rate: 0.9, volume: 1.0 });
    };

    const configureAudio = async () => {
        try {
            await Audio.setIsEnabledAsync(false);

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                interruptionModeIOS: InterruptionModeIOS.DuckOthers,
                playsInSilentModeIOS: true,
                staysActiveInBackground: false,
                shouldDuckAndroid: true,
                interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
                playThroughEarpieceAndroid: false,
            });

            await Audio.setIsEnabledAsync(true);
            if (Platform.OS === 'ios') {
                await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
            }
        } catch (error) {
            console.error("Config error:", error);
        }
    }

    const handleUpdateThreshold = async () => {
        if (!selectedItem || !userId) return;

        const days = parseInt(tempDays);
        if (isNaN(days) || days < 1) {
            alert("Please enter a valid number of days.");
            return;
        }

        const {error} = await supabase
            .from('inventory_items')
            .update({ alert_threshold_days: days })
            .match({user_id: userId, item_name: selectedItem.item_name});

        if (error) {
            console.error("Error updating threshold:", error);
        } else {
            setIsModalVisible(false);
            fetchInventory();
        }
    };

    const fetchInventory = async () => {
        if (!userId || userId === 'null') {
            console.log("Waiting for a valid User ID...");
            return;
        }
        try {
            setLoading(true);

            // 1. Sync prediction statuses in DB
            await supabase.rpc('update_inventory_predictions');

            // 2. Fetch the consumption rates for each item
            const { data: ratesData, error: ratesError } = await supabase
                .from('product_consumption_rates')
                .select(`unique_key, avg_interval_days`)
                .eq('user_id', userId);

            if (ratesError) throw ratesError;

            // 3. Fetch the raw inventory items
            const { data: itemsData, error: itemsError } = await supabase
                .from('inventory_items')
                .select(`
                    item_name,
                    status,
                    last_purchased_at,
                    standard_product_id,
                    alert_threshold_days,
                    unit_price
                `)
                .eq('user_id', userId)
                .order('last_purchased_at', { ascending: false });

            if (itemsError) throw itemsError;

            // 4. Merge the data
            const processed = itemsData.reduce((acc: InventoryItem[], current) => {
                const key = (current.standard_product_id || current.item_name).toString();
                if (!acc.find(item => (item.standard_product_id || item.item_name) === key)) {
                    const rateInfo = ratesData?.find(r => r.unique_key === key);
                    acc.push({
                        ...current,
                        avg_interval_days: rateInfo?.avg_interval_days || current.alert_threshold_days || 14
                    });
                }
                return acc;
            }, []);

            setItems(processed);
        } catch (err) {
            console.error('Error fetching inventory:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const EmptyState = () => (
        <View style={tw`flex-1 justify-center items-center py-20 px-10`}>
            <View style={tw`bg-blue-50 p-8 rounded-full mb-6`}>
                <ShoppingCart size={64} color="#1565C0" strokeWidth={1.5} />
            </View>

            <Text style={tw`text-aily-h2 font-atkinson-bold text-aily-primary text-center mb-3`}>
                Your Fridge is Empty
            </Text>

            <Text style={tw`text-aily-body-lg text-aily-secondary text-center mb-10 font-atkinson`}>
                Scan your first receipt to see what you need to buy and what you have in stock.
            </Text>

            {/* A visual hint pointing towards the Scan Tab */}
            <View style={tw`items-center`}>
                <Text style={tw`text-aily-blue font-atkinson-bold text-aily-body-sm mb-2 uppercase tracking-widest`}>
                    Tap &quot;Scan&quot; below to start
                </Text>
                <View style={tw`animate-bounce`}>
                    <ChevronRight size={32} color="#1565C0" style={{ transform: [{ rotate: '90deg' }] }} />
                </View>
            </View>
        </View>
    );

    async function startRecording() {
        try {
            if (recording) {
                console.log("Cleaning up existing recording...");
                await recording.stopAndUnloadAsync().catch(() => {});
                setRecording(null);
            }

            const permission = await Audio.requestPermissionsAsync();
            if (!permission.granted) {
                console.warn('Permission to record audio was denied');
                return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                interruptionModeIOS: InterruptionModeIOS.DoNotMix,
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
                playThroughEarpieceAndroid: false,
            });


            const newRecording = new Audio.Recording();
            await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
            await newRecording.startAsync();
            setRecording(newRecording);
        } catch (error) {
            console.error("Error starting recording:", error);
            setRecording(null);
        } finally {
            setIsProcessing(false);
        }
    }

    async function stopRecording() {
        if (!recording) return;

        const currentRecording = recording;
        setRecording(null);
        setIsProcessing(true);

        try {
            const status = await currentRecording.getStatusAsync();
            if (status.isRecording) {
                await currentRecording.stopAndUnloadAsync();
            }

            const uri = currentRecording.getURI();
            await configureAudio();

            if (uri) {
                await uploadToBackend(uri);
            }
        } catch (error) {
            console.error("Error stopping recording:", error);
        } finally {
            setIsProcessing(false);
            setRecording(null);
        }
    }

    async function uploadToBackend(uri: string) {
        const controller = new AbortController();

        const timeoutId = setTimeout(() => {
            controller.abort();
        }, 30000);  // 30 seconds timeout

        const formData = new FormData();
        if (userId) {
            formData.append('user_id', userId);
        }
        const file_name = `audio_${userId}_${Date.now()}.m4a`;
        // @ts-ignore
        formData.append('audio', { uri, name: file_name, type: 'audio/m4a' });
        try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/process-audio`, {
                method: 'POST',
                // headers: { 'Content-Type': 'multipart/form-data' },
                body: formData,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const result = await response.json();
            console.log("Backend response:", result);
            // if (result.success) {
            playback(result.feedback);
            // }
        } catch (error: any) {
            console.error("Error uploading audio:", error);
            if (error.name === 'AbortError') {
                console.warn("Request aborted due to timeout");
                playback("Sorry, the connection timed out.");
            } else {
                console.error("Error uploading audio:", error);
            }
        } finally {
            setIsProcessing(false);
        }
    }

    const checkFirstTime = async () => {
        const learnt = await AsyncStorage.getItem('learntMicTip');
        if (!learnt) {
            setShowTip(true);
            setTimeout( () => setShowTip(false), 120000); // hide tip in 2 minutes
        }
    }

    const dismissTip = async () => {
        setShowTip(false);
        await AsyncStorage.setItem('hasSeenMicTip', 'true');
    };

    useFocusEffect(
        useCallback(() => {
            fetchInventory();
            timerRef.current = setInterval(() => {
                fetchInventory();
            }, 1000 * 60 * 30); // 30 minutes

            return () => {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
            };
        }, [userId])
    );

    useEffect(() => {
        checkFirstTime();
    }, []);

    // Helper to calculate remaining days
    const getRemainingDays = (lastPurchased: string, avgInterval: number) => {
        const lastDate = new Date(lastPurchased).getTime();
        const today = new Date().getTime();
        const daysPassed = (today - lastDate) / (1000 * 60 * 60 * 24);
        const remaining = Math.ceil(avgInterval - daysPassed);
        return remaining > 0 ? remaining : 0;
    };

    const lowStockItems = items.filter(i => i.status === 'low' || i.status === 'out');
    const sufficientItems = items.filter(i => i.status === 'sufficient');

    return (
        <View style={tw`flex-1 bg-aily-bg`}>
            <ScrollView
                style={tw`flex-1 bg-aily-bg`}
                contentContainerStyle={tw`p-6 pt-16`}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchInventory(); }} />}
            >
                <View style={tw`mb-8`}>
                    <Text style={tw`text-aily-h1 font-atkinson-bold text-aily-primary`}>Hello, {displayName}</Text>
                    <Text style={tw`text-aily-body-lg text-aily-secondary font-atkinson`}>Inventory Prediction</Text>
                </View>

                {items.length === 0 ? <EmptyState /> : (
                    <>
                        {/* Low Stock Section */}
                        <View style={tw`mb-8`}>
                            <View style={tw`flex-row items-center mb-4`}>
                                <ShoppingCart size={24} color={tw.color('aily-red')} />
                                <Text style={tw`text-aily-h2 font-atkinson-bold text-aily-red ml-2`}>Need to Buy</Text>
                            </View>

                            {(showAllLowStock ? lowStockItems : lowStockItems.slice(0, 2)).map((item, idx) => {
                                const daysLeft = getRemainingDays(item.last_purchased_at, item.avg_interval_days);
                                return (
                                    <TouchableOpacity
                                        onLongPress={() => {
                                            setSelectedItem(item);
                                            setTempDays(item.alert_threshold_days?.toString() || '14');
                                            setIsModalVisible(true);
                                        }}
                                        key={idx} style={tw`bg-red-50 border-2 border-aily-red rounded-3xl p-5 mb-4 shadow-sm`}>
                                        <View style={tw`flex-row justify-between items-center mb-2`}>
                                            <Text style={tw`text-aily-action font-atkinson-bold text-aily-red flex-1`}>{item.item_name}</Text>
                                            <AlertCircle size={30} color={tw.color('aily-red')} />
                                        </View>
                                        <View style={tw`flex-row items-center mt-1`}>
                                            <Text style={tw`text-gray-500 text-aily-body-sm`}>
                                                {item.unit_price ? `$${item.unit_price.toFixed(2)}` : 'No price'}
                                            </Text>
                                            <Text style={tw`text-gray-400 text-[10px] mx-2`}>•</Text>
                                            <Text style={tw`text-gray-500 text-aily-body-sm`}>Last purchased</Text>
                                        </View>
                                        <View style={tw`flex-row items-center`}>
                                            <Clock size={18} color={tw.color('aily-red')} style={tw`mr-1`} />
                                            <Text style={tw`text-aily-body-lg text-red-700 font-atkinson-bold`}>
                                                {daysLeft === 0 ? "All gone" : `Almost gone, ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left.`}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                            {/* Show All Button */}
                            {lowStockItems.length > 2 && (
                                <ExpandButton
                                    onPress={() => setShowAllLowStock(!showAllLowStock)}
                                    isExpanded={showAllLowStock}
                                    count={lowStockItems.length - 2}
                                />
                            )}
                        </View>

                        {/* Sufficient Section */}
                        <View>
                            <Text style={tw`text-aily-h2 font-atkinson-bold text-aily-primary mb-4`}>In Stock</Text>
                            {(showAllSufficient ? sufficientItems : sufficientItems.slice(0, 1)).map((item, idx) => {
                                const daysLeft = getRemainingDays(item.last_purchased_at, item.avg_interval_days);
                                return (
                                    <View key={idx} style={tw`bg-white border border-gray-200 rounded-3xl p-5 mb-4 shadow-sm`}>
                                        <View style={tw`flex-row justify-between items-center mb-2`}>
                                            <Text style={tw`text-aily-action font-atkinson-bold text-aily-green flex-1`}>{item.item_name}</Text>
                                            <CheckCircle2 size={30} color={tw.color('aily-green')} />
                                        </View>
                                        <View style={tw`flex-row items-center mt-1`}>
                                            <Text style={tw`text-gray-500 text-aily-body-sm`}>
                                                {item.unit_price ? `$${item.unit_price.toFixed(2)}` : 'No price'}
                                            </Text>
                                            <Text style={tw`text-gray-400 text-[10px] mx-2`}>•</Text>
                                            <Text style={tw`text-gray-500 text-aily-body-sm`}>Last purchased</Text>
                                        </View>
                                        <View style={tw`flex-row items-center`}>
                                            <Clock size={18} color={tw.color('aily-secondary')} style={tw`mr-1`} />
                                            <Text style={tw`text-aily-body-lg text-aily-secondary font-atkinson`}>
                                                Approximately {daysLeft} days remaining
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                            {/* Show All Button */}
                            {sufficientItems.length > 1 && (
                                <ExpandButton
                                    onPress={() => setShowAllSufficient(!showAllSufficient)}
                                    isExpanded={showAllSufficient}
                                    count={sufficientItems.length - 1}
                                />
                            )}
                        </View>
                    </>
                )}
            </ScrollView>

            {isProcessing && (
                <View style={[tw`absolute inset-0 bg-white/80 items-center justify-center z-50`]}>
                    <ActivityIndicator size="large" color="#1565C0" />
                    <Text style={tw`text-aily-body-lg font-atkinson-bold mt-4 text-aily-primary`}>
                        Aily is searching...
                    </Text>
                </View>
            )}
            <View style={[tw`absolute items-center justify-center`,
            {
                bottom: 10,
                left: 20,
                zIndex: 100
            }
            ]}>
                {isProcessing ? (
                    <View style={tw`w-20 h-20 items-center justify-center bg-gray-100 rounded-full`}>
                        <ActivityIndicator size="large" color="#1565C0" />
                    </View>
                ) : (
                    <TouchableOpacity
                        onPressIn={startRecording}
                        onPressOut={stopRecording}
                        activeOpacity={0.7}
                        style={[
                            tw`w-14 h-14 rounded-full items-center justify-center shadow-2xl`,
                            { backgroundColor: recording ? '#EF4444' : '#1565C0' }
                        ]}
                    >
                        {recording ? (
                            <Square color="white" size={24} fill="white" />
                        ) : (
                            <Mic color="white" size={24} fill="white" />
                        )}
                    </TouchableOpacity>
                )}
            </View>

            {showTip && (
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={dismissTip}
                    style={[
                        tw`absolute bg-aily-blue px-4 py-3 rounded-2xl shadow-xl`,
                        {
                            bottom: 90,
                            left: 20,
                            maxWidth: 220,
                            zIndex: 101
                        }
                    ]}
                >
                    <Text style={tw`text-white font-atkinson-bold text-aily-body-sm leading-6`}>
                        NEW: Hold this button to ask Aily about your stock!
                    </Text>
                    <View
                        style={[
                            tw`absolute bg-aily-blue w-4 h-4`,
                            {
                                bottom: -6,
                                left: 25,
                                transform: [{rotate: '45deg'}],
                                zIndex: -1
                            }
                        ]}
                    />
                </TouchableOpacity>
            )}

            <Modal visible={isModalVisible} transparent animationType="fade">
                <View style={tw`flex-1 justify-center items-center bg-black/50 px-6`}>
                    <View style={tw`bg-white rounded-3xl p-6 w-full`}>
                        <Text style={tw`text-aily-h2 font-atkinson-bold text-aily-primary mb-2`}>Set Alert Threshold</Text>
                        <Text style={tw`text-aily-body-lg mb-2`}>Item: {selectedItem?.item_name}</Text>
                        <View style={tw`bg-gray-100 rounded-xl px-4 py-3 mb-4`}>
                            <Text style={tw`text-gray-500 text-aily-body-sm mb-1`}>Days since last purchase to trigger alert</Text>
                            <TextInput 
                                style={tw`text-aily-h2 text-aily-blue font-atkinson-bold`}
                                value={tempDays}
                                onChangeText={setTempDays}
                                keyboardType="number-pad"
                                autoFocus={true}
                            />
                        </View>
                        <View style={tw`flex-row gap-4`}>
                            <TouchableOpacity
                                style={tw`flex-1 py-4 bg-gray-200 rounded-xl`}
                                onPress={() => setIsModalVisible(false)}
                            >
                                <Text style={tw`font-atkinson-bold text-center text-aily-body-lg`}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={tw`flex-1 py-4 bg-aily-blue rounded-xl`}
                                onPress={handleUpdateThreshold}
                            >
                                <Text style={tw`font-atkinson-bold text-center text-white text-aily-body-lg`}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}