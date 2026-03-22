import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useAuthStore } from '../store/useAuthStore';
import { Mail, Lock, User as UserIcon, AlertCircle } from 'lucide-react-native';

type SignupScreenProps = { navigation: NativeStackNavigationProp<RootStackParamList, 'Signup'>; };

export default function SignupScreen({ navigation }: SignupScreenProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmError, setConfirmError] = useState('');
  
  const signUp = useAuthStore((s) => s.signUp);
  const isLoading = useAuthStore((s) => s.isLoading);

  // Magic UX: Validates the moment they leave the input field
  const handleConfirmBlur = () => {
    if (confirmPassword && password !== confirmPassword) {
      setConfirmError('Passwords do not match');
    } else {
      setConfirmError('');
    }
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
      // @ts-ignore - Assuming types were updated, if not it just passes the args
      await signUp(email, password, firstName, lastName);
      Alert.alert('Success', 'Account created! Please verify your email.');
      navigation.navigate('Login');
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ padding: 32, flexGrow: 1, justifyContent: 'center' }}>
        <Text className="text-3xl font-bold text-slate-800 tracking-tight mb-2">Create Account</Text>
        <Text className="text-slate-500 text-base mb-10">Join the secure examination platform.</Text>

        <View className="space-y-4">
          {/* First Name */}
          <View className="bg-white px-4 py-3 rounded-xl border border-slate-200 flex-row items-center shadow-sm">
            <UserIcon size={20} color="#94a3b8" />
            <TextInput
              placeholder="First Name *"
              value={firstName}
              onChangeText={setFirstName}
              className="flex-1 ml-3 text-base text-slate-800"
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* Last Name (Optional) */}
          <View className="bg-white px-4 py-3 rounded-xl border border-slate-200 flex-row items-center shadow-sm">
            <UserIcon size={20} color="#94a3b8" />
            <TextInput
              placeholder="Last Name (Optional)"
              value={lastName}
              onChangeText={setLastName}
              className="flex-1 ml-3 text-base text-slate-800"
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* Email */}
          <View className="bg-white px-4 py-3 rounded-xl border border-slate-200 flex-row items-center shadow-sm">
            <Mail size={20} color="#94a3b8" />
            <TextInput
              placeholder="Email Address *"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              className="flex-1 ml-3 text-base text-slate-800"
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* Password */}
          <View className="bg-white px-4 py-3 rounded-xl border border-slate-200 flex-row items-center shadow-sm">
            <Lock size={20} color="#94a3b8" />
            <TextInput
              placeholder="Password *"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              className="flex-1 ml-3 text-base text-slate-800"
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* Confirm Password */}
          <View>
            <View className={`bg-white px-4 py-3 rounded-xl border flex-row items-center shadow-sm ${confirmError ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}>
              <Lock size={20} color={confirmError ? "#f87171" : "#94a3b8"} />
              <TextInput
                placeholder="Confirm Password *"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onBlur={handleConfirmBlur}
                secureTextEntry
                className="flex-1 ml-3 text-base text-slate-800"
                placeholderTextColor={confirmError ? "#fca5a5" : "#94a3b8"}
              />
            </View>
            {confirmError ? (
              <View className="flex-row items-center mt-2 ml-1">
                <AlertCircle size={14} color="#ef4444" />
                <Text className="text-red-500 text-xs ml-1 font-medium">{confirmError}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleSignup} 
          disabled={isLoading}
          className="bg-blue-600 mt-10 p-4 rounded-xl shadow-md shadow-blue-500/30"
        >
          <Text className="text-white text-center font-bold text-lg">
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center mt-6">
          <Text className="text-slate-500">Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text className="text-blue-600 font-bold">Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}