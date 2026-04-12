import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useAuthStore } from '../store/useAuthStore';
import { Mail, Lock, User as UserIcon, AlertCircle, Phone } from 'lucide-react-native';

type SignupScreenProps = { navigation: NativeStackNavigationProp<RootStackParamList, 'Signup'> };

export default function SignupScreen({ navigation }: SignupScreenProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const signUp = useAuthStore((s) => s.signUp);
  const isLoading = useAuthStore((s) => s.isLoading);

  const handleConfirmBlur = () => {
    if (confirmPassword && password !== confirmPassword) setConfirmError('Passwords do not match');
    else setConfirmError('');
  };

  const handleSignup = async () => {
    if (!firstName || !email || !password || !confirmPassword) {
      Alert.alert('Required Fields', 'Please fill out all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match');
      return;
    }

    try {
      await signUp(email, password, firstName, lastName, phone);
      Alert.alert('Success', 'Account created! Please verify your email.');
      navigation.navigate('Login');
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ padding: 32, flexGrow: 1, justifyContent: 'center' }}>
        <Text className="mb-2 text-3xl font-bold tracking-tight text-slate-800">
          Create Account
        </Text>
        <Text className="mb-10 text-base text-slate-500">
          Join the secure examination platform.
        </Text>

        <View className="space-y-4">
          <View className="flex-row items-center rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <UserIcon size={20} color="#94a3b8" />
            <TextInput
              placeholder="First Name *"
              value={firstName}
              onChangeText={setFirstName}
              className="ml-3 flex-1 text-base text-slate-800"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View className="flex-row items-center rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <UserIcon size={20} color="#94a3b8" />
            <TextInput
              placeholder="Last Name (Optional)"
              value={lastName}
              onChangeText={setLastName}
              className="ml-3 flex-1 text-base text-slate-800"
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* NEW PHONE FIELD */}
          <View className="flex-row items-center rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <Phone size={20} color="#94a3b8" />
            <TextInput
              placeholder="Phone Number (Optional)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              className="ml-3 flex-1 text-base text-slate-800"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View className="flex-row items-center rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <Mail size={20} color="#94a3b8" />
            <TextInput
              placeholder="Email Address *"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              className="ml-3 flex-1 text-base text-slate-800"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View className="flex-row items-center rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <Lock size={20} color="#94a3b8" />
            <TextInput
              placeholder="Password *"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              className="ml-3 flex-1 text-base text-slate-800"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <View>
            <View
              className={`flex-row items-center rounded-xl border bg-white px-4 py-3 shadow-sm ${confirmError ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}>
              <Lock size={20} color={confirmError ? '#f87171' : '#94a3b8'} />
              <TextInput
                placeholder="Confirm Password *"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onBlur={handleConfirmBlur}
                secureTextEntry
                className="ml-3 flex-1 text-base text-slate-800"
                placeholderTextColor={confirmError ? '#fca5a5' : '#94a3b8'}
              />
            </View>
            {confirmError ? (
              <View className="ml-1 mt-2 flex-row items-center">
                <AlertCircle size={14} color="#ef4444" />
                <Text className="ml-1 text-xs font-medium text-red-500">{confirmError}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSignup}
          disabled={isLoading}
          className="mt-10 rounded-xl bg-blue-600 p-4 shadow-md shadow-blue-500/30">
          <Text className="text-center text-lg font-bold text-white">
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <View className="mt-6 flex-row justify-center">
          <Text className="text-slate-500">Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text className="font-bold text-blue-600">Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
