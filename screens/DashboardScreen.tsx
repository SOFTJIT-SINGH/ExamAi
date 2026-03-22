import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, ChevronRight, LogOut, ShieldCheck } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { supabase } from '../utils/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { User } from 'lucide-react-native';

type DashboardProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

export default function DashboardScreen({ navigation }: DashboardProps) {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const signOut = useAuthStore((s) => s.signOut);

  useEffect(() => {
    const fetchExams = async () => {
      const { data, error } = await supabase.from('exams').select('*');
      if (data) setExams(data);
      setLoading(false);
    };
    fetchExams();
  }, []);

  const startExam = (examId: string) => {
    // Navigate to the active exam screen and pass the ID
    navigation.replace('ActiveExam', { examId });
  };

  return (
    <SafeAreaView className="flex-1 bg-exam-bg">
      <View className="px-6 py-6 border-b border-slate-200 bg-white flex-row justify-between items-center">
        <View>
          <Text className="text-2xl font-bold text-exam-dark">Dashboard</Text>
          <View className="flex-row items-center mt-1">
            <ShieldCheck size={14} color="#16a34a" />
            <Text className="text-sm text-green-600 font-semibold ml-1">Session Secured</Text>
          </View>
        </View>
        
        <View className="flex-row items-center space-x-3">
          {/* New Profile Button */}
          <TouchableOpacity 
            onPress={() => navigation.navigate('Profile')} 
            className="p-2 bg-exam-accent/30 rounded-full border border-indigo-100 mr-2"
          >
            <User size={22} color="#4338ca" />
          </TouchableOpacity>
          
          {/* Existing Logout Button */}
          <TouchableOpacity onPress={signOut} className="p-2 bg-slate-100 rounded-full">
            <LogOut size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4338ca" />
        </View>
      ) : (
        <FlatList
          data={exams}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => startExam(item.id)}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-4"
            >
              <View className="flex-row items-center mb-3">
                <View className="bg-exam-accent/50 p-3 rounded-xl">
                  <FileText size={24} color="#4338ca" />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-lg font-bold text-slate-800">{item.title}</Text>
                  <Text className="text-sm font-semibold text-slate-500 mt-0.5">
                    {item.duration_minutes} Minutes
                  </Text>
                </View>
              </View>
              <Text className="text-slate-600 text-sm mb-4 leading-relaxed">
                {item.description}
              </Text>
              <View className="bg-exam-dark py-3 rounded-xl flex-row justify-center items-center">
                <Text className="text-white font-bold mr-2">Begin Proctored Exam</Text>
                <ChevronRight size={18} color="#ffffff" />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}