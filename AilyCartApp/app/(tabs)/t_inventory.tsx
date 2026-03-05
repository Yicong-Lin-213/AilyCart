import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase-client';
import tw from '../../lib/tailwind';
import { useUser } from '../../context/user-context';
import { AlertCircle, CheckCircle2, ShoppingCart, Clock, ChevronRight } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';

interface InventoryItem {
    item_name: string;
    status: 'low' | 'out' | 'sufficient';
    last_purchased_at: string;
    standard_product_id: string | null;
    avg_interval_days: number; // From the joined view
}

export default function InventoryScreen() {
    const { displayName, userId } = useUser();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [items, setItems] = useState<InventoryItem[]>([]);

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
                    standard_product_id
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
                        avg_interval_days: rateInfo?.avg_interval_days || 14
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

    useFocusEffect(
        useCallback(() => {
            fetchInventory();
        }, [userId])
    );

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
                            <ShoppingCart size={24} color="#D32F2F" />
                            <Text style={tw`text-aily-h2 font-atkinson-bold text-aily-red ml-2`}>Need to Buy</Text>
                        </View>

                        {lowStockItems.map((item, idx) => {
                            const daysLeft = getRemainingDays(item.last_purchased_at, item.avg_interval_days);
                            return (
                                <View key={idx} style={tw`bg-red-50 border-2 border-aily-red rounded-3xl p-5 mb-4 shadow-sm`}>
                                    <View style={tw`flex-row justify-between items-center mb-2`}>
                                        <Text style={tw`text-aily-body-lg font-atkinson-bold text-aily-red flex-1`}>{item.item_name}</Text>
                                        <AlertCircle size={30} color="#D32F2F" />
                                    </View>
                                    <View style={tw`flex-row items-center`}>
                                        <Clock size={18} color="#D32F2F" style={tw`mr-1`} />
                                        <Text style={tw`text-aily-body-sm text-red-700 font-atkinson-bold`}>
                                            {daysLeft === 0 ? "Out of stock" : `Expected to run out in ${daysLeft} days`}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Sufficient Section */}
                    <View>
                        <Text style={tw`text-aily-h2 font-atkinson-bold text-aily-primary mb-4`}>In Stock</Text>
                        {sufficientItems.map((item, idx) => {
                            const daysLeft = getRemainingDays(item.last_purchased_at, item.avg_interval_days);
                            return (
                                <View key={idx} style={tw`bg-white border border-gray-200 rounded-3xl p-5 mb-4 shadow-sm`}>
                                    <View style={tw`flex-row justify-between items-center mb-2`}>
                                        <Text style={tw`text-aily-body-lg font-atkinson-bold text-aily-green flex-1`}>{item.item_name}</Text>
                                        <CheckCircle2 size={30} color="#2E7D32" />
                                    </View>
                                    <View style={tw`flex-row items-center`}>
                                        <Clock size={18} color="#595959" style={tw`mr-1`} />
                                        <Text style={tw`text-aily-body-sm text-aily-secondary font-atkinson`}>
                                            Approximately {daysLeft} days remaining
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </>
            )}
        </ScrollView>
    );
}