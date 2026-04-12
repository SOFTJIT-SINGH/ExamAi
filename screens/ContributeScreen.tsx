import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, HelpCircle, Save, ChevronLeft, PlusCircle, Trash2, Edit2, LayoutList, PenTool } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { supabase } from '../utils/supabase';
import { useAuthStore } from '../store/useAuthStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Contribute'>;

const CATEGORIES = ['Programming', 'Web Development', 'Designing', 'General'];

type QForm = {
  id?: string;
  text: string;
  options: string[];
  correctOption: number;
  explanation: string;
};

export default function ContributeScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  
  // Category & Exam Selection
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [availableExams, setAvailableExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  
  // Create Questions Array State
  const [questionsForm, setQuestionsForm] = useState<QForm[]>([
    { text: '', options: ['', '', '', ''], correctOption: 0, explanation: '' }
  ]);
  const [loading, setLoading] = useState(false);

  // Manage State
  const [existingQuestions, setExistingQuestions] = useState<any[]>([]);
  const [loadingManage, setLoadingManage] = useState(false);

  const { session } = useAuthStore();
  const currentUserId = session?.user?.id;

  // Fetch Exams when Category changes
  useEffect(() => {
    fetchExamsByCategory();
  }, [activeCategory]);

  const fetchExamsByCategory = async () => {
    const { data } = await supabase.from('exams').select('*').eq('category', activeCategory);
    if (data) {
      setAvailableExams(data);
      if (data.length > 0) setSelectedExamId(data[0].id);
      else setSelectedExamId('');
    }
  };

  // Fetch Questions for Management when Exam changes & on Manage Tab
  useEffect(() => {
    if (activeTab === 'manage' && selectedExamId) {
      fetchExistingQuestions();
    }
  }, [activeTab, selectedExamId]);

  const fetchExistingQuestions = async () => {
    setLoadingManage(true);
    // Assuming users can just manage questions for this exam
    const { data } = await supabase.from('questions').select('*').eq('exam_id', selectedExamId);
    if (data) setExistingQuestions(data);
    setLoadingManage(false);
  };

  const handleOptionChange = (qIndex: number, text: string, optIndex: number) => {
    const newForm = [...questionsForm];
    newForm[qIndex].options[optIndex] = text;
    setQuestionsForm(newForm);
  };

  const handleCorrectOptionChange = (qIndex: number, optIndex: number) => {
    const newForm = [...questionsForm];
    newForm[qIndex].correctOption = optIndex;
    setQuestionsForm(newForm);
  };

  const handleTextChange = (qIndex: number, field: 'text' | 'explanation', val: string) => {
    const newForm = [...questionsForm];
    newForm[qIndex][field] = val;
    setQuestionsForm(newForm);
  };

  const addQuestionForm = () => {
    setQuestionsForm([...questionsForm, { text: '', options: ['', '', '', ''], correctOption: 0, explanation: '' }]);
  };

  const removeQuestionForm = (index: number) => {
    if (questionsForm.length === 1) return; // Must have at least 1
    const newForm = [...questionsForm];
    newForm.splice(index, 1);
    setQuestionsForm(newForm);
  };

  const handleSave = async () => {
    if (!selectedExamId) return Alert.alert('Error', 'Please select an exam subject first.');
    
    // Validation
    for (let i = 0; i < questionsForm.length; i++) {
        const q = questionsForm[i];
        if (!q.text.trim()) return Alert.alert('Error', `Question ${i+1} text is required.`);
        if (q.options.some(opt => !opt.trim())) return Alert.alert('Error', `All 4 options must be filled for Question ${i+1}.`);
    }
    
    setLoading(true);
    
    const inserts = questionsForm.map(q => {
      const payload: any = {
        exam_id: selectedExamId,
        user_id: currentUserId,
        text: q.text,
        options: q.options,
        correct_option_index: q.correctOption,
        explanation: q.explanation || null,
      };
      if (q.id) payload.id = q.id;
      return payload;
    });

    const { error } = await supabase.from('questions').upsert(inserts);
    setLoading(false);

    if (error) {
      Alert.alert('Database Error', 'Failed to save questions: ' + error.message);
    } else {
      Alert.alert('Success', `${questionsForm.length} questions submitted successfully!`);
      // Reset form
      setQuestionsForm([{ text: '', options: ['', '', '', ''], correctOption: 0, explanation: '' }]);
    }
  };

  const deleteQuestion = async (id: string, authorId?: string) => {
    if (authorId !== currentUserId) {
        Alert.alert("Unauthorized", "You can only delete your posted questions.");
        return;
    }
    Alert.alert("Delete", "Are you sure you want to delete this question?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
         const { error } = await supabase.from('questions').delete().eq('id', id);
         if (!error) {
           fetchExistingQuestions();
           Alert.alert("Deleted", "Question removed successfully.");
         } else {
           Alert.alert("Error", error.message);
         }
      }}
    ])
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 relative">
      <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm z-10">
        <View className="flex-row items-center">
            <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 mr-3 bg-slate-100 rounded-full">
            <ChevronLeft size={24} color="#1e1b4b" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-slate-800">Contribute HQ</Text>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-slate-200">
        <TouchableOpacity 
          onPress={() => setActiveTab('create')}
          className={`flex-1 py-4 items-center border-b-2 ${activeTab === 'create' ? 'border-blue-600' : 'border-transparent'}`}
        >
          <View className="flex-row items-center">
             <PenTool size={18} color={activeTab === 'create' ? "#2563eb" : "#64748b"} />
             <Text className={`ml-2 font-bold ${activeTab === 'create' ? 'text-blue-600' : 'text-slate-500'}`}>Post Questions</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('manage')}
          className={`flex-1 py-4 items-center border-b-2 ${activeTab === 'manage' ? 'border-blue-600' : 'border-transparent'}`}
        >
          <View className="flex-row items-center">
             <LayoutList size={18} color={activeTab === 'manage' ? "#2563eb" : "#64748b"} />
             <Text className={`ml-2 font-bold ${activeTab === 'manage' ? 'text-blue-600' : 'text-slate-500'}`}>Manage</Text>
          </View>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
          
          {/* Universal Selection Bar for Both Tabs */}
          <View className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-6">
            <Text className="font-bold text-slate-700 mb-3 text-sm tracking-wider uppercase">1. Select Subject Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setActiveCategory(cat)}
                  className={`mr-3 rounded-full border px-4 py-2 ${activeCategory === cat ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300 bg-slate-50'}`}>
                  <Text className={`font-bold ${activeCategory === cat ? 'text-indigo-700' : 'text-slate-500'}`}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text className="font-bold text-slate-700 mb-3 text-sm tracking-wider uppercase">2. Select Target Assessment</Text>
            {availableExams.length === 0 ? (
               <Text className="text-slate-400 italic">No exams available in this category.</Text>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {availableExams.map((exam) => (
                    <TouchableOpacity
                    key={exam.id}
                    onPress={() => setSelectedExamId(exam.id)}
                    className={`mr-3 rounded-xl border px-4 py-3 ${selectedExamId === exam.id ? 'border-blue-500 bg-blue-500' : 'border-slate-200 bg-slate-100'}`}>
                    <Text className={`font-bold text-sm ${selectedExamId === exam.id ? 'text-white' : 'text-slate-600'}`}>{exam.title}</Text>
                    </TouchableOpacity>
                ))}
                </ScrollView>
            )}
            <Text className="text-xs text-slate-400 mt-3">* All modifications applies to the selected assessment.</Text>
          </View>

          {activeTab === 'create' && (
              <>
              {questionsForm.map((q, qIndex) => (
                <View key={`qform-${qIndex}`} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-6">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="font-bold text-blue-600 text-lg">Question {qIndex + 1}</Text>
                        {questionsForm.length > 1 && (
                            <TouchableOpacity onPress={() => removeQuestionForm(qIndex)}>
                                <Trash2 size={20} color="#ef4444" />
                            </TouchableOpacity>
                        )}
                    </View>

                    <Text className="font-bold text-slate-700 mb-2">Short Description / Question Text</Text>
                    <View className="border border-slate-300 rounded-xl px-4 py-3 bg-slate-50 mb-4 h-24">
                        <TextInput
                        value={q.text}
                        onChangeText={(t) => handleTextChange(qIndex, 'text', t)}
                        placeholder="What is the capital of..."
                        multiline
                        className="flex-1 text-slate-800"
                        textAlignVertical="top"
                        />
                    </View>

                    <Text className="font-bold text-slate-700 mb-2">Answers (Select Correct One)</Text>
                    {q.options.map((opt, idx) => (
                        <View key={`opt-${qIndex}-${idx}`} className="flex-row items-center mb-3">
                        <TouchableOpacity 
                            onPress={() => handleCorrectOptionChange(qIndex, idx)}
                            className={`w-8 h-8 rounded-full border-2 items-center justify-center mr-3 ${q.correctOption === idx ? 'border-green-500 bg-green-50' : 'border-slate-300 bg-slate-50'}`}
                        >
                            {q.correctOption === idx && <View className="w-4 h-4 rounded-full bg-green-500" />}
                        </TouchableOpacity>
                        <TextInput
                            value={opt}
                            onChangeText={(val) => handleOptionChange(qIndex, val, idx)}
                            placeholder={`Option ${idx + 1}`}
                            className="flex-1 border border-slate-300 rounded-xl px-4 h-12 bg-slate-50 text-slate-800"
                        />
                        </View>
                    ))}

                    <Text className="font-bold text-slate-700 mb-2 mt-2">Explanation for Correct Answer</Text>
                    <View className="border border-slate-300 rounded-xl px-4 py-3 bg-slate-50 h-20">
                        <TextInput
                        value={q.explanation}
                        onChangeText={(t) => handleTextChange(qIndex, 'explanation', t)}
                        placeholder="Keep it concise..."
                        multiline
                        className="flex-1 text-slate-800"
                        textAlignVertical="top"
                        />
                    </View>
                </View>
              ))}

              {/* PLUS BUTTON TO ADD MULTIPLE QUESTIONS */}
              <TouchableOpacity 
                onPress={addQuestionForm}
                className="mb-8 h-12 rounded-xl flex-row justify-center items-center bg-indigo-100 border border-indigo-200"
              >
                <PlusCircle size={20} color="#4338ca" style={{ marginRight: 8 }} />
                <Text className="text-indigo-700 font-bold text-sm">Add Another Question</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleSave} 
                disabled={loading || availableExams.length === 0}
                className={`h-14 rounded-xl flex-row justify-center items-center shadow-md ${loading || availableExams.length === 0 ? 'bg-slate-400' : 'bg-slate-800'}`}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Save size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text className="text-white font-bold text-lg">Save Questions</Text>
                  </>
                )}
              </TouchableOpacity>
              </>
          )}

          {activeTab === 'manage' && (
              <View>
                  {loadingManage ? (
                      <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 20 }} />
                  ) : existingQuestions.length === 0 ? (
                      <Text className="text-center text-slate-400 mt-10 text-lg font-medium">No questions found for this exam.</Text>
                  ) : (
                      existingQuestions.map((eq, idx) => (
                          <View key={`eq-${eq.id}`} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-4">
                              <Text className="text-slate-400 font-bold text-xs mb-2 uppercase">Q {idx + 1}</Text>
                              <Text className="text-slate-800 font-bold text-base mb-3">{eq.text}</Text>
                              <View className="bg-slate-50 p-3 rounded-lg mb-4 border border-slate-100">
                                  {eq.options.map((o: string, i: number) => (
                                      <Text key={i} className={`text-sm mb-1 ${eq.correct_option_index === i ? 'text-green-600 font-bold' : 'text-slate-500'}`}>
                                          • {o}
                                      </Text>
                                  ))}
                              </View>
                              <View className="flex-row justify-end space-x-3">
                                  <TouchableOpacity onPress={() => {
                                      if (eq.user_id !== currentUserId) {
                                          Alert.alert("Unauthorized", "You can only edit your posted questions.");
                                      } else {
                                          setQuestionsForm([{
                                              id: eq.id,
                                              text: eq.text,
                                              options: [...eq.options],
                                              correctOption: eq.correct_option_index,
                                              explanation: eq.explanation || ''
                                          }]);
                                          setActiveTab('create');
                                      }
                                  }} className="flex-row items-center border border-slate-200 px-3 py-2 rounded-lg bg-slate-50">
                                      <Edit2 size={16} color="#64748b" />
                                      <Text className="text-slate-600 font-bold text-xs ml-2">Edit</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity onPress={() => deleteQuestion(eq.id, eq.user_id)} className="flex-row items-center border border-red-200 px-3 py-2 rounded-lg bg-red-50">
                                      <Trash2 size={16} color="#ef4444" />
                                      <Text className="text-red-600 font-bold text-xs ml-2">Delete</Text>
                                  </TouchableOpacity>
                              </View>
                          </View>
                      ))
                  )}
              </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
