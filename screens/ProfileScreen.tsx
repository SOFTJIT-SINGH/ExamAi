import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
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
        const { data } = await supabase
          .from('exam_results')
          .select(`*, exams(title)`)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          const completedExams = data.filter((e) => e.status === 'completed' || !e.status);
          const passedCount = completedExams.filter((e) => e.passed).length;
          const totalScore = completedExams.reduce(
            (acc, curr) => acc + (Number(curr.score) || 0),
            0
          );
          setStats({
            totalAttempted: data.length,
            passed: passedCount,
            failed: completedExams.length - passedCount,
            averageScore:
              completedExams.length > 0 ? Math.round(totalScore / completedExams.length) : 0,
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
      <View className="z-10 flex-row items-center border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <TouchableOpacity
          onPress={() =>
            navigation.canGoBack() ? navigation.goBack() : navigation.replace('Dashboard')
          }
          className="-ml-2 p-2">
          <ChevronLeft size={24} color="#334155" />
        </TouchableOpacity>
        <Text className="ml-2 text-xl font-bold text-slate-800">My Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <View className="relative mb-6 items-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <TouchableOpacity
            onPress={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
            className="absolute right-4 top-4 rounded-full border border-slate-200 bg-slate-50 p-2">
            {isEditing ? (
              <View className="mt-2 w-full space-y-3">
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First Name"
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-800"
                />
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last Name"
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-800"
                />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Phone Number"
                  keyboardType="phone-pad"
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-800"
                />
              </View>
            ) : (
              <View className="items-center">
                <Text className="text-xl font-bold text-slate-800">
                  {firstName} {lastName}
                </Text>
                <Text className="mt-1 text-sm font-medium text-slate-500">
                  {session?.user?.email}
                </Text>
                {session?.user?.user_metadata?.phone && (
                  <Text className="mt-1 text-xs text-slate-400">
                    {session?.user?.user_metadata?.phone}
                  </Text>
                )}
              </View>
            )}{' '}
          </TouchableOpacity>

          <View className="mb-4 rounded-full border border-blue-100 bg-blue-50 p-4">
            <User size={40} color="#3b82f6" />
          </View>

          {isEditing ? (
            <View className="mt-2 w-full space-y-3">
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First Name"
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center font-bold text-slate-800"
              />
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last Name"
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center font-bold text-slate-800"
              />
            </View>
          ) : (
            <Text className="text-xl font-bold text-slate-800">
              {firstName} {lastName}
            </Text>
          )}
          <Text className="mt-1 text-sm font-medium text-slate-500">{session?.user?.email}</Text>
        </View>

        {/* ... (The rest of your Performance Metrics & History UI stays exactly the same) */}
      </ScrollView>
    </SafeAreaView>
  );
}
