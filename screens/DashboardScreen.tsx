import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Modal, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, ChevronRight, LogOut, ShieldCheck, User, X } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { supabase } from '../utils/supabase';
import { useAuthStore } from '../store/useAuthStore';

type DashboardProps = { navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>; };

const CATEGORIES = ['All', 'Programming', 'Web Development', 'Designing', 'General'];

export default function DashboardScreen({ navigation }: DashboardProps) {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Preflight Modal State
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const { session, signOut } = useAuthStore();
  const firstName = session?.user?.user_metadata?.first_name || 'Student';

  useFocusEffect(
    useCallback(() => {
      const fetchExams = async () => {
        setLoading(true);
        
        // 1. Try to fetch exams WITH the question count
        const { data, error } = await supabase.from('exams').select('*, questions(count)').order('title');
        
        if (error) {
          console.error("Dashboard Fetch Error:", error);
          // If the relation fails, fallback to fetching JUST the exams
          const fallback = await supabase.from('exams').select('*').order('title');
          if (fallback.error) {
            Alert.alert("Database Error", fallback.error.message);
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

  const filteredExams = activeCategory === 'All' ? exams : exams.filter(e => e.category === activeCategory);

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
      <View className="px-6 py-6 border-b border-slate-200 bg-white flex-row justify-between items-center shadow-sm z-10">
        <View>
          <Text className="text-2xl font-bold text-slate-800 tracking-tight">Welcome, {firstName}</Text>
          <View className="flex-row items-center mt-1">
            <ShieldCheck size={14} color="#10b981" />
            <Text className="text-sm text-slate-500 ml-1 font-medium">Ready to Test</Text>
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

      {/* Category Filter Bar */}
      <View className="bg-white border-b border-slate-100 py-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat} 
              onPress={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full mr-3 border ${activeCategory === cat ? 'bg-blue-600 border-blue-600' : 'bg-slate-50 border-slate-200'}`}
            >
              <Text className={`font-bold ${activeCategory === cat ? 'text-white' : 'text-slate-500'}`}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#3b82f6" /></View>
      ) : filteredExams.length === 0 ? (
        <View className="flex-1 justify-center items-center px-8">
          <Text className="text-slate-400 text-lg font-bold mt-4 text-center">No exams found in this category.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredExams}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24 }}
          renderItem={({ item }) => {
            // Safe fallback if questions array is missing or empty
            const questionCount = item.questions?.[0]?.count || item.questions?.length || 'Multiple';
            return (
              <TouchableOpacity activeOpacity={0.8} onPress={() => openPreflight(item)} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-4">
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-row items-center flex-1">
                    <View className="bg-blue-50 p-3 rounded-xl border border-blue-100"><FileText size={24} color="#3b82f6" /></View>
                    <View className="ml-4 flex-1">
                      <Text className="text-lg font-bold text-slate-800">{item.title}</Text>
                      <Text className="text-xs font-medium text-slate-500 mt-1">{questionCount} Questions Available</Text>
                    </View>
                  </View>
                </View>
                <Text className="text-slate-600 text-sm mb-5 leading-relaxed">{item.description}</Text>
                <View className="bg-slate-50 border border-slate-200 py-3 rounded-xl flex-row justify-center items-center">
                  <Text className="text-slate-700 font-bold text-sm mr-2">Configure & Start</Text>
                  <ChevronRight size={16} color="#3b82f6" />
                </View>
              </TouchableOpacity>
            )
          }}
        />
      )}

      {/* Preflight Modal */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 pb-12 shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-xl font-bold text-slate-800">Exam Setup</Text>
                <Text className="text-slate-500 mt-1">{selectedExam?.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="p-2 bg-slate-100 rounded-full"><X size={20} color="#64748b" /></TouchableOpacity>
            </View>
            
            <Text className="font-bold text-slate-700 mb-3 uppercase tracking-wider text-xs">Select Question Limit</Text>
            <View className="flex-row flex-wrap justify-between">
              {[3, 5, 10].map(num => {
                const availableCount = selectedExam?.questions?.[0]?.count || selectedExam?.questions?.length || 999;
                const isAvailable = availableCount >= num;
                return (
                  <TouchableOpacity 
                    key={num} 
                    disabled={!isAvailable}
                    onPress={() => startExam(num)}
                    className={`w-[30%] py-4 rounded-xl border items-center mb-3 ${isAvailable ? 'bg-blue-50 border-blue-200' : 'bg-slate-100 border-slate-200 opacity-50'}`}
                  >
                    <Text className={`font-bold text-lg ${isAvailable ? 'text-blue-700' : 'text-slate-400'}`}>{num}</Text>
                    <Text className={`text-xs mt-1 ${isAvailable ? 'text-blue-500' : 'text-slate-400'}`}>Questions</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity onPress={() => startExam()} className="bg-slate-800 py-4 rounded-xl items-center mt-2 shadow-md">
              <Text className="text-white font-bold text-lg">Attempt Full Exam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}