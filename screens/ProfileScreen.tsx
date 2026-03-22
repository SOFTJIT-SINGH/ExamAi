import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, User, Award, Target } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { supabase } from '../utils/supabase';
import { useAuthStore } from '../store/useAuthStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const { session } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalAttempted: 0, passed: 0, failed: 0, averageScore: 0 });
  const [history, setHistory] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      const fetchProfileData = async () => {
        if (!session?.user) return;
        setLoading(true);
        
        const { data, error } = await supabase
          .from('exam_results')
          .select(`*, exams(title)`)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          // THE FIX: If an old exam has no status (!e.status), we count it as completed!
          const completedExams = data.filter(e => e.status === 'completed' || !e.status);
          const passedCount = completedExams.filter(e => e.passed).length;
          const totalScore = completedExams.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);

          setStats({
            totalAttempted: data.length, 
            passed: passedCount,
            failed: completedExams.length - passedCount,
            averageScore: completedExams.length > 0 ? Math.round(totalScore / completedExams.length) : 0,
          });
          setHistory(data);
        } else {
          setStats({ totalAttempted: 0, passed: 0, failed: 0, averageScore: 0 });
          setHistory([]);
        }
        setLoading(false);
      };
      fetchProfileData();
    }, [session])
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-6 py-4 flex-row items-center border-b border-slate-200 bg-white shadow-sm z-10">
        <TouchableOpacity 
          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.replace('Dashboard')} 
          className="p-2 -ml-2"
        >
          <ChevronLeft size={24} color="#334155" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-800 ml-2">My Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 items-center">
          <View className="bg-blue-50 p-4 rounded-full mb-4 border border-blue-100">
            <User size={40} color="#3b82f6" />
          </View>
          <Text className="text-xl font-bold text-slate-800">{session?.user?.email}</Text>
          <Text className="text-slate-500 font-medium text-sm mt-1">Student Account</Text>
        </View>

        <Text className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Performance Metrics</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" className="my-8" />
        ) : (
          <>
            <View className="flex-row justify-between mb-6">
              <View className="bg-white flex-1 p-5 rounded-2xl border border-slate-200 shadow-sm mr-2 items-center">
                <Target size={28} color="#3b82f6" className="mb-2" />
                <Text className="text-3xl font-bold text-slate-800">{stats.totalAttempted}</Text>
                <Text className="text-xs font-semibold text-slate-500 uppercase mt-1">Total Exams</Text>
              </View>
              <View className="bg-white flex-1 p-5 rounded-2xl border border-slate-200 shadow-sm ml-2 items-center">
                <Award size={28} color="#10b981" className="mb-2" />
                <Text className="text-3xl font-bold text-slate-800">{stats.averageScore}%</Text>
                <Text className="text-xs font-semibold text-slate-500 uppercase mt-1">Avg Score</Text>
              </View>
            </View>

            <Text className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Recent Exams</Text>
            {history.length === 0 ? (
              <Text className="text-slate-500 text-center py-4 bg-white p-4 rounded-xl border border-slate-200">No exams taken yet.</Text>
            ) : (
              history.map((result) => {
                const isCancelled = result.status === 'cancelled';
                const leftBlank = result.total_questions - result.attempted_questions;
                
                return (
                  <View key={result.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-3">
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="font-bold text-slate-800 flex-1 text-base" numberOfLines={1}>
                        {result.exams?.title || "Unknown Exam"}
                      </Text>
                      <View className={`px-2 py-1 rounded-md border ${
                        isCancelled ? 'bg-slate-100 border-slate-300' : 
                        result.passed ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'
                      }`}>
                        <Text className={`text-xs font-bold ${
                          isCancelled ? 'text-slate-600' : result.passed ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {isCancelled ? 'CANCELLED' : `${result.score}%`}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center justify-between pt-3 border-t border-slate-100">
                      <Text className="text-sm text-slate-500">
                        Answered: <Text className="text-slate-800 font-semibold">{result.attempted_questions || 0}</Text> / {result.total_questions}
                      </Text>
                      <Text className="text-sm text-slate-500">
                        Blank: <Text className="text-red-500 font-semibold">{leftBlank || 0}</Text>
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}