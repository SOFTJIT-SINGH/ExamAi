import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId]);

  if (isLoading || questions.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 font-medium text-slate-500">Loading Assessment Data...</Text>
      </SafeAreaView>
    );
  }

  let correctCount = 0;
  questions.forEach((q) => {
    if (activeAnswers[q.id] === q.correct_option_index) correctCount++;
  });
  const finalScore = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="z-10 flex-row items-center justify-between border-b border-slate-200 bg-white px-6 py-5 shadow-sm">
        <Text className="text-xl font-bold text-slate-800">
          {reviewAnswers ? 'Study Mode' : 'Exam Results'}
        </Text>
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: finalScore >= 60 ? '#dcfce7' : '#fee2e2',
          }}>
          <Text style={{ fontWeight: 'bold', color: finalScore >= 60 ? '#166534' : '#991b1b' }}>
            Score: {finalScore}%
          </Text>
        </View>
      </View>

      <FlatList
        data={questions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        initialNumToRender={5}
        windowSize={5}
        renderItem={({ item: q, index }) => {
          const userAnswer = activeAnswers[q.id];
          const isCorrect = userAnswer === q.correct_option_index;

          return (
            <View
              key={`result-${q.id}-${index}`}
              className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Question {index + 1}
              </Text>
              <Text className="mb-5 text-lg font-bold leading-relaxed text-slate-800">
                {q.question_text}
              </Text>

              <View className="mb-4">
                {q.options.map((opt, optIdx) => {
                  const isUserChoice = userAnswer === optIdx;
                  const isActualCorrect = q.correct_option_index === optIdx;

                  return (
                    <View
                      key={`opt-${q.id}-${optIdx}`}
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        borderWidth: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 10,
                        backgroundColor: isActualCorrect
                          ? '#f0fdf4'
                          : isUserChoice && !isCorrect
                            ? '#fef2f2'
                            : '#f8fafc',
                        borderColor: isActualCorrect
                          ? '#86efac'
                          : isUserChoice && !isCorrect
                            ? '#fca5a5'
                            : '#e2e8f0',
                      }}>
                      {isActualCorrect ? (
                        <CheckCircle2 size={20} color="#16a34a" style={{ marginRight: 16 }} />
                      ) : isUserChoice && !isCorrect ? (
                        <XCircle size={20} color="#dc2626" style={{ marginRight: 16 }} />
                      ) : (
                        <Circle size={20} color="#94a3b8" style={{ marginRight: 16 }} />
                      )}
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 15,
                          color: isActualCorrect
                            ? '#166534'
                            : isUserChoice && !isCorrect
                              ? '#991b1b'
                              : '#64748b',
                          fontWeight: isActualCorrect || isUserChoice ? 'bold' : 'normal',
                        }}>
                        {opt}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {q.explanation ? (
                <View className="mt-2 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <Text className="text-sm leading-relaxed text-slate-700">
                    <Text className="text-xs font-bold uppercase tracking-wider text-blue-700">
                      Explanation:{' '}
                    </Text>
                    {q.explanation}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        }}
      />

      <View className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-6">
        <TouchableOpacity
          onPress={() => navigation.replace('Dashboard')}
          className="w-full flex-row items-center justify-center rounded-xl bg-slate-800 px-8 py-4 shadow-md">
          <Text className="mr-2 text-lg font-bold text-white">Return to Dashboard</Text>
          <LogOut size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
