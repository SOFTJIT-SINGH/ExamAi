import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyRound, ChevronLeft } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { supabase } from '../utils/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'OTP'>;

const OTP_LENGTH = 6;

export default function OTPScreen({ route, navigation }: Props) {
  const { email } = route.params;
  
  // Array to hold the 6 digits
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  
  // Array of refs to manage focus between the 6 boxes
  const inputRefs = useRef<TextInput[]>([]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    // Only allow numbers
    const cleanText = text.replace(/[^0-9]/g, '');
    
    newOtp[index] = cleanText;
    setOtp(newOtp);

    // Auto-advance to the next field if a number was typed
    if (cleanText && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Auto-go back to the previous field if backspace is pressed on an empty box
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const token = otp.join('');
    
    if (token.length < OTP_LENGTH) {
      return Alert.alert('Error', 'Please enter the complete 6-digit code.');
    }

    Keyboard.dismiss();
    setLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });

    if (error) {
      Alert.alert('Verification Failed', error.message);
      setLoading(false);
    }
    // Note: If successful, useAuthStore catches the session change and auto-redirects to Dashboard!
  };

  return (
    <SafeAreaView className="flex-1 bg-exam-bg relative">
      <TouchableOpacity onPress={() => navigation.goBack()} className="absolute top-12 left-6 z-10 p-2 bg-white rounded-full shadow-sm border border-slate-100">
        <ChevronLeft size={24} color="#1e1b4b" />
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-center px-6">
        <View className="items-center mb-10">
          <View className="bg-exam-accent/30 p-4 rounded-full mb-5">
            <KeyRound size={42} color="#4338ca" />
          </View>
          <Text className="text-3xl font-bold text-exam-dark">Verification</Text>
          <Text className="text-slate-500 mt-3 text-center text-base px-4 leading-relaxed">
            Enter the 6-digit code sent to{'\n'}
            <Text className="font-bold text-slate-800">{email}</Text>
          </Text>
        </View>

        {/* The Split OTP Input Grid */}
        <View className="flex-row justify-center items-center space-x-2 mb-8 gap-x-2">
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                if (ref) inputRefs.current[index] = ref;
              }}
              className={`w-12 h-14 border-2 rounded-xl text-center text-2xl font-bold shadow-sm transition-all ${
                activeIndex === index 
                  ? 'border-exam-primary bg-exam-accent/10' 
                  : digit 
                    ? 'border-slate-300 bg-white' 
                    : 'border-slate-200 bg-slate-50'
              } ${digit ? 'text-exam-dark' : 'text-slate-400'}`}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              onFocus={() => setActiveIndex(index)}
              onBlur={() => setActiveIndex(-1)}
              selectTextOnFocus // Highlights existing text so typing replaces it easily
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={handleVerify}
          disabled={loading || otp.join('').length !== OTP_LENGTH}
          className={`h-14 rounded-xl justify-center items-center shadow-md ${
            loading || otp.join('').length !== OTP_LENGTH 
              ? 'bg-indigo-300 shadow-none' 
              : 'bg-exam-primary shadow-indigo-200'
          }`}
        >
          <Text className="text-white font-bold text-lg tracking-wide">
            {loading ? 'Verifying...' : 'Confirm Identity'}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center mt-8">
          <Text className="text-slate-500 font-medium">Didn't receive the code? </Text>
          <TouchableOpacity onPress={() => Alert.alert("Sent", "A new code has been requested.")}>
            <Text className="text-exam-primary font-bold">Resend</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}