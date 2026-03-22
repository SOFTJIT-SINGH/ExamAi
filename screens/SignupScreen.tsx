import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserPlus, Mail, Lock, ChevronLeft } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { supabase } from '../utils/supabase';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Signup'>;
};

export default function SignupScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    
    if (error) {
      Alert.alert('Registration Failed', error.message);
      setLoading(false);
    } else {
      setLoading(false);
      // Move to OTP screen and pass the email for verification
      navigation.navigate('OTP', { email });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-exam-bg relative">
      <TouchableOpacity onPress={() => navigation.goBack()} className="absolute top-12 left-6 z-10 p-2 bg-white rounded-full shadow-sm">
        <ChevronLeft size={24} color="#1e1b4b" />
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-center px-8">
        <View className="items-center mb-10">
          <View className="bg-exam-accent/30 p-4 rounded-full mb-4">
            <UserPlus size={48} color="#4338ca" />
          </View>
          <Text className="text-3xl font-bold text-exam-dark">Register</Text>
          <Text className="text-slate-500 mt-2 text-center">Create your secure student account.</Text>
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
              placeholder="Password (Min 6 chars)"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            onPress={handleSignup}
            disabled={loading}
            className={`mt-8 h-14 rounded-xl justify-center items-center shadow-md ${loading ? 'bg-indigo-400' : 'bg-exam-dark'}`}
          >
            <Text className="text-white font-bold text-lg">{loading ? 'Creating Account...' : 'Sign Up'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}