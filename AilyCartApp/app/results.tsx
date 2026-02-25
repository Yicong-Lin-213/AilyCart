import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import tw from '../lib/tailwind';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { File } from 'expo-file-system';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface ReceiptData {
    merchant: { name: string | null; address: string | null; phone: string | null };
    transaction: { date: string; time: string; receipt_number: string | null };
    items: { name: string; quantity: number; price_per_unit: number; total_price: number }[];
    totals: { subtotal: number; tax: number; total: number; currency: string };
    payment_method: string;
}

export default function Results() {
    const router = useRouter();
    const { images } = useLocalSearchParams();
    const [ loading, setLoading] = useState(true);
    const [ receiptData, setReceiptData ] = useState<ReceiptData | null>(null);
    const [ uploadingStatus, setUploadingStatus] = useState("");
    const [originalItemNames, setOriginalItemNames] = useState<string[]>([]);
    const [nameMapping, setNameMapping] = useState<{ [key: string]: string }>({ });
    const [showDataPicker, setShowDataPicker] = useState(false);

    const getDateObject = () => {
        if (receiptData?.transaction?.date) {
            const d = new Date(receiptData?.transaction.date);
            return isNaN(d.getTime()) ? new Date() : d;
        }
        return new Date();
    }

    const processImages = async () => {
        console.log("Processing images:", images);
        try {
            setLoading(true);
            const imagePaths = JSON.parse(images as string);

            setUploadingStatus("Uploading images...");

            const uploadToSupabase = async (uri: string, index: number) => {
                const fileName = `receipt_${Date.now()}_${index}.jpg`;
                const file = new File(uri);
                const arrayBuffer = await file.arrayBuffer();

                const { data, error } = await supabase.storage
                    .from('receipt_images')
                    .upload(fileName, arrayBuffer, { contentType: 'image/jpeg', upsert: true });

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage.from('receipt_images').getPublicUrl(data.path);
                return publicUrl;
            };
                
            const uploadedUrls = await Promise.all(
                imagePaths.map(async (uri: string, index: number) => uploadToSupabase(uri, index))
            )

            setUploadingStatus("Analyzing receipt...");
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/process-receipt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image_url: uploadedUrls[0] }), // TODO: handle multiple images
            });

            const data = await response.json();
            setReceiptData(data.payload);

            setOriginalItemNames(data.items?.map((item: any) => item.name) || []);
        } catch (error) {
            console.error("Processing failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNameChange = (newName: string, index: number) => {
        if (!receiptData) return;

        const originalName = originalItemNames[index];
        const newItems = [...receiptData.items];
        newItems[index].name = newName;
        setReceiptData({ ...receiptData, items: newItems});

        if (newName !== originalName) {
            setNameMapping(prev => ({ ...prev, [originalName]: newName }));
        }
    };

    const handlePriceChange = (newPrice: string, index: number) => {
        if (!receiptData) return;
        const newItems = [...receiptData.items];
        newItems[index].total_price = parseFloat(newPrice) || 0;
        setReceiptData({ ...receiptData, items: newItems});
    };

    const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (event.type === 'dismissed' ) {
            setShowDataPicker(false);
            return;
        }

        if (selectedDate) {
            if (Platform.OS === 'android') setShowDataPicker(false);
        }

        const formattedDate = selectedDate?.toISOString().split('T')[0] || "";
        setReceiptData(prev => prev ? { ...prev, transaction: { ...prev.transaction, date: formattedDate }} : null);
    };

    useEffect(() => {
        if (images) {
            processImages();
        }
    }, [images]);

    if (loading) {
        return (
            <View style={tw`flex-1 bg-aily-bg justify-center items-center`}>
                <ActivityIndicator size="large" color="#1565C0" />
                <Text style={tw`text-aily-primary text-aily-body-lg font-atkinson-bold text-center mt-4`}>{uploadingStatus}</Text>
            </View>
        )
    }

    return (
        <View style={tw`flex-1 bg-aily-bg p-8 pt-22`}>
            <View style={tw`mb-6`}>
                <TextInput style={tw`text-aily-h2 font-atkinson-bold text-aily-primary`}
                    value={receiptData?.merchant?.name || ""}
                    onChangeText={(text) => setReceiptData(prev => prev ? { ...prev, merchant: { ...prev?.merchant, name: text }} : null)}
                />
                <View style={tw`mb-6`}>
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
                            onPress={ ()=>setShowDataPicker(false) }
                            style={tw`mt-2 times-end`}
                        >
                            <Text style={tw`text-aily-blue font-atkinson-bold p-2`}>Done</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            
            {/* Goods */}
            <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
                {receiptData?.items && receiptData?.items.length > 0 ? ( receiptData.items.map((item, index) => (
                    <View key={index} style={tw`flex-row justify-between py-4 border-b border-gray-100`}>
                        <View style={tw`flex-1`}>
                            <TextInput 
                                style={tw`text-aily-body-lg font-atkinson text-aily-primary`}
                                value={item.name}
                                onChangeText={(text) => handleNameChange(text, index)}
                                placeholder="Item Name"
                            />
                            <Text style={tw`text-aily-body-sm font-atkinson-bold text-aily-primary`}>Qty: {item.quantity} x {item.price_per_unit}</Text>
                        </View>
                        <TextInput
                            style={tw`text-aily-body-lg font-atkinson-bold text-aily-primary`}
                            value={item.total_price.toFixed(2)}
                            onChangeText={(text) => handlePriceChange(text, index)}
                            keyboardType='numeric'
                        />
                    </View>
                ))) : (
                    <View style={tw`h-full flex items-center justify-center`}>
                        <Text style={tw`text-[20px] font-atkinson text-aily-secondary`}>No items detected.</Text>
                    </View>
                )}
            </ScrollView>

            <View style={tw`mb-6 pt-4 border-t-2 border-aily-secondary`}>
                <View style={tw`flex-row justify-between mb-2`}>
                    <Text style={tw`text-aily-body-lg font-atkinson-bold text-aily-primary`}>TOTAL</Text>
                    <Text style={tw`text-aily-h1 font-atkinson-bold text-aily-primary`}>${receiptData?.totals?.total.toFixed(2) || "---"}</Text>
                </View>
            </View>

            {/* Buttons */}
            <View style={tw`flex-row gap-4 w-full`}>
                <TouchableOpacity style={tw`flex-1 py-5 bg-aily-red rounded-2xl py-4`} onPress={() => router.back()}>
                    <Text style={tw`text-aily-bg text-lg font-atkinson-bold text-center`}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity style={tw`flex-1 py-5 bg-aily-blue rounded-2xl py-4`} onPress={() => router.replace("/")}>
                    <Text style={tw`text-aily-bg text-lg font-atkinson-bold text-center`}>Confirm</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}