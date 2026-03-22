import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, Circle, XCircle, LogOut } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useExamStore } from '../store/useExamStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export default function ResultScreen({ route, navigation }: Props) {
  const { examId, reviewAnswers } = route.params;
  const { questions, answers: liveAnswers, fetchExamData, isLoading } = useExamStore();
  
  // If we passed review answers in, use those. Otherwise use the live ones from the store.
  const activeAnswers = reviewAnswers || liveAnswers;

  // If we enter this screen directly from Profile, the store's questions might be empty.
  useEffect(() => {
    if (questions.length === 0 || questions[0]?.exam_id !== examId) {
      fetchExamData(examId);
    }
  }, [examId]);

  if (isLoading || questions.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 justify-center items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-slate-500 font-medium">Loading Assessment Data...</Text>
      </SafeAreaView>
    );
  }

  let correctCount = 0;
  questions.forEach(q => { if (activeAnswers[q.id] === q.correct_option_index) correctCount++; });
  const finalScore = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-6 py-5 border-b border-slate-200 bg-white flex-row justify-between items-center shadow-sm z-10">
        <Text className="text-xl font-bold text-slate-800">{reviewAnswers ? 'Study Mode' : 'Exam Results'}</Text>
        <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: finalScore >= 60 ? '#dcfce7' : '#fee2e2' }}>
          <Text style={{ fontWeight: 'bold', color: finalScore >= 60 ? '#166534' : '#991b1b' }}>Score: {finalScore}%</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }}>
        {questions.map((q, index) => {
          const userAnswer = activeAnswers[q.id];
          const isCorrect = userAnswer === q.correct_option_index;

          return (
            <View key={`result-${q.id}-${index}`} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
              <Text className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-2">Question {index + 1}</Text>
              <Text className="text-slate-800 text-lg font-bold mb-5 leading-relaxed">{q.text}</Text>
              
              <View className="mb-4">
                {q.options.map((opt, optIdx) => {
                  const isUserChoice = userAnswer === optIdx;
                  const isActualCorrect = q.correct_option_index === optIdx;
                  
                  return (
                    <View key={`opt-${q.id}-${optIdx}`} style={{
                      padding: 16, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', marginBottom: 10,
                      backgroundColor: isActualCorrect ? '#f0fdf4' : (isUserChoice && !isCorrect) ? '#fef2f2' : '#f8fafc',
                      borderColor: isActualCorrect ? '#86efac' : (isUserChoice && !isCorrect) ? '#fca5a5' : '#e2e8f0'
                    }}>
                      {isActualCorrect ? <CheckCircle2 size={20} color="#16a34a" style={{ marginRight: 16 }} /> : 
                       (isUserChoice && !isCorrect) ? <XCircle size={20} color="#dc2626" style={{ marginRight: 16 }} /> : 
                       <Circle size={20} color="#94a3b8" style={{ marginRight: 16 }} />}
                      <Text style={{ flex: 1, fontSize: 15, color: isActualCorrect ? '#166534' : (isUserChoice && !isCorrect) ? '#991b1b' : '#64748b', fontWeight: isActualCorrect || isUserChoice ? 'bold' : 'normal' }}>
                        {opt}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {q.explanation ? (
                <View className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-2">
                  <Text className="text-slate-700 text-sm leading-relaxed">
                    <Text className="text-blue-700 font-bold text-xs uppercase tracking-wider">Explanation: </Text>
                    {q.explanation}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-200">
        <TouchableOpacity 
          onPress={() => navigation.replace('Dashboard')}
          className="bg-slate-800 px-8 py-4 rounded-xl shadow-md w-full flex-row justify-center items-center"
        >
          <Text className="font-bold text-white text-lg mr-2">Return to Dashboard</Text>
          <LogOut size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}