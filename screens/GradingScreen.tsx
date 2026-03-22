import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useExamStore } from '../store/useExamStore';
import { ShieldCheck } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Grading'>;

export default function GradingScreen({ route, navigation }: Props) {
  const { examId } = route.params;
  const submitExam = useExamStore(state => state.submitExam);

  useEffect(() => {
    const processData = async () => {
      await submitExam(examId, 'completed');
      
      // Wait 1.5 seconds for the Camera hardware to fully power down safely
      setTimeout(() => {
        navigation.replace('Result', { examId });
      }, 1500); 
    };
    
    processData();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-exam-bg justify-center items-center px-6">
      <ShieldCheck size={80} color="#0ea5e9" />
      <ActivityIndicator size="large" color="#0ea5e9" style={{ marginTop: 24 }} />
      <Text style={{ color: '#0ea5e9', fontFamily: 'monospace', fontWeight: 'bold', fontSize: 18, marginTop: 24, textTransform: 'uppercase', letterSpacing: 2 }}>
        Processing Data...
      </Text>
      <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
        Safely disconnecting hardware
      </Text>
    </SafeAreaView>
  );
}