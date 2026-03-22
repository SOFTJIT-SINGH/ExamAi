import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, ChevronRight, LogOut, ShieldCheck, User } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { supabase } from '../utils/supabase';
import { useAuthStore } from '../store/useAuthStore';

type DashboardProps = { navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>; };

export default function DashboardScreen({ navigation }: DashboardProps) {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const signOut = useAuthStore((s) => s.signOut);

  useFocusEffect(
    useCallback(() => {
      const fetchExams = async () => {
        setLoading(true);
        const { data } = await supabase.from('exams').select('*').order('title');
        if (data) setExams(data);
        setLoading(false);
      };
      fetchExams();
    }, [])
  );

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy': return 'bg-green-100 border-green-200 text-green-700';
      case 'Hard': return 'bg-red-100 border-red-200 text-red-700';
      default: return 'bg-orange-100 border-orange-200 text-orange-700';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-6 py-6 border-b border-slate-200 bg-white flex-row justify-between items-center shadow-sm z-10">
        <View>
          <Text className="text-2xl font-bold text-slate-800 tracking-tight">Exams Dashboard</Text>
          <View className="flex-row items-center mt-1">
            <ShieldCheck size={14} color="#10b981" />
            <Text className="text-sm text-slate-500 ml-1 font-medium">System Online</Text>
          </View>
        </View>
        <View className="flex-row items-center space-x-3">
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} className="p-2 bg-blue-50 rounded-full border border-blue-100 mr-2">
            <User size={22} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity onPress={signOut} className="p-2 bg-slate-100 rounded-full border border-slate-200">
            <LogOut size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={exams}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.replace('ActiveExam', { examId: item.id })}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-4"
            >
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-row items-center flex-1">
                  <View className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                    <FileText size={24} color="#3b82f6" />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-lg font-bold text-slate-800">{item.title}</Text>
                    <Text className="text-xs font-medium text-slate-500 mt-1">{item.duration_minutes} Minutes</Text>
                  </View>
                </View>
                <View className={`px-2 py-1 rounded-md border ${getDifficultyColor(item.difficulty)}`}>
                  <Text className={`text-[10px] font-bold uppercase tracking-wider ${getDifficultyColor(item.difficulty).split(' ').pop()}`}>
                    {item.difficulty || 'Medium'}
                  </Text>
                </View>
              </View>
              <Text className="text-slate-600 text-sm mb-5 leading-relaxed">{item.description}</Text>
              <View className="bg-slate-50 border border-slate-200 py-3 rounded-xl flex-row justify-center items-center">
                <Text className="text-slate-700 font-bold text-sm mr-2">Start Exam</Text>
                <ChevronRight size={16} color="#3b82f6" />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}