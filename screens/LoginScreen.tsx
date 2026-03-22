import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck, Mail, Lock } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { supabase } from '../utils/supabase';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Login Failed', error.message);
    setLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-exam-bg">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-center px-8">
        <View className="items-center mb-10">
          <View className="bg-exam-accent/30 p-4 rounded-full mb-4">
            <ShieldCheck size={48} color="#4338ca" />
          </View>
          <Text className="text-3xl font-bold text-exam-dark">SecurePortal</Text>
          <Text className="text-slate-500 mt-2 text-center">Sign in to access your proctored examinations.</Text>
        </View>

        <View className="space-y-4">
          <View className="bg-white flex-row items-center border border-slate-200 rounded-xl px-4 h-14 shadow-sm">
            <Mail size={20} color="#94a3b8" />
            <TextInput
              className="flex-1 ml-3 text-base text-slate-800"
              placeholder="Student Email"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View className="bg-white flex-row items-center border border-slate-200 rounded-xl px-4 h-14 shadow-sm mt-4">
            <Lock size={20} color="#94a3b8" />
            <TextInput
              className="flex-1 ml-3 text-base text-slate-800"
              placeholder="Password"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} className="self-end mt-2">
            <Text className="text-exam-primary font-semibold text-sm">Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className={`mt-6 h-14 rounded-xl justify-center items-center shadow-md ${loading ? 'bg-indigo-400' : 'bg-exam-primary'}`}
          >
            <Text className="text-white font-bold text-lg">{loading ? 'Authenticating...' : 'Secure Login'}</Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className="text-slate-500">Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text className="text-exam-primary font-bold">Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}