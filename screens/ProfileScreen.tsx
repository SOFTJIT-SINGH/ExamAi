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
  const [stats, setStats] = useState({
    totalAttempted: 0,
    passed: 0,
    failed: 0,
    averageScore: 0,
  });
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
        const passedCount = data.filter(e => e.passed).length;
        const totalScore = data.reduce((acc, curr) => acc + Number(curr.score), 0);

        setStats({
          totalAttempted: data.length,
          passed: passedCount,
          failed: data.length - passedCount,
          averageScore: Math.round(totalScore / data.length),
        });
        setHistory(data);
      }
      setLoading(false);
    };

    fetchProfileData();
  }, [session]);

  return (
    <SafeAreaView className="flex-1 bg-exam-bg">
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center border-b border-slate-200 bg-white">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 -ml-2">
          <ChevronLeft size={24} color="#1e1b4b" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-exam-dark ml-2">Student Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* User Info Card */}
        <View className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 items-center">
          <View className="bg-exam-accent p-4 rounded-full mb-4">
            <User size={40} color="#4338ca" />
          </View>
          <Text className="text-xl font-bold text-slate-800">{session?.user?.email}</Text>
          <Text className="text-slate-500 font-medium mt-1">Enrolled Student</Text>
        </View>

        {/* Statistics Grid */}
        <Text className="text-lg font-bold text-exam-dark mb-4">Performance Overview</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#4338ca" className="my-8" />
        ) : (
          <>
            <View className="flex-row justify-between mb-4">
              <View className="bg-white flex-1 p-4 rounded-2xl border border-slate-200 shadow-sm mr-2 items-center">
                <Target size={24} color="#3b82f6" className="mb-2" />
                <Text className="text-2xl font-black text-slate-800">{stats.totalAttempted}</Text>
                <Text className="text-xs font-bold text-slate-400 uppercase mt-1">Exams Taken</Text>
              </View>
              <View className="bg-white flex-1 p-4 rounded-2xl border border-slate-200 shadow-sm ml-2 items-center">
                <Award size={24} color="#16a34a" className="mb-2" />
                <Text className="text-2xl font-black text-slate-800">{stats.averageScore}%</Text>
                <Text className="text-xs font-bold text-slate-400 uppercase mt-1">Avg Score</Text>
              </View>
            </View>

            <View className="flex-row justify-between mb-8">
              <View className="bg-green-50 flex-1 p-4 rounded-2xl border border-green-100 mr-2 items-center">
                <Text className="text-2xl font-black text-green-700">{stats.passed}</Text>
                <Text className="text-xs font-bold text-green-600 uppercase mt-1">Passed</Text>
              </View>
              <View className="bg-red-50 flex-1 p-4 rounded-2xl border border-red-100 ml-2 items-center">
                <XCircle size={24} color="#dc2626" className="mb-2" />
                <Text className="text-2xl font-black text-red-700">{stats.failed}</Text>
                <Text className="text-xs font-bold text-red-600 uppercase mt-1">Failed</Text>
              </View>
            </View>

            {/* Exam History List */}
            <Text className="text-lg font-bold text-exam-dark mb-4">Recent Results</Text>
            {history.length === 0 ? (
              <Text className="text-slate-500 text-center py-4">No exams taken yet.</Text>
            ) : (
              history.map((result) => (
                <View key={result.id} className="bg-white p-4 rounded-xl border border-slate-200 mb-3 flex-row justify-between items-center">
                  <View className="flex-1 pr-4">
                    <Text className="font-bold text-slate-800" numberOfLines={1}>
                      {result.exams?.title || "Unknown Exam"}
                    </Text>
                    <Text className="text-xs text-slate-400 mt-1">
                      {new Date(result.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View className={`px-3 py-1.5 rounded-lg ${result.passed ? 'bg-green-100' : 'bg-red-100'}`}>
                    <Text className={`font-bold ${result.passed ? 'text-green-700' : 'text-red-700'}`}>
                      {result.score}%
                    </Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}