import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert, AppState, AppStateStatus } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Clock, ChevronRight, ChevronLeft, CheckCircle2, Circle, ShieldAlert } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useExamStore } from '../store/useExamStore';
import { useProctoring } from '../hooks/useProctoring';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveExam'>;

export default function ActiveExamScreen({ route, navigation }: Props) {
  const { examId } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  
  const {
    questions, currentQuestionIndex, answers, timeRemaining, 
    isLoading, fetchExamData, selectAnswer,
    nextQuestion, previousQuestion, submitExam, tick, logViolation
  } = useExamStore();

  const currentQuestion = questions[currentQuestionIndex];
  const selectedOptionIndex = currentQuestion ? answers[currentQuestion.id] : null;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  useEffect(() => { fetchExamData(examId); }, [fetchExamData, examId]);

  useEffect(() => {
    if (isLoading || !permission?.granted) return;
    const timer = setInterval(() => tick(), 1000);
    return () => clearInterval(timer);
  }, [isLoading, permission?.granted, tick]);

  const isProctoringActive = !!permission?.granted && !isLoading && timeRemaining > 0;
  
  useProctoring(cameraRef, isProctoringActive, 10000, (result) => {
    logViolation(examId, result);
    Alert.alert("Proctor Warning", `System Note: ${result.reason}`, [{ text: "I Understand", style: "default" }]);
  });

  useEffect(() => {
    if (!isProctoringActive) return;
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState.match(/inactive|background/)) {
        logViolation(examId, { violation: true, reason: 'LOOKING_AWAY', confidence: 1.0 });
        Alert.alert("Exam Paused", "You left the exam app. This action has been recorded.", [{ text: "Return to Exam", style: "default" }]);
      }
    });
    return () => subscription.remove();
  }, [isProctoringActive, examId, logViolation]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleCancel = () => {
    Alert.alert("Cancel Exam?", "Your progress will be saved as incomplete.", [
      { text: "Keep Testing", style: "cancel" }, 
      { text: "Quit Exam", style: "destructive", onPress: async () => {
          await submitExam(examId, 'cancelled');
          navigation.replace('Dashboard'); 
        }
      }
    ]);
  };

  const handleComplete = () => {
    Alert.alert("Submit Exam", "Are you sure you want to finish and grade your exam?", [
      { text: "Review Answers", style: "cancel" }, 
      { text: "Submit", style: "default", onPress: () => {
          navigation.replace('Grading', { examId });
        }
      }
    ]);
  };

  if (!permission?.granted) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 justify-center items-center px-8">
        <ShieldAlert size={80} color="#3b82f6" />
        <Text className="text-2xl font-bold text-slate-800 mt-6 text-center">Camera Access Required</Text>
        <Text className="text-slate-500 mt-3 text-center mb-8 text-base">We need camera access to proctor this exam securely.</Text>
        <TouchableOpacity onPress={requestPermission} className="bg-blue-600 px-8 py-4 rounded-xl shadow-sm w-full">
          <Text className="font-bold text-white text-lg text-center">Allow Camera Access</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (isLoading || !currentQuestion) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 justify-center items-center">
        <Text className="text-blue-600 font-bold text-lg">Loading Exam Data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 relative">
      {/* Subtle PiP Camera */}
      <View className="absolute top-14 right-4 w-24 h-32 rounded-xl overflow-hidden border-2 border-slate-200 bg-black z-50 shadow-sm">
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" mute={true} />
      </View>

      <View className="flex-1">
        <View className="px-6 py-5 flex-row justify-between items-center border-b border-slate-200 bg-white pr-32 shadow-sm z-10">
          <View>
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Text>
            <View className="flex-row items-center">
              <TouchableOpacity onPress={handleCancel} className="mr-3 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                <Text className="text-slate-600 font-bold text-xs uppercase">Quit</Text>
              </TouchableOpacity>
              <Text className="text-lg font-bold text-slate-800">Quiz</Text>
            </View>
          </View>
          
          <View className="flex-row items-center bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
            <Clock size={16} color="#3b82f6" />
            <Text className="ml-2 font-bold text-blue-600 text-sm">{formatTime(timeRemaining)}</Text>
          </View>
        </View>

        <View className="flex-1 px-6 pt-8">
          <View className="bg-white p-6 rounded-2xl border border-slate-200 mb-8 shadow-sm">
            <Text className="text-xl font-bold text-slate-800 leading-relaxed">{currentQuestion.text}</Text>
          </View>

          <View>
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOptionIndex === index;
              return (
                <TouchableOpacity
                  key={`${currentQuestion.id}-${index}`}
                  activeOpacity={0.7}
                  onPress={() => selectAnswer(currentQuestion.id, index)}
                  style={{
                    width: '100%', padding: 18, borderRadius: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, marginBottom: 12,
                    backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                    borderColor: isSelected ? '#3b82f6' : '#e2e8f0',
                    shadowColor: isSelected ? '#3b82f6' : 'transparent',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2
                  }}
                >
                  {isSelected ? <CheckCircle2 size={24} color="#3b82f6" style={{ marginRight: 16 }} /> : <Circle size={24} color="#cbd5e1" style={{ marginRight: 16 }} />}
                  <Text style={{ fontSize: 16, flex: 1, color: isSelected ? '#1e40af' : '#475569', fontWeight: isSelected ? '700' : '500' }}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, paddingVertical: 20, backgroundColor: '#ffffff', borderTopWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 32 }}>
          
          <TouchableOpacity
            onPress={previousQuestion}
            disabled={currentQuestionIndex === 0}
            style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', opacity: currentQuestionIndex === 0 ? 0.3 : 1 }}
          >
            <ChevronLeft size={24} color="#64748b" />
            <Text style={{ marginLeft: 4, fontWeight: 'bold', color: '#64748b', fontSize: 16 }}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={isLastQuestion ? handleComplete : nextQuestion} 
            style={{
              backgroundColor: isLastQuestion ? '#10b981' : '#3b82f6',
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: isLastQuestion ? '#10b981' : '#3b82f6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4
            }}
          >
            <Text style={{ fontWeight: 'bold', color: 'white', fontSize: 16, marginRight: isLastQuestion ? 0 : 8 }}>
              {isLastQuestion ? 'Submit Exam' : 'Next'}
            </Text>
            {!isLastQuestion && <ChevronRight size={20} color="white" />}
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  );
}