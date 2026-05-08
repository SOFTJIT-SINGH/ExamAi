import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Users, 
  LogOut, 
  Trash2, 
  LayoutDashboard,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  List,
  Search,
  FileText,
  PlusCircle,
  Award,
  Clock
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
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'assessments' | 'categories'>('overview');
  const [exams, setExams] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  
  // New Exam Modal State
  const [showExamModal, setShowExamModal] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamDesc, setNewExamDesc] = useState('');
  const [newExamCategory, setNewExamCategory] = useState('');
  const [isCreatingExam, setIsCreatingExam] = useState(false);

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

      const { count: examCount } = await supabase.from('exams').select('id', { count: 'exact', head: true });
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
          .select('*, exam_results(id, exam_id, score, status, created_at)')
          .eq('role', 'student')
          .order('first_name');
        
        if (listErr) console.error('Student List Fetch Error:', listErr);

        // Collect all unique exam_ids to fetch their titles
        const allExamIds = new Set<string>();
        (studentsData || []).forEach((s: any) => {
          (s.exam_results || []).forEach((r: any) => { if (r.exam_id) allExamIds.add(r.exam_id); });
        });

        let examTitleMap: Record<string, string> = {};
        if (allExamIds.size > 0) {
          const { data: examsLookup } = await supabase
            .from('exams')
            .select('id, title')
            .in('id', Array.from(allExamIds));
          (examsLookup || []).forEach((e: any) => { examTitleMap[e.id] = e.title; });
        }
        
        // Calculate average scores and attach detailed results for each student
        const studentsWithScores = (studentsData || []).map(student => {
          const results = student.exam_results || [];
          const completedResults = results.filter((r: any) => r.status === 'completed');
          const avgScore = completedResults.length > 0 
            ? Math.round(completedResults.reduce((acc: number, r: any) => acc + r.score, 0) / completedResults.length)
            : 0;

          // Attach exam title to each result
          const detailedResults = results
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map((r: any) => ({
              ...r,
              examTitle: examTitleMap[r.exam_id] || 'Unknown Exam',
            }));
          
          return {
            ...student,
            avgScore,
            totalExams: completedResults.length,
            detailedResults,
          };
        });

        console.log('Processed Students with Scores:', studentsWithScores.length);
        setStudents(studentsWithScores);
      }

      // Fetch exams if on assessments tab
      if (activeTab === 'assessments') {
        const { data: examsData } = await supabase.from('exams').select('*, questions(count)').order('created_at', { ascending: false });
        setExams(examsData || []);
      }

      // Fetch categories if on categories tab
      if (activeTab === 'categories') {
        const { data: catData } = await supabase.from('categories').select('*').order('name');
        setCategories(catData || []);
      }
    } catch (error: any) {
      console.error('Admin Dashboard Catch Error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
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

  const removeStudent = async (id: string, name: string) => {
    Alert.alert('Delete Student', `Are you sure you want to remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: async () => {
          const { error } = await supabase.from('profiles').delete().eq('id', id);
          if (error) {
            Alert.alert('Error', error.message);
          } else {
            setStudents(students.filter(s => s.id !== id));
            setStats(prev => ({ ...prev, totalStudents: prev.totalStudents - 1 }));
          }
        } 
      }
    ]);
  };

  const removeExam = (id: string, title: string) => {
    Alert.alert('Remove Assessment', `Are you sure you want to delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const { error } = await supabase.from('exams').delete().eq('id', id);
        if (error) Alert.alert('Error', error.message);
        else setExams(exams.filter(e => e.id !== id));
      }}
    ]);
  };

  const removeCategory = (id: string, name: string) => {
    Alert.alert('Remove Category', `Delete category "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) Alert.alert('Error', error.message);
        else setCategories(categories.filter(c => c.id !== id));
      }}
    ]);
  };
  const addCategory = async () => {
    if (!newCategory.trim()) return;
    setIsAdding(true);
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name: newCategory.trim() }])
      .select();
    
    if (error) {
      Alert.alert('Error', error.message);
    } else if (data) {
      setCategories([...categories, data[0]]);
      setNewCategory('');
    }
    setIsAdding(false);
  };
  const createExam = async () => {
    if (!newExamTitle.trim() || !newExamCategory) {
      Alert.alert('Error', 'Title and Category are required.');
      return;
    }
    setIsCreatingExam(true);
    const { data, error } = await supabase
      .from('exams')
      .insert([{ 
        title: newExamTitle.trim(), 
        description: newExamDesc.trim(), 
        category: newExamCategory 
      }])
      .select();
    
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setStats(prev => ({ ...prev, totalExams: prev.totalExams + 1 }));
      setShowExamModal(false);
      setNewExamTitle('');
      setNewExamDesc('');
      Alert.alert('Success', 'Assessment created! Now go to Question Bank to add questions.');
      // Refresh exams if on that tab
      if (activeTab === 'assessments') {
        const { data: examsData } = await supabase.from('exams').select('*, questions(count)').order('created_at', { ascending: false });
        setExams(examsData || []);
      }
    }
    setIsCreatingExam(false);
  };

  const renderOverview = () => (
    <ScrollView 
      contentContainerStyle={{ padding: 24 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
      }
    >
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
          onPress={() => setActiveTab('assessments')}
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
              <TouchableOpacity onPress={() => navigation.navigate('Contribute')}>
                <PlusCircle size={28} color="#10b981" />
              </TouchableOpacity>
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
        onPress={() => {
          if (categories.length === 0) {
            Alert.alert('No Categories', 'Please create a category first.');
          } else {
            setNewExamCategory(categories[0].name);
            setShowExamModal(true);
          }
        }}
        className="bg-indigo-600 border border-indigo-700 p-5 rounded-2xl flex-row items-center mb-3"
      >
        <View className="bg-indigo-500 p-3 rounded-xl mr-4">
          <PlusCircle size={20} color="#fff" />
        </View>
        <View className="flex-1">
          <Text className="font-bold text-white text-base">Create New Assessment</Text>
          <Text className="text-indigo-100 text-xs">Add a new exam to a category</Text>
        </View>
        <ChevronRight size={20} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => setActiveTab('categories')}
        className="bg-white border border-slate-200 p-5 rounded-2xl flex-row items-center mb-3"
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

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return ''; }
  };

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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
          }
          renderItem={({ item }) => {
            const isExpanded = expandedStudent === item.id;
            return (
              <View className="bg-white border border-slate-200 rounded-3xl mb-4 shadow-sm overflow-hidden">
                {/* Student Header */}
                <View className="p-5">
                  <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center flex-1">
                      <View className="bg-slate-100 w-14 h-14 rounded-full items-center justify-center mr-4 overflow-hidden border border-slate-200">
                        {item.avatar_url ? (
                          <Image source={{ uri: item.avatar_url }} className="h-full w-full" />
                        ) : (
                          <Text className="text-slate-600 font-bold text-xl">
                            {item.first_name?.[0]}{item.last_name?.[0] || item.first_name?.[1]}
                          </Text>
                        )}
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

                {/* Expand/Collapse Button */}
                {item.detailedResults && item.detailedResults.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setExpandedStudent(isExpanded ? null : item.id)}
                    className={`flex-row items-center justify-center py-3 border-t border-slate-100 ${isExpanded ? 'bg-blue-50' : 'bg-slate-50'}`}
                  >
                    <Award size={14} color={isExpanded ? '#3b82f6' : '#94a3b8'} />
                    <Text className={`ml-2 text-xs font-bold ${isExpanded ? 'text-blue-600' : 'text-slate-400'}`}>
                      {isExpanded ? 'Hide Test Details' : `View ${item.detailedResults.length} Test Results`}
                    </Text>
                    {isExpanded ? <ChevronUp size={14} color="#3b82f6" style={{ marginLeft: 4 }} /> : <ChevronDown size={14} color="#94a3b8" style={{ marginLeft: 4 }} />}
                  </TouchableOpacity>
                )}

                {/* Expanded Test Results */}
                {isExpanded && item.detailedResults && (
                  <View className="px-5 pb-5 bg-slate-50">
                    {item.detailedResults.map((result: any, idx: number) => {
                      const statusColor = result.status === 'completed'
                        ? (result.score >= 60 ? '#16a34a' : '#f59e0b')
                        : result.status === 'terminated' ? '#ef4444' : '#94a3b8';
                      const statusBg = result.status === 'completed'
                        ? (result.score >= 60 ? '#f0fdf4' : '#fffbeb')
                        : result.status === 'terminated' ? '#fef2f2' : '#f8fafc';
                      const statusLabel = result.status === 'completed' ? 'Completed'
                        : result.status === 'terminated' ? 'Terminated' : 'Cancelled';

                      return (
                        <View
                          key={result.id || idx}
                          className="bg-white border border-slate-200 rounded-2xl p-4 mt-3"
                        >
                          <View className="flex-row items-center justify-between">
                            <View className="flex-1 mr-3">
                              <Text className="font-bold text-slate-800 text-sm" numberOfLines={1}>
                                {result.examTitle}
                              </Text>
                              <View className="flex-row items-center mt-1">
                                <Clock size={11} color="#94a3b8" />
                                <Text className="text-slate-400 text-[11px] ml-1">
                                  {result.created_at ? formatDate(result.created_at) : 'N/A'}
                                </Text>
                              </View>
                            </View>
                            <View className="items-end">
                              <View style={{ backgroundColor: statusBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                                <Text style={{ color: statusColor, fontWeight: 'bold', fontSize: 16 }}>
                                  {result.score}%
                                </Text>
                              </View>
                              <Text style={{ color: statusColor, fontSize: 10, fontWeight: '600', marginTop: 2 }}>
                                {statusLabel}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          }}
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="bg-white border-b border-slate-100 max-h-16">
        <TouchableOpacity 
          onPress={() => setActiveTab('overview')}
          className={`px-6 py-4 items-center border-b-2 ${activeTab === 'overview' ? 'border-blue-600' : 'border-transparent'}`}
        >
          <Text className={`font-bold ${activeTab === 'overview' ? 'text-blue-600' : 'text-slate-500'}`}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('students')}
          className={`px-6 py-4 items-center border-b-2 ${activeTab === 'students' ? 'border-blue-600' : 'border-transparent'}`}
        >
          <Text className={`font-bold ${activeTab === 'students' ? 'text-blue-600' : 'text-slate-500'}`}>Students</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('assessments')}
          className={`px-6 py-4 items-center border-b-2 ${activeTab === 'assessments' ? 'border-blue-600' : 'border-transparent'}`}
        >
          <Text className={`font-bold ${activeTab === 'assessments' ? 'text-blue-600' : 'text-slate-500'}`}>Assessments</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('categories')}
          className={`px-6 py-4 items-center border-b-2 ${activeTab === 'categories' ? 'border-blue-600' : 'border-transparent'}`}
        >
          <Text className={`font-bold ${activeTab === 'categories' ? 'text-blue-600' : 'text-slate-500'}`}>Categories</Text>
        </TouchableOpacity>
      </ScrollView>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'students' && renderStudents()}
      {activeTab === 'assessments' && (
        <FlatList
          data={exams}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
          }
          renderItem={({ item }) => (
            <View className="bg-white border border-slate-200 p-4 rounded-2xl mb-3 flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-bold text-slate-800 text-base">{item.title}</Text>
                <Text className="text-slate-500 text-xs">{item.category} • {item.questions?.[0]?.count || 0} Qs</Text>
              </View>
              <TouchableOpacity onPress={() => removeExam(item.id, item.title)} className="p-2 bg-red-50 rounded-lg">
                <Trash2 size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
      {activeTab === 'categories' && (
        <View className="flex-1">
          <View className="px-6 pt-4">
            <View className="bg-white border border-slate-200 p-2 rounded-2xl flex-row items-center shadow-sm">
              <TextInput
                placeholder="New Category Name..."
                value={newCategory}
                onChangeText={setNewCategory}
                className="flex-1 px-4 py-2 text-slate-800"
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity 
                onPress={addCategory}
                disabled={isAdding}
                className="bg-blue-600 w-12 h-12 rounded-xl items-center justify-center"
              >
                {isAdding ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <PlusCircle size={24} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 24 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3b82f6']} />
            }
            renderItem={({ item }) => (
              <View className="bg-white border border-slate-200 p-4 rounded-2xl mb-3 flex-row items-center justify-between">
                <Text className="font-bold text-slate-800 text-base">{item.name}</Text>
                <TouchableOpacity onPress={() => removeCategory(item.id, item.name)} className="p-2 bg-red-50 rounded-lg">
                  <Trash2 size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}
      {/* New Exam Modal */}
      <Modal visible={showExamModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 pb-12">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-slate-800">New Assessment</Text>
              <TouchableOpacity onPress={() => setShowExamModal(false)}>
                <Text className="text-blue-600 font-bold">Cancel</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-slate-500 mb-2 text-xs font-bold uppercase">Assessment Title</Text>
            <TextInput
              placeholder="e.g. History Mid-Term"
              value={newExamTitle}
              onChangeText={setNewExamTitle}
              className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4"
            />

            <Text className="text-slate-500 mb-2 text-xs font-bold uppercase">Description</Text>
            <TextInput
              placeholder="Short summary of the exam"
              value={newExamDesc}
              onChangeText={setNewExamDesc}
              multiline
              className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 h-24"
              textAlignVertical="top"
            />

            <Text className="text-slate-500 mb-2 text-xs font-bold uppercase">Select Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setNewExamCategory(cat.name)}
                  className={`mr-3 px-4 py-2 rounded-full border ${newExamCategory === cat.name ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200'}`}
                >
                  <Text className={newExamCategory === cat.name ? 'text-white font-bold' : 'text-slate-600'}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity 
              onPress={createExam}
              disabled={isCreatingExam}
              className="bg-blue-600 p-4 rounded-xl items-center"
            >
              {isCreatingExam ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Create Assessment</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
