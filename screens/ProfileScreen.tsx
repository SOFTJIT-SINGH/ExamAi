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
  const { session, updateUserProfile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalAttempted: 0, passed: 0, failed: 0, averageScore: 0 });
  const [history, setHistory] = useState<any[]>([]);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(session?.user?.user_metadata?.first_name || '');
  const [lastName, setLastName] = useState(session?.user?.user_metadata?.last_name || '');
  const [phone, setPhone] = useState(session?.user?.user_metadata?.phone || ''); // NEW PHONE STATE

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
    await updateUserProfile(firstName, lastName, phone); // NOW PASSES PHONE
  };

  const handleReviewClick = (result: any) => {
    if (result.status === 'completed' && result.answers) {
      navigation.navigate('Result', { examId: result.exam_id, reviewAnswers: result.answers });
    } else if (result.status === 'terminated') {
      Alert.alert('Access Denied', 'This exam was terminated due to academic dishonesty.');
    } else {
      Alert.alert('Unavailable', 'Only successfully completed modern exams can be reviewed.');
    }
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
            {isEditing ? <Check size={18} color="#10b981" /> : <Edit2 size={18} color="#64748b" />}
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
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Phone Number"
                keyboardType="phone-pad"
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center font-bold text-slate-800"
              />
            </View>
          ) : (
            <>
              <Text className="text-xl font-bold text-slate-800">
                {firstName} {lastName}
              </Text>
              <Text className="mt-1 text-sm font-medium text-slate-500">
                {session?.user?.email}
              </Text>
              {phone ? (
                <Text className="mt-1 text-xs font-medium text-slate-400">{phone}</Text>
              ) : null}
            </>
          )}
        </View>

        <Text className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
          Performance Metrics
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" className="my-8" />
        ) : (
          <>
            <View className="mb-6 flex-row justify-between">
              <View className="mr-2 flex-1 items-center rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <Target size={28} color="#3b82f6" className="mb-2" />
                <Text className="text-3xl font-bold text-slate-800">{stats.totalAttempted}</Text>
                <Text className="mt-1 text-xs font-semibold uppercase text-slate-500">
                  Total Exams
                </Text>
              </View>
              <View className="ml-2 flex-1 items-center rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <Award size={28} color="#10b981" className="mb-2" />
                <Text className="text-3xl font-bold text-slate-800">{stats.averageScore}%</Text>
                <Text className="mt-1 text-xs font-semibold uppercase text-slate-500">
                  Avg Score
                </Text>
              </View>
            </View>

            <Text className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
              Recent Exams
            </Text>
            {history.length === 0 ? (
              <Text className="rounded-xl border border-slate-200 bg-white p-4 py-4 text-center text-slate-500">
                No exams taken yet.
              </Text>
            ) : (
              history.map((result) => {
                const isCancelled = result.status === 'cancelled';
                const isTerminated = result.status === 'terminated';
                const leftBlank = result.total_questions - (result.attempted_questions || 0);

                return (
                  <TouchableOpacity
                    key={result.id}
                    activeOpacity={0.7}
                    onPress={() => handleReviewClick(result)}
                    className="mb-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <View className="mb-3 flex-row items-center justify-between">
                      <View className="flex-1 flex-row items-center">
                        <BookOpen size={16} color="#94a3b8" className="mr-2" />
                        <Text
                          className="flex-1 text-base font-bold text-slate-800"
                          numberOfLines={1}>
                          {result.exams?.title || 'Unknown Exam'}
                        </Text>
                      </View>
                      <View
                        className={`ml-2 rounded-md border px-2 py-1 ${
                          isCancelled
                            ? 'border-orange-200 bg-orange-100'
                            : isTerminated
                              ? 'border-red-300 bg-red-100'
                              : result.passed
                                ? 'border-green-200 bg-green-100'
                                : 'border-red-200 bg-red-50'
                        }`}>
                        <Text
                          className={`text-xs font-bold ${
                            isCancelled
                              ? 'text-orange-700'
                              : isTerminated
                                ? 'text-red-700'
                                : result.passed
                                  ? 'text-green-700'
                                  : 'text-red-600'
                          }`}>
                          {isTerminated
                            ? 'TERMINATED'
                            : isCancelled
                              ? 'CANCELLED'
                              : `${result.score}%`}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center justify-between border-t border-slate-100 pt-3">
                      <Text className="text-sm text-slate-500">
                        Answered:{' '}
                        <Text className="font-semibold text-slate-800">
                          {result.attempted_questions || 0}
                        </Text>{' '}
                        / {result.total_questions}
                      </Text>
                      <Text className="text-sm text-slate-500">
                        Blank:{' '}
                        <Text className="font-semibold text-red-500">
                          {leftBlank > 0 ? leftBlank : 0}
                        </Text>
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
