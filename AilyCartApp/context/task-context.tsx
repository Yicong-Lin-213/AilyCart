// context/task-context.tsx
import React, { createContext, useContext, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { File } from 'expo-file-system';

type TaskStatus = 'idle' | 'uploading' | 'analyzing' | 'success' | 'error';

interface ReceiptData {
    merchant: { name: string | null; address: string | null; phone: string | null };
    transaction: { date: string; time: string; receipt_number: string | null };
    items: { name: string; quantity: number; price_per_unit: number; total_price: number }[];
    totals: { subtotal: number; tax: number; total: number; currency: string };
    payment_method: string;
}

interface TaskContextType {
    status: TaskStatus;
    progressText: string;
    receiptData: any | null;
    setReceiptData: React.Dispatch<React.SetStateAction<ReceiptData | null>>;
    startTask: (images: string[]) => Promise<void>;
    resetTask: () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<TaskStatus>('idle');
    const [progressText, setProgressText] = useState('');
    const [receiptData, setReceiptData] = useState<any | null>(null);

    const startTask = async (imageUris: string[]) => {
        try {
            setStatus('uploading');
            setProgressText('Saving receipt images...');

            const now = Date.now();
            const uploadToSupabase = async (uri: string, index: number) => {
                const fileName = `receipt_${now}_${index}.jpg`;
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
                imageUris.map(async (uri: string, index: number) => uploadToSupabase(uri, index))
            )

            setStatus('analyzing');
            setProgressText('Reading prices...');

            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/process-receipt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image_urls: uploadedUrls }),
            });

            const result = await response.json();
            console.debug("Received response from backend:", result.payload);
            setReceiptData(result.payload);
            setStatus('success');
            setProgressText('Scan complete!');

        } catch (error) {
            console.error(error);
            setStatus('error');
            setProgressText('Failed, try again');
        }
    };

    const resetTask = () => {
        setStatus('idle');
        setReceiptData(null);
    };

    return (
        <TaskContext.Provider value={{ status, progressText, receiptData, setReceiptData, startTask, resetTask }}>
            {children}
        </TaskContext.Provider>
    );
}

export const useTask = () => {
    const context = useContext(TaskContext);
    if (!context) throw new Error('useTask must be used within TaskProvider');
    return context;
};