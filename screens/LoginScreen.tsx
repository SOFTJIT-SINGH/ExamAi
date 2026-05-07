import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center px-8">
        <View className="mb-10 items-center">
          <View className="mb-4 rounded-full bg-exam-accent/30 p-4">
            <ShieldCheck size={48} color="#4338ca" />
          </View>
          <Text className="text-3xl font-bold text-exam-dark">Exam AI</Text>
          <Text className="mt-2 text-center text-slate-500">
            Sign in to access your proctored examinations.
          </Text>
        </View>

        <View className="space-y-4">
          <View className="h-14 flex-row items-center rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
            <Mail size={20} color="#94a3b8" />
            <TextInput
              className="ml-3 flex-1 text-base text-slate-800"
              placeholder="Student Email"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View className="mt-4 h-14 flex-row items-center rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
            <Lock size={20} color="#94a3b8" />
            <TextInput
              className="ml-3 flex-1 text-base text-slate-800"
              placeholder="Password"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            className="mt-2 self-end">
            <Text className="text-sm font-semibold text-exam-primary">Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className={`mt-6 h-14 items-center justify-center rounded-xl shadow-md ${loading ? 'bg-indigo-400' : 'bg-exam-primary'}`}>
            <Text className="text-lg font-bold text-white">
              {loading ? 'Authenticating...' : 'Secure Login'}
            </Text>
          </TouchableOpacity>

          <View className="mt-6 flex-row justify-center">
            <Text className="text-slate-500">Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text className="font-bold text-exam-primary">Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
