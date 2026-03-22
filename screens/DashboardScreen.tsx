import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, ChevronRight, LogOut, ShieldCheck, User } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { supabase } from '../utils/supabase';
import { useAuthStore } from '../store/useAuthStore';

type DashboardProps = { navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>; };

export default function DashboardScreen({ navigation }: DashboardProps) {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const signOut = useAuthStore((s) => s.signOut);

  useEffect(() => {
    const fetchExams = async () => {
      const { data } = await supabase.from('exams').select('*').order('title');
      if (data) setExams(data);
      setLoading(false);
    };
    fetchExams();
  }, []);

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy': return 'bg-green-500/10 border-green-500/30 text-green-400';
      case 'Hard': return 'bg-red-500/10 border-red-500/30 text-red-400';
      default: return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-exam-bg">
      <View className="px-6 py-6 border-b border-exam-border bg-exam-bg flex-row justify-between items-center">
        <View>
          <Text className="text-2xl font-bold text-exam-text tracking-wide">Command Center</Text>
          <View className="flex-row items-center mt-1">
            <ShieldCheck size={14} color="#10b981" />
            <Text className="text-sm text-green-500 font-mono ml-1">Secure Uplink</Text>
          </View>
        </View>
        <View className="flex-row items-center space-x-3">
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} className="p-2 bg-exam-primary/10 rounded-full border border-exam-primary/30 mr-2">
            <User size={22} color="#0ea5e9" />
          </TouchableOpacity>
          <TouchableOpacity onPress={signOut} className="p-2 bg-exam-card rounded-full border border-exam-border">
            <LogOut size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0ea5e9" />
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
              className="bg-exam-card p-5 rounded-2xl border border-exam-border shadow-lg shadow-black/20 mb-4"
            >
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-row items-center flex-1">
                  <View className="bg-exam-bg p-3 rounded-xl border border-exam-border">
                    <FileText size={24} color="#0ea5e9" />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="text-lg font-bold text-exam-text">{item.title}</Text>
                    <Text className="text-xs font-mono text-exam-primary mt-1">{item.duration_minutes} MIN TIMEOUT</Text>
                  </View>
                </View>
                {/* Difficulty Badge */}
                <View className={`px-2 py-1 rounded border ${getDifficultyColor(item.difficulty)}`}>
                  <Text className={`text-[10px] font-bold uppercase tracking-widest ${getDifficultyColor(item.difficulty).split(' ').pop()}`}>
                    {item.difficulty || 'Medium'}
                  </Text>
                </View>
              </View>
              <Text className="text-exam-muted text-sm mb-5 leading-relaxed">{item.description}</Text>
              <View className="bg-exam-bg border border-exam-border py-3 rounded-xl flex-row justify-center items-center">
                <Text className="text-exam-text font-mono tracking-widest text-sm mr-2">INITIALIZE SEQUENCE</Text>
                <ChevronRight size={16} color="#0ea5e9" />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}