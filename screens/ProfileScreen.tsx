import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, User, Award, Target, BookOpen, Edit2, Check } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { supabase } from '../utils/supabase';
import { useAuthStore } from '../store/useAuthStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const { session, updateUserProfile } = useAuthStore() as any;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalAttempted: 0, passed: 0, failed: 0, averageScore: 0 });
  const [history, setHistory] = useState<any[]>([]);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(session?.user?.user_metadata?.first_name || '');
  const [lastName, setLastName] = useState(session?.user?.user_metadata?.last_name || '');

  useFocusEffect(
    useCallback(() => {
      const fetchProfileData = async () => {
        if (!session?.user) return;
        setLoading(true);
        const { data } = await supabase.from('exam_results').select(`*, exams(title)`).eq('user_id', session.user.id).order('created_at', { ascending: false });

        if (data && data.length > 0) {
          const completedExams = data.filter(e => e.status === 'completed' || !e.status);
          const passedCount = completedExams.filter(e => e.passed).length;
          const totalScore = completedExams.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0);
          setStats({
            totalAttempted: data.length, passed: passedCount, failed: completedExams.length - passedCount,
            averageScore: completedExams.length > 0 ? Math.round(totalScore / completedExams.length) : 0,
          });
          setHistory(data);
        }
        setLoading(false);
      };
      fetchProfileData();
    }, [session])
  );

  const handleSaveProfile = async () => {
    setIsEditing(false);
    await updateUserProfile(firstName, lastName);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-6 py-4 flex-row items-center border-b border-slate-200 bg-white shadow-sm z-10">
        <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.replace('Dashboard')} className="p-2 -ml-2">
          <ChevronLeft size={24} color="#334155" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-800 ml-2">My Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 items-center relative">
          <TouchableOpacity 
            onPress={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
            className="absolute top-4 right-4 p-2 bg-slate-50 rounded-full border border-slate-200"
          >
            {isEditing ? <Check size={18} color="#10b981" /> : <Edit2 size={18} color="#64748b" />}
          </TouchableOpacity>

          <View className="bg-blue-50 p-4 rounded-full mb-4 border border-blue-100">
            <User size={40} color="#3b82f6" />
          </View>

          {isEditing ? (
            <View className="w-full space-y-3 mt-2">
              <TextInput value={firstName} onChangeText={setFirstName} placeholder="First Name" className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center font-bold text-slate-800" />
              <TextInput value={lastName} onChangeText={setLastName} placeholder="Last Name" className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center font-bold text-slate-800" />
            </View>
          ) : (
            <Text className="text-xl font-bold text-slate-800">{firstName} {lastName}</Text>
          )}
          <Text className="text-slate-500 font-medium text-sm mt-1">{session?.user?.email}</Text>
        </View>

        {/* ... (The rest of your Performance Metrics & History UI stays exactly the same) */}
      </ScrollView>
    </SafeAreaView>
  );
}