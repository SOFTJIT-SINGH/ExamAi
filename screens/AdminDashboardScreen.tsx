import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Users, 
  FileText, 
  PlusCircle, 
  LogOut, 
  Trash2, 
  Search,
  LayoutDashboard,
  ShieldCheck,
  ChevronRight
} from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { supabase } from '../utils/supabase';
import { useAuthStore } from '../store/useAuthStore';

type AdminDashboardProps = { navigation: NativeStackNavigationProp<RootStackParamList, 'AdminDashboard'> };

export default function AdminDashboardScreen({ navigation }: AdminDashboardProps) {
  const [students, setStudents] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalStudents: 0, totalExams: 0, totalQuestions: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'students'>('overview');

  const { userProfile, signOut } = useAuthStore();
  const adminName = userProfile?.first_name || 'Admin';

  const fetchData = async () => {
    setLoading(true);
    console.log('--- Admin Dashboard: Fetching Data ---');
    try {
      // Fetch stats
      const { count: studentCount, error: sErr } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'student');
      
      if (sErr) console.error('Student Count Error:', sErr);
      console.log('Fetched Student Count:', studentCount);

      const { count: examCount, error: eErr } = await supabase.from('exams').select('id', { count: 'exact', head: true });
      if (eErr) console.error('Exam Count Error:', eErr);

      const { count: questionCount, error: qErr } = await supabase.from('questions').select('id', { count: 'exact', head: true });
      if (qErr) console.error('Question Count Error:', qErr);

      setStats({
        totalStudents: studentCount || 0,
        totalExams: examCount || 0,
        totalQuestions: questionCount || 0
      });

      // Fetch students if on students tab
      if (activeTab === 'students') {
        const { data: studentsData, error: listErr } = await supabase
          .from('profiles')
          .select('*, exam_results(score, status)')
          .eq('role', 'student')
          .order('first_name');
        
        if (listErr) console.error('Student List Fetch Error:', listErr);
        
        // Calculate average scores for each student
        const studentsWithScores = (studentsData || []).map(student => {
          const results = student.exam_results || [];
          const completedResults = results.filter((r: any) => r.status === 'completed');
          const avgScore = completedResults.length > 0 
            ? Math.round(completedResults.reduce((acc: number, r: any) => acc + r.score, 0) / completedResults.length)
            : 0;
          
          return {
            ...student,
            avgScore,
            totalExams: completedResults.length
          };
        });

        console.log('Processed Students with Scores:', studentsWithScores.length);
        setStudents(studentsWithScores);
      }
    } catch (error: any) {
      console.error('Admin Dashboard Catch Error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [activeTab])
  );

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const removeStudent = (id: string, name: string) => {
    Alert.alert(
      'Remove Student',
      `Are you sure you want to remove ${name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive', 
          onPress: async () => {
            // Note: In Supabase, you might want to delete from auth.users too, 
            // but usually you delete from profiles and let a trigger/webhook handle the rest or just disable them.
            // Here we just delete the profile for simplicity as requested.
            const { error } = await supabase.from('profiles').delete().eq('id', id);
            if (error) {
              Alert.alert('Error', error.message);
            } else {
              setStudents(students.filter(s => s.id !== id));
              setStats(prev => ({ ...prev, totalStudents: prev.totalStudents - 1 }));
              Alert.alert('Success', 'Student removed successfully.');
            }
          } 
        },
      ]
    );
  };

  const renderOverview = () => (
    <ScrollView contentContainerStyle={{ padding: 24 }}>
      <View className="flex-row flex-wrap justify-between">
        <TouchableOpacity 
          onPress={() => setActiveTab('students')}
          activeOpacity={0.7}
          className="w-[48%] mb-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm"
        >
          <View className="bg-blue-50 w-10 h-10 rounded-xl items-center justify-center mb-3">
            <Users size={20} color="#3b82f6" />
          </View>
          <Text className="text-2xl font-extrabold text-slate-800">{stats.totalStudents}</Text>
          <Text className="text-slate-500 font-medium text-xs uppercase tracking-wider">Students</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => Alert.alert('Assessments', 'You are managing all published exams.')}
          activeOpacity={0.7}
          className="w-[48%] mb-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm"
        >
          <View className="bg-indigo-50 w-10 h-10 rounded-xl items-center justify-center mb-3">
            <FileText size={20} color="#6366f1" />
          </View>
          <Text className="text-2xl font-extrabold text-slate-800">{stats.totalExams}</Text>
          <Text className="text-slate-500 font-medium text-xs uppercase tracking-wider">Assessments</Text>
        </TouchableOpacity>

        <View className="w-full mb-6 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-slate-500 font-medium text-xs uppercase tracking-wider">Question Bank</Text>
              <Text className="text-3xl font-extrabold text-slate-800 mt-1">{stats.totalQuestions}</Text>
            </View>
            <View className="bg-green-50 w-12 h-12 rounded-2xl items-center justify-center">
              <PlusCircle size={28} color="#10b981" />
            </View>
          </View>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Contribute')}
            className="bg-slate-900 py-4 rounded-2xl items-center justify-center flex-row"
          >
            <Text className="text-white font-bold mr-2">Manage Questions</Text>
            <ChevronRight size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <Text className="text-lg font-bold text-slate-800 mb-4">Quick Actions</Text>
      
      <TouchableOpacity 
        onPress={() => setActiveTab('students')}
        className="bg-white border border-slate-200 p-5 rounded-2xl flex-row items-center mb-3"
      >
        <View className="bg-slate-100 p-3 rounded-xl mr-4">
          <Users size={20} color="#475569" />
        </View>
        <View className="flex-1">
          <Text className="font-bold text-slate-800 text-base">Manage Students</Text>
          <Text className="text-slate-500 text-xs">View, edit or remove student accounts</Text>
        </View>
        <ChevronRight size={20} color="#cbd5e1" />
      </TouchableOpacity>

      <TouchableOpacity 
        className="bg-white border border-slate-200 p-5 rounded-2xl flex-row items-center mb-3"
        onPress={() => Alert.alert('Coming Soon', 'Category management is being refined.')}
      >
        <View className="bg-slate-100 p-3 rounded-xl mr-4">
          <Search size={20} color="#475569" />
        </View>
        <View className="flex-1">
          <Text className="font-bold text-slate-800 text-base">Manage Categories</Text>
          <Text className="text-slate-500 text-xs">Organize exams by subjects</Text>
        </View>
        <ChevronRight size={20} color="#cbd5e1" />
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStudents = () => (
    <View className="flex-1">
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : students.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Users size={48} color="#cbd5e1" />
          <Text className="mt-4 text-center text-lg font-bold text-slate-400">
            No students found.
          </Text>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24 }}
          renderItem={({ item }) => (
            <View className="bg-white border border-slate-200 p-5 rounded-3xl mb-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center flex-1">
                  <View className="bg-slate-100 w-14 h-14 rounded-full items-center justify-center mr-4">
                    <Text className="text-slate-600 font-bold text-xl">
                      {item.first_name?.[0]}{item.last_name?.[0] || item.first_name?.[1]}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-slate-800 text-lg" numberOfLines={1}>
                      {item.first_name} {item.last_name}
                    </Text>
                    <Text className="text-slate-400 text-xs font-medium" numberOfLines={1}>
                      {item.email || 'No email associated'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => removeStudent(item.id, `${item.first_name} ${item.last_name}`)}
                  className="p-3 bg-red-50 rounded-2xl"
                >
                  <Trash2 size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center justify-between bg-slate-50 p-4 rounded-2xl">
                <View>
                  <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Performance</Text>
                  <View className="flex-row items-baseline">
                    <Text className={`text-xl font-black ${item.avgScore >= 60 ? 'text-green-600' : item.avgScore > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                      {item.avgScore}%
                    </Text>
                    <Text className="text-slate-400 text-xs ml-1 font-bold italic">Avg. Score</Text>
                  </View>
                </View>
                
                <View className="h-8 w-[1px] bg-slate-200" />

                <View className="items-end">
                  <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Activities</Text>
                  <Text className="text-slate-700 font-bold">{item.totalExams} Exams Taken</Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white px-6 py-6 border-b border-slate-200 shadow-sm flex-row items-center justify-between">
        <View>
          <View className="flex-row items-center">
            <ShieldCheck size={20} color="#3b82f6" />
            <Text className="ml-2 text-xs font-bold text-blue-600 uppercase tracking-widest">Admin Portal</Text>
          </View>
          <Text className="text-2xl font-bold text-slate-800 mt-1">Hello, {adminName}</Text>
        </View>
        <TouchableOpacity 
          onPress={handleLogout}
          className="bg-slate-100 p-3 rounded-full"
        >
          <LogOut size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-slate-100">
        <TouchableOpacity 
          onPress={() => setActiveTab('overview')}
          className={`flex-1 py-4 items-center border-b-2 ${activeTab === 'overview' ? 'border-blue-600' : 'border-transparent'}`}
        >
          <View className="flex-row items-center">
            <LayoutDashboard size={18} color={activeTab === 'overview' ? "#2563eb" : "#64748b"} />
            <Text className={`ml-2 font-bold ${activeTab === 'overview' ? 'text-blue-600' : 'text-slate-500'}`}>Overview</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('students')}
          className={`flex-1 py-4 items-center border-b-2 ${activeTab === 'students' ? 'border-blue-600' : 'border-transparent'}`}
        >
          <View className="flex-row items-center">
            <Users size={18} color={activeTab === 'students' ? "#2563eb" : "#64748b"} />
            <Text className={`ml-2 font-bold ${activeTab === 'students' ? 'text-blue-600' : 'text-slate-500'}`}>Students</Text>
          </View>
        </TouchableOpacity>
      </View>

      {activeTab === 'overview' ? renderOverview() : renderStudents()}
    </SafeAreaView>
  );
}
