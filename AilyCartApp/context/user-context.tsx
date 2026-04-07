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

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase-client';

interface UserContextType {
    userId: string | null;
    displayName: string;
    voiceEnabled: boolean;
    loading: boolean;
    refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [userId, setUserId] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(true); 
    const [voiceEnabled, setVoiceEnabled] = useState(true);

    const refreshProfile = async () => {
        try {
            setLoading(true);
            const { data: {user} } = await supabase.auth.getUser();

            if (user) {
                setUserId(user.id);                
                const {data} = await supabase
                    .from('profiles')
                    .select('full_name, voice_enabled')
                    .eq('id', user.id)
                    .single();
                
                if (data?.full_name) {
                    setDisplayName(data.full_name);
                    setVoiceEnabled(data.voice_enabled);
                }
                else if (user.user_metadata?.display_name) setDisplayName(user.user_metadata.display_name);
                else setDisplayName(user.email?.split('@')[0] || "User");
            } else {
                setUserId(null);                
                setDisplayName('');
            }
        } catch (error) {
            console.error("Error refreshing profile:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshProfile();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth Event In Context:", event);
            if ( event === 'SIGNED_IN' || event === 'USER_UPDATED') await refreshProfile();
            else if (event === 'SIGNED_OUT') {
                setUserId(null);
                setDisplayName('');
            }
        });

        return () => authListener.subscription.unsubscribe();
    }, []);

    return (
        <UserContext.Provider value={{ userId, displayName, voiceEnabled, loading, refreshProfile }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}