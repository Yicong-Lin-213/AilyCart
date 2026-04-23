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

import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { supabase } from '../lib/supabase-client';
import tw from '../lib/tailwind';
import { useRouter } from 'expo-router';
import { User, Mail, Lock, ArrowRight } from 'lucide-react-native';
import { AilyText as Text } from '@/components/ui/AilyText';

export default function Auth() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignup, setIsSignup] = useState(false);
    const [displayName, setDisplayName] = useState('');

    async function handleAuth() {
        if (!email || !password) {
            Alert.alert('Missing Info', 'Please fill in all fields.');
            return;
        }
        setLoading(true);
        try {
            if (isSignup) {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { display_name: displayName } }
                });
                if (error) throw error;

                if (data.session) {
                    await supabase.from('profiles').upsert([{
                        id: data.session.user.id,
                        full_name: displayName,
                        font_size_preference: 20,
                        voice_enabled: true,
                    }]);
                    router.replace('/(tabs)/t_inventory');
                } else {
                    Alert.alert('Success', 'Please check your email for confirmation.');
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                router.replace('/(tabs)/t_inventory');
            }
        } catch (error: any) {
            Alert.alert('Auth Failed', error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={tw`flex-1 bg-aily-bg`}
        >
            <ScrollView contentContainerStyle={tw`flex-grow justify-center px-8 pb-10`}>

                {/* Header Section */}
                <View style={tw`items-center mb-10`}>
                    <View style={tw`w-20 h-20 bg-blue-50 rounded-3xl items-center justify-center mb-6`}>
                        <User size={48} color={tw.color('aily-blue')} strokeWidth={1.5} />
                    </View>
                    <Text style={tw`text-aily-h1 font-atkinson-bold text-aily-primary text-center`}>
                        {isSignup ? "Create Account" : "Welcome Back"}
                    </Text>
                    <Text style={tw`text-aily-body-sm text-aily-secondary text-center mt-2 font-atkinson`}>
                        {isSignup ? "Join AilyCart to manage your fridge" : "Sign in to see your inventory"}
                    </Text>
                </View>

                {/* Form Section */}
                <View style={tw`w-full`}>
                    {isSignup && (
                        <View style={tw`relative mb-4`}>
                            <User size={20} color={tw.color('aily-secondary')} style={tw`absolute left-4 top-4 z-10`} />
                            <TextInput
                                placeholder='Your Name'
                                value={displayName}
                                onChangeText={setDisplayName}
                                maxFontSizeMultiplier={1.4}
                                multiline={true}
                                style={tw`w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-4 text-aily-primary text-aily-body-lg font-atkinson`}
                            />
                        </View>
                    )}

                    <View style={tw`relative mb-4`}>
                        <Mail size={20} color={tw.color('aily-secondary')} style={tw`absolute left-4 top-4 z-10`} />
                        <TextInput
                            placeholder='Email Address'
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            maxFontSizeMultiplier={1.4}
                            multiline={true}
                            style={tw`w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-4 text-aily-primary text-aily-body-lg font-atkinson`}
                        />
                    </View>

                    <View style={tw`relative mb-8`}>
                        <Lock size={20} color={tw.color('aily-secondary')} style={tw`absolute left-4 top-4 z-10`} />
                        <TextInput
                            placeholder='Password'
                            value={password}
                            onChangeText={setPassword}
                            autoCapitalize="none"
                            secureTextEntry={true}
                            maxFontSizeMultiplier={1.4}
                            style={tw`w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-4 text-aily-primary text-aily-body-lg font-atkinson`}
                        />
                    </View>

                    {/* Main Action Button */}
                    <TouchableOpacity
                        onPress={handleAuth}
                        disabled={loading}
                        activeOpacity={0.8}
                        style={tw`w-full bg-aily-blue rounded-2xl py-5 shadow-lg flex-row justify-center items-center`}
                    >
                        {loading ? <ActivityIndicator color="white" /> : (
                            <>
                                <Text style={tw`text-white text-aily-action font-atkinson-bold mr-2`}>
                                    {isSignup ? "Get Started" : "Sign In"}
                                </Text>
                                <ArrowRight size={20} color="white" strokeWidth={3} />
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Switch Mode Button */}
                    <TouchableOpacity
                        onPress={() => setIsSignup(!isSignup)}
                        style={tw`w-full mt-6 py-2`}
                    >
                        <Text style={tw`text-aily-secondary text-aily-body-sm font-atkinson text-center`}>
                            {isSignup ? "Already have an account? " : "New to AilyCart? "}
                            <Text style={tw`text-aily-blue font-atkinson-bold`}>
                                {isSignup ? "Sign In" : "Create one"}
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}