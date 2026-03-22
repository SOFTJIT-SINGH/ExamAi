import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, User, Award, Target, XCircle } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { supabase } from '../utils/supabase';
import { useAuthStore } from '../store/useAuthStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const { session } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalAttempted: 0, passed: 0, failed: 0, averageScore: 0 });
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!session?.user) return;
      const { data, error } = await supabase
        .from('exam_results')
        .select(`*, exams(title)`)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        const completedExams = data.filter(e => e.status === 'completed');
        const passedCount = completedExams.filter(e => e.passed).length;
        const totalScore = completedExams.reduce((acc, curr) => acc + Number(curr.score), 0);

        setStats({
          totalAttempted: data.length, 
          passed: passedCount,
          failed: completedExams.length - passedCount,
          averageScore: completedExams.length > 0 ? Math.round(totalScore / completedExams.length) : 0,
        });
        setHistory(data);
      }
      setLoading(false);
    };
    fetchProfileData();
  }, [session]);

  return (
    <SafeAreaView className="flex-1 bg-exam-bg">
      <View className="px-6 py-4 flex-row items-center border-b border-exam-border bg-exam-bg">
        <TouchableOpacity 
          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.replace('Dashboard')} 
          className="p-2 -ml-2"
        >
          <ChevronLeft size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-exam-text ml-2 tracking-wide">Student Dossier</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View className="bg-exam-card p-6 rounded-2xl border border-exam-border shadow-lg shadow-black/20 mb-6 items-center">
          <View className="bg-exam-primary/20 p-4 rounded-full mb-4">
            <User size={40} color="#0ea5e9" />
          </View>
          <Text className="text-xl font-bold text-exam-text">{session?.user?.email}</Text>
          <Text className="text-exam-primary font-mono text-xs mt-1 tracking-widest uppercase">Active Operative</Text>
        </View>

        <Text className="text-sm font-bold text-exam-muted uppercase tracking-widest mb-4">Performance Metrics</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#0ea5e9" className="my-8" />
        ) : (
          <>
            <View className="flex-row justify-between mb-4">
              <View className="bg-exam-card flex-1 p-4 rounded-2xl border border-exam-border mr-2 items-center">
                <Target size={24} color="#0ea5e9" className="mb-2" />
                <Text className="text-2xl font-mono text-exam-text">{stats.totalAttempted}</Text>
                <Text className="text-xs font-bold text-exam-muted uppercase mt-1">Sessions</Text>
              </View>
              <View className="bg-exam-card flex-1 p-4 rounded-2xl border border-exam-border ml-2 items-center">
                <Award size={24} color="#10b981" className="mb-2" />
                <Text className="text-2xl font-mono text-exam-text">{stats.averageScore}%</Text>
                <Text className="text-xs font-bold text-exam-muted uppercase mt-1">Avg Score</Text>
              </View>
            </View>

            <Text className="text-sm font-bold text-exam-muted uppercase tracking-widest mt-4 mb-4">Session Logs</Text>
            {history.length === 0 ? (
              <Text className="text-exam-muted text-center py-4">No data streams found.</Text>
            ) : (
              history.map((result) => {
                const isCancelled = result.status === 'cancelled';
                const leftBlank = result.total_questions - result.attempted_questions;
                
                return (
                  <View key={result.id} className="bg-exam-card p-4 rounded-xl border border-exam-border mb-3">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="font-bold text-exam-text flex-1" numberOfLines={1}>
                        {result.exams?.title || "Unknown Matrix"}
                      </Text>
                      <View className={`px-2 py-1 rounded-md border ${
                        isCancelled ? 'bg-orange-500/10 border-orange-500/30' : 
                        result.passed ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                      }`}>
                        <Text className={`font-mono text-xs font-bold ${
                          isCancelled ? 'text-orange-400' : result.passed ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {isCancelled ? 'ABORTED' : `${result.score}%`}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-exam-border/50">
                      <Text className="text-xs text-exam-muted">
                        Attempted: <Text className="text-exam-text font-mono">{result.attempted_questions || 0}</Text> / {result.total_questions}
                      </Text>
                      <Text className="text-xs text-exam-muted">
                        Left Blank: <Text className="text-exam-danger font-mono">{leftBlank || 0}</Text>
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