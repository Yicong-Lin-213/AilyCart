import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase-client';
import tw from '../lib/tailwind';
import { useRouter } from 'expo-router';

export default function Auth() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignup, setIsSignup] = useState(false);
    const [displayName, setDisplayName] = useState('');

    async function handleAuth() {
        setLoading(true);
        if (isSignup) {
            const { data, error } = await supabase.auth.signUp( {
                email, 
                password,
                options: {
                    data: { display_name: displayName}
                }
            } );
            if (error) {
                Alert.alert('Registration Failed', error.message);
                throw error;
            }
            
            if (data.session) {
                console.debug(`Creating profile for ${data.session.user.id}: ${displayName}`);
                const {error: profileError} = await supabase.from('profiles').upsert([{
                    id: data.session.user.id,
                    full_name: displayName,
                    font_size_preference: 20,
                    voice_enabled: true,
                }]);

                if (profileError) {
                    console.error('Profile Creation Failed', profileError.message);
                    throw profileError;
                }

                router.replace('/');
            }
        } else {
            const { error } = await supabase.auth.signInWithPassword( {email, password} );
            if (error) Alert.alert('Login Failed', error.message);
            else router.replace('/');
        }
        setLoading(false);
    }

    return (
        <View style={tw`flex-1 bg-aily-bg p-8 pt-2 justify-center items-center`}>
            <Text style={tw`text-aily-h1 font-atkinson-bold text-aily-primary mb-8`}>
                {isSignup ? "Create an Account" : "Welcome Back"}
            </Text>

            <TextInput 
                placeholder='Email'
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                style={tw`w-full bg-white border border-aily-blue rounded-xl px-4 py-3 mb-4 text-aily-primary text-aily-body-lg`}
            />

            <TextInput 
                placeholder='Password'
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                secureTextEntry={true}
                style={tw`w-full bg-white border border-aily-blue rounded-xl px-4 py-3 mb-4 text-aily-primary text-aily-body-lg`}
            />

            {isSignup && (
                <TextInput 
                    placeholder='Display Name'
                    value={displayName}
                    onChangeText={setDisplayName}
                    style={tw`w-full bg-white border border-aily-blue rounded-xl px-4 py-3 mb-4 text-aily-primary text-aily-body-lg`}
                />
            )}

            <TouchableOpacity 
                onPress={handleAuth}
                disabled={loading}
                style={tw`w-full bg-aily-blue rounded-xl px-4 py-3 mb-4 text-white text-aily-body-lg`}
            >
                {loading ? <ActivityIndicator color="white" /> : (
                    <Text style={tw`text-white text-aily-body-lg font-atkinson-bold text-center`}>
                        {isSignup ? "Sign Up" : "Sign In"}
                    </Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity 
                onPress={() => setIsSignup(!isSignup)}
                style={tw`w-full bg-white rounded-xl px-4 py-3 mb-4 text-aily-blue text-aily-body-lg`}
            >
                <Text style={tw`text-aily-blue text-aily-body-lg font-atkinson-bold text-center`}>
                    {isSignup ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                </Text>
            </TouchableOpacity>
        </View>
    );
}