import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, Circle, XCircle, LogOut } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useExamStore } from '../store/useExamStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

export default function ResultScreen({ navigation }: Props) {
  const { questions, answers } = useExamStore();

  let correctCount = 0;
  questions.forEach(q => { if (answers[q.id] === q.correct_option_index) correctCount++; });
  const finalScore = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  return (
    <SafeAreaView className="flex-1 bg-exam-bg">
      <View className="px-6 py-5 border-b border-exam-border bg-exam-card flex-row justify-between items-center mt-2">
        <Text className="text-xl font-bold text-exam-text tracking-widest uppercase">Post-Action Report</Text>
        <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4, borderWidth: 1, backgroundColor: finalScore >= 60 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderColor: finalScore >= 60 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)' }}>
          <Text style={{ fontFamily: 'monospace', fontWeight: 'bold', color: finalScore >= 60 ? '#4ade80' : '#f87171' }}>SCORE: {finalScore}%</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        {questions.map((q, index) => {
          const userAnswer = answers[q.id];
          const isCorrect = userAnswer === q.correct_option_index;

          return (
            <View key={`result-${q.id}-${index}`} className="bg-exam-card p-5 rounded-xl border border-exam-border mb-6">
              <Text className="text-exam-primary font-mono text-xs tracking-widest mb-2">NODE {index + 1}</Text>
              <Text className="text-exam-text text-base mb-4 leading-relaxed">{q.text}</Text>
              
              <View className="mb-4">
                {q.options.map((opt, optIdx) => {
                  const isUserChoice = userAnswer === optIdx;
                  const isActualCorrect = q.correct_option_index === optIdx;
                  
                  return (
                    <View key={`opt-${q.id}-${optIdx}`} style={{
                      padding: 12, borderRadius: 8, borderWidth: 1, flexDirection: 'row', alignItems: 'center', marginBottom: 8,
                      backgroundColor: isActualCorrect ? 'rgba(74, 222, 128, 0.1)' : (isUserChoice && !isCorrect) ? 'rgba(248, 113, 113, 0.1)' : '#0f172a',
                      borderColor: isActualCorrect ? 'rgba(74, 222, 128, 0.5)' : (isUserChoice && !isCorrect) ? 'rgba(248, 113, 113, 0.5)' : '#334155'
                    }}>
                      {isActualCorrect ? <CheckCircle2 size={16} color="#4ade80" style={{ marginRight: 12 }} /> : 
                       (isUserChoice && !isCorrect) ? <XCircle size={16} color="#f87171" style={{ marginRight: 12 }} /> : 
                       <Circle size={16} color="#3f3f46" style={{ marginRight: 12 }} />}
                      <Text style={{ flex: 1, color: isActualCorrect ? '#4ade80' : (isUserChoice && !isCorrect) ? '#f87171' : '#94a3b8', fontWeight: isActualCorrect ? 'bold' : 'normal' }}>
                        {opt}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {q.explanation ? (
                <View className="bg-exam-bg p-4 rounded-lg border border-exam-border/50">
                  <Text className="text-exam-muted text-sm leading-relaxed">
                    <Text className="text-exam-text font-bold uppercase text-xs tracking-widest">Analysis: </Text>
                    {q.explanation}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 p-6 bg-exam-bg border-t border-exam-border">
        <TouchableOpacity 
          onPress={() => navigation.replace('Dashboard')}
          className="bg-exam-primary px-8 py-4 rounded-xl shadow-lg w-full flex-row justify-center items-center"
        >
          <Text className="font-bold text-exam-bg text-lg tracking-widest uppercase mr-2">Close Report</Text>
          <LogOut size={20} color="#0f172a" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}