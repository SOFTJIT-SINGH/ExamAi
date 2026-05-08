import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, ShieldCheck, PenTool, BarChart3, ChevronRight } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/useAuthStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Instructions'>;

export default function InstructionsScreen({ navigation }: Props) {
  const { userProfile } = useAuthStore();

  const handleGetStarted = () => {
    if (userProfile?.role === 'admin') {
      navigation.replace('AdminDashboard');
    } else {
      navigation.replace('Dashboard');
    }
  };

  const steps = [
    {
      title: 'Select an Assessment',
      description: 'Choose from a variety of categories. Pick the number of questions you want or attempt the full exam.',
      icon: <BookOpen size={28} color="#3b82f6" />,
      color: 'bg-blue-50 border-blue-100',
    },
    {
      title: 'AI Proctoring Active',
      description: 'During the exam, AI Vision ensures fairness by monitoring for multiple faces or cellphones. Stay focused!',
      icon: <ShieldCheck size={28} color="#10b981" />,
      color: 'bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Real-time AI Grading',
      description: 'Submit your exam and instantly receive AI-powered feedback with explanations for each answer.',
      icon: <BarChart3 size={28} color="#8b5cf6" />,
      color: 'bg-violet-50 border-violet-100',
    },
    // {
    //   title: 'Contribute Questions',
    //   description: 'Help the community grow! Create and manage your own questions in the Contribute HQ.',
    //   icon: <PenTool size={28} color="#f59e0b" />,
    //   color: 'bg-amber-50 border-amber-100',
    // },
  ];



  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="mb-8 mt-4">
          <Text className="text-4xl font-extrabold text-white tracking-tight">Exam AI Guide</Text>
          <Text className="text-slate-400 mt-2 text-base leading-relaxed">
            Welcome! Follow these simple steps to master your skills and pass your assessments.
          </Text>
        </View>

        {steps.map((step, index) => (
          <View key={index} className="flex-row items-start mb-6 bg-slate-800 p-5 rounded-3xl border border-slate-700 shadow-xl">
            <View className={`w-14 h-14 rounded-2xl items-center justify-center border ${step.color}`}>
              {step.icon}
            </View>
            <View className="flex-1 ml-4 justify-center">
              <Text className="text-lg font-bold text-white mb-1">{step.title}</Text>
              <Text className="text-slate-400 text-sm leading-relaxed">{step.description}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity 
          onPress={handleGetStarted}
          className="mt-6 bg-blue-600 rounded-2xl h-14 flex-row items-center justify-center shadow-lg shadow-blue-500/30"
          activeOpacity={0.8}
        >
          <Text className="text-white font-bold text-lg mr-2">Start Learning</Text>
          <ChevronRight size={20} color="white" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
