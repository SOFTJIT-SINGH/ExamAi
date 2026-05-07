import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, ChevronRight, LogOut, ShieldCheck, User, X, PlusCircle, LayoutDashboard } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { supabase } from '../utils/supabase';
import { useAuthStore } from '../store/useAuthStore';

type DashboardProps = { navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'> };

const CATEGORIES = ['All', 'Programming', 'Web Development', 'Designing', 'General'];

export default function DashboardScreen({ navigation }: DashboardProps) {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  // Preflight Modal State
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { session, userProfile, signOut } = useAuthStore();
  const firstName = userProfile?.first_name || 'Student';

  useFocusEffect(
    useCallback(() => {
      const fetchExams = async () => {
        setLoading(true);

        // 1. Try to fetch exams WITH the question count
        const { data, error } = await supabase
          .from('exams')
          .select('*, questions(count)')
          .order('title');

        if (error) {
          console.error('Dashboard Fetch Error:', error);
          // If the relation fails, fallback to fetching JUST the exams
          const fallback = await supabase.from('exams').select('*').order('title');
          if (fallback.error) {
            Alert.alert('Database Error', fallback.error.message);
          } else if (fallback.data) {
            setExams(fallback.data);
          }
        } else if (data) {
          setExams(data);
        }

        setLoading(false);
      };
      fetchExams();
    }, [])
  );

  const filteredExams =
    activeCategory === 'All' ? exams : exams.filter((e) => e.category === activeCategory);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const openPreflight = (exam: any) => {
    setSelectedExam(exam);
    setModalVisible(true);
  };

  const startExam = (limit?: number) => {
    setModalVisible(false);
    navigation.replace('ActiveExam', { examId: selectedExam.id, limit });
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="z-10 flex-row items-center justify-between border-b border-slate-200 bg-white px-6 py-6 shadow-sm">
        <View>
          <Text className="text-2xl font-bold tracking-tight text-slate-800">
            Welcome, {firstName}
          </Text>
          <View className="mt-1 flex-row items-center">
            <ShieldCheck size={14} color="#10b981" />
            <Text className="ml-1 text-sm font-medium text-slate-500">Ready to Test</Text>
          </View>
        </View>
        <View className="flex-row items-center space-x-3">
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            className="mr-2 rounded-full border border-blue-100 bg-blue-50 p-2">
            <User size={22} color="#3b82f6" />
          </TouchableOpacity>
          {userProfile?.role === 'admin' && (
            <TouchableOpacity
              onPress={() => navigation.navigate('AdminDashboard')}
              className="mr-2 rounded-full border border-indigo-100 bg-indigo-50 p-2">
              <LayoutDashboard size={22} color="#4f46e5" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleLogout}
            className="rounded-full border border-slate-200 bg-slate-100 p-2">
            <LogOut size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Filter Bar */}
      <View className="border-b border-slate-100 bg-white py-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              className={`mr-3 rounded-full border px-4 py-2 ${activeCategory === cat ? 'border-blue-600 bg-blue-600' : 'border-slate-200 bg-slate-50'}`}>
              <Text
                className={`font-bold ${activeCategory === cat ? 'text-white' : 'text-slate-500'}`}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : filteredExams.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mt-4 text-center text-lg font-bold text-slate-400">
            No exams found in this category.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredExams}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24 }}
          renderItem={({ item }) => {
            // Safe fallback if questions array is missing or empty
            const questionCount =
              item.questions?.[0]?.count || item.questions?.length || 'Multiple';
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => openPreflight(item)}
                className="mb-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <View className="mb-3 flex-row items-start justify-between">
                  <View className="flex-1 flex-row items-center">
                    <View className="rounded-xl border border-blue-100 bg-blue-50 p-3">
                      <FileText size={24} color="#3b82f6" />
                    </View>
                    <View className="ml-4 flex-1">
                      <Text className="text-lg font-bold text-slate-800">{item.title}</Text>
                      <Text className="mt-1 text-xs font-medium text-slate-500">
                        {questionCount} Questions Available
                      </Text>
                    </View>
                  </View>
                </View>
                <Text className="mb-5 text-sm leading-relaxed text-slate-600">
                  {item.description}
                </Text>
                <View className="flex-row items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-3">
                  <Text className="mr-2 text-sm font-bold text-slate-700">Configure & Start</Text>
                  <ChevronRight size={16} color="#3b82f6" />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Preflight Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-6 pb-12 shadow-2xl">
            <View className="mb-6 flex-row items-center justify-between">
              <View>
                <Text className="text-xl font-bold text-slate-800">Exam Setup</Text>
                <Text className="mt-1 text-slate-500">{selectedExam?.title}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="rounded-full bg-slate-100 p-2">
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-700">
              Select Question Limit
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {(() => {
                const availableCount = selectedExam?.questions?.[0]?.count || selectedExam?.questions?.length || null;
                const totalQs = availableCount || 999;
                
                // Show standard options that are strictly LESS than the total to avoid duplicates
                const validPresets = [3, 5, 10, 15, 20, 25, 30, 50].filter(n => n < totalQs);

                return (
                  <>
                    {validPresets.map((num) => (
                      <TouchableOpacity
                        key={`preset-${num}`}
                        onPress={() => startExam(num)}
                        className="w-[23%] items-center rounded-xl border border-blue-200 bg-blue-50 py-3">
                        <Text className="text-base font-bold text-blue-700">{num}</Text>
                        <Text className="mt-1 text-[10px] uppercase tracking-wider text-blue-500">Q's</Text>
                      </TouchableOpacity>
                    ))}

                    <TouchableOpacity
                      onPress={() => startExam()}
                      className="flex-1 min-w-[30%] items-center justify-center rounded-xl border-2 border-indigo-500 bg-indigo-50 py-3 shadow-sm">
                      <Text className="text-base font-extrabold text-indigo-700">All Questions</Text>
                      <Text className="mt-1 text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                        {availableCount ? `${availableCount} Q's` : 'Max'}
                      </Text>
                    </TouchableOpacity>
                  </>
                );
              })()}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
