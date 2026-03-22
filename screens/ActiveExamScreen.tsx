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
    Alert.alert("SYSTEM WARNING", `Anomaly Detected: ${result.reason}`, [{ text: "Acknowledge", style: "destructive" }]);
  });

  useEffect(() => {
    if (!isProctoringActive) return;
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState.match(/inactive|background/)) {
        logViolation(examId, { violation: true, reason: 'LOOKING_AWAY', confidence: 1.0 });
        Alert.alert("SESSION BREACH", "Application focus lost. Incident logged.", [{ text: "Acknowledge", style: "destructive" }]);
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
    Alert.alert("ABORT SESSION?", "Progress will be marked as incomplete.", [
      { text: "Resume", style: "cancel" }, 
      { text: "Abort", style: "destructive", onPress: async () => {
          await submitExam(examId, 'cancelled');
          navigation.replace('Dashboard'); 
        }
      }
    ]);
  };

  const handleComplete = () => {
    Alert.alert("CONFIRM SUBMISSION", "Irreversible action. Proceed to grading?", [
      { text: "Review Options", style: "cancel" }, 
      { text: "Execute", style: "destructive", onPress: () => {
          navigation.replace('Grading', { examId });
        }
      }
    ]);
  };

  if (!permission?.granted) {
    return (
      <SafeAreaView className="flex-1 bg-exam-bg justify-center items-center px-8">
        <ShieldAlert size={80} color="#0ea5e9" />
        <Text className="text-2xl font-bold text-exam-text mt-6 uppercase">Hardware Lock</Text>
        <Text className="text-exam-muted mt-3 text-center mb-8">Optical sensor access required.</Text>
        <TouchableOpacity onPress={requestPermission} className="bg-exam-primary px-8 py-4 rounded-xl shadow-lg w-full">
          <Text className="font-bold text-exam-bg text-lg text-center uppercase">Grant Access</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (isLoading || !currentQuestion) {
    return (
      <SafeAreaView className="flex-1 bg-exam-bg justify-center items-center">
        <Text className="text-exam-primary font-mono tracking-widest uppercase">Initializing Matrix...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-exam-bg relative">
      <View className="absolute top-14 right-4 w-28 h-40 rounded-lg overflow-hidden border border-exam-border bg-black z-50">
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" mute={true} />
        <View className="absolute top-2 right-2 w-2 h-2 rounded-full bg-exam-danger animate-pulse" />
      </View>

      <View className="flex-1">
        <View className="px-6 py-5 flex-row justify-between items-center border-b border-exam-border bg-exam-bg pr-36 mt-2">
          <View>
            <Text className="text-[10px] font-bold text-exam-primary uppercase tracking-[0.2em] mb-1">
              Node {currentQuestionIndex + 1} {"//"} {questions.length}
            </Text>
            <View className="flex-row items-center">
              <TouchableOpacity onPress={handleCancel} className="mr-3 bg-red-500/10 p-1.5 rounded border border-red-500/30">
                <Text className="text-red-400 font-mono text-[10px] tracking-widest font-bold uppercase">Abort</Text>
              </TouchableOpacity>
              <Text className="text-lg font-bold text-exam-text">Assessment</Text>
            </View>
          </View>
          
          <View className="flex-row items-center bg-exam-card px-3 py-1.5 rounded-md border border-exam-border">
            <Clock size={14} color="#0ea5e9" />
            <Text className="ml-2 font-mono text-exam-primary text-sm font-bold tracking-widest">{formatTime(timeRemaining)}</Text>
          </View>
        </View>

        <View className="flex-1 px-6 pt-8">
          <View className="bg-exam-card p-6 rounded-xl border border-exam-border mb-8 shadow-lg shadow-black/20">
            <Text className="text-xl font-medium text-exam-text leading-relaxed tracking-wide">{currentQuestion.text}</Text>
          </View>

          <View>
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedOptionIndex === index;
              return (
                <TouchableOpacity
                  key={`${currentQuestion.id}-${index}`}
                  activeOpacity={0.8}
                  onPress={() => selectAnswer(currentQuestion.id, index)}
                  style={{
                    width: '100%', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, marginBottom: 12,
                    backgroundColor: isSelected ? 'rgba(14, 165, 233, 0.1)' : '#1e293b',
                    borderColor: isSelected ? '#0ea5e9' : '#334155'
                  }}
                >
                  {isSelected ? <CheckCircle2 size={20} color="#0ea5e9" style={{ marginRight: 16 }} /> : <Circle size={20} color="#52525b" style={{ marginRight: 16 }} />}
                  <Text style={{ fontSize: 16, flex: 1, color: isSelected ? '#0ea5e9' : '#94a3b8', fontWeight: isSelected ? 'bold' : '500' }}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* CRITICAL BYPASS: This bottom bar now uses raw React Native styles. 
          The DOM nodes NEVER unmount, they only change color and text. 
          This guarantees Reanimated cannot crash the Navigation Context. 
        */}
        <View style={{ paddingHorizontal: 24, paddingVertical: 20, backgroundColor: '#0f172a', borderTopWidth: 1, borderColor: '#1e293b', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 32 }}>
          
          <TouchableOpacity
            onPress={previousQuestion}
            disabled={currentQuestionIndex === 0}
            style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', opacity: currentQuestionIndex === 0 ? 0.3 : 1 }}
          >
            <ChevronLeft size={20} color="#a1a1aa" />
            <Text style={{ marginLeft: 4, fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 }}>Prev</Text>
          </TouchableOpacity>

          {/* THE UNIFIED BUTTON */}
          <TouchableOpacity 
            onPress={isLastQuestion ? handleComplete : nextQuestion} 
            style={{
              backgroundColor: isLastQuestion ? '#ef4444' : '#1e293b',
              borderWidth: 1,
              borderColor: isLastQuestion ? '#dc2626' : '#334155',
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: isLastQuestion ? '#ef4444' : 'transparent',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 5
            }}
          >
            <Text style={{ fontWeight: 'bold', color: isLastQuestion ? 'white' : '#f8fafc', textTransform: 'uppercase', letterSpacing: 2, fontSize: 14, marginRight: isLastQuestion ? 0 : 8 }}>
              {isLastQuestion ? 'Commit' : 'Next'}
            </Text>
            {!isLastQuestion && <ChevronRight size={18} color="#f8fafc" />}
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  );
}