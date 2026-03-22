import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, AppState, AppStateStatus } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Clock, ChevronRight, ChevronLeft, CheckCircle2, Circle, ShieldCheck } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { useExamStore } from '../store/useExamStore';
import { useProctoring } from '../hooks/useProctoring';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveExam'>;

export default function ActiveExamScreen({ route, navigation }: Props) {  const { examId } = route.params;
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  
  const {
    questions, currentQuestionIndex, answers, timeRemaining, 
    isSubmitted, isLoading, fetchExamData, selectAnswer,
    nextQuestion, previousQuestion, submitExam, tick , logViolation
  } = useExamStore();

  const currentQuestion = questions[currentQuestionIndex];
  const selectedOptionIndex = currentQuestion ? answers[currentQuestion.id] : null;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // 1. Fetch Data
  useEffect(() => { fetchExamData(examId); }, [fetchExamData, examId]);

  // 2. Timer
  useEffect(() => {
    if (isSubmitted || isLoading || !permission?.granted) return;
    const timer = setInterval(() => tick(), 1000);
    return () => clearInterval(timer);
  }, [isSubmitted, isLoading, permission?.granted, tick]);

  // 3. AI Proctoring
  const isProctoringActive = !!permission?.granted && !isSubmitted && !isLoading && timeRemaining > 0;
  useProctoring(cameraRef, isProctoringActive, 10000, (result) => {
    const messages: Record<string, string> = {
      MULTIPLE_FACES: "Multiple people detected in frame.",
      NO_FACE: "Face not visible in the camera.",
      PHONE_DETECTED: "Electronic device detected.",
      LOOKING_AWAY: "Please keep your eyes on the screen.",
    };
    logViolation(examId, result);
    Alert.alert(
      "AI Proctor Warning", 
      `${messages[result.reason || ''] || "Suspicious activity detected."}\n\nContinuing this behavior will flag your exam.`,
      [{ text: "I Understand", style: "destructive" }]
    );
  });

  // 4. THE DEVICE MONITOR (Screen Off / Background)
  useEffect(() => {
    if (!isProctoringActive) return;

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // If the app goes inactive (screen off) or background (user swiped home)
      if (nextAppState.match(/inactive|background/)) {
        logViolation(examId, {
          violation: true,
          reason: 'LOOKING_AWAY', // Map app-switching to a standard violation reason
          confidence: 1.0 // 100% confidence because it's a hardware-level event
        });
        Alert.alert(
          "🚨 CRITICAL PROCTOR VIOLATION",
          "You exited the application or turned off your screen. This incident has been securely logged to the server.",
          [{ text: "Acknowledge Warning", style: "destructive" }]
        );
        // Note: In production, you would trigger a Supabase insert here to permanently log the violation.
      }
    });

    return () => subscription.remove();
  }, [isProctoringActive, examId, logViolation]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleComplete = () => {
    Alert.alert("Submit Exam", "Are you sure? This action is final.", [
      { text: "Cancel", style: "cancel" }, 
      // Pass the examId to the store here
      { text: "Submit", style: "destructive", onPress: () => submitExam(examId) } 
    ]);
  };

  if (isSubmitted) {
    return (
      <SafeAreaView className="flex-1 bg-exam-bg justify-center items-center px-6">
        <ShieldCheck size={72} color="#4338ca" />
        <Text className="text-3xl font-bold text-exam-dark mt-6 text-center">Exam Secured</Text>
        <Text className="text-base text-slate-500 mt-3 text-center mb-8">
          Your proctoring session has ended and your score has been recorded.
        </Text>
        <TouchableOpacity 
          onPress={() => navigation.replace('Dashboard')}
          className="bg-exam-primary px-8 py-4 rounded-xl shadow-md w-full"
        >
          <Text className="font-bold text-white text-lg text-center">Return to Dashboard</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!permission?.granted) {
    return (
      <SafeAreaView className="flex-1 bg-exam-bg justify-center items-center px-8">
        <ShieldCheck size={80} color="#4338ca" />
        <Text className="text-2xl font-bold text-exam-dark mt-6 text-center">Camera Access Required</Text>
        <Text className="text-base text-slate-500 mt-3 text-center mb-8">
          This is a strictly proctored exam. The timer will not start until access is granted.
        </Text>
        <TouchableOpacity onPress={requestPermission} className="bg-exam-primary px-8 py-4 rounded-xl shadow-md w-full">
          <Text className="font-bold text-white text-lg text-center">Enable Camera to Begin</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (isLoading || !currentQuestion) {
    return (
      <SafeAreaView className="flex-1 bg-exam-bg justify-center items-center">
        <Text className="text-slate-500 font-semibold text-lg">Loading Secure Exam Data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-exam-bg relative">
      <View className="absolute top-14 right-4 w-28 h-36 rounded-xl overflow-hidden border-[3px] border-exam-accent shadow-lg z-50 bg-black">
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" mute={true} />
      </View>

      <View className="px-6 py-5 flex-row justify-between items-center border-b border-slate-200 bg-white pr-36">
        <View>
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Section 1</Text>
          <Text className="text-lg font-bold text-exam-dark">
            Question {currentQuestionIndex + 1} <Text className="text-slate-400">/ {questions.length}</Text>
          </Text>
        </View>
        <View className="flex-row items-center bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 shadow-sm">
          <Clock size={16} color="#dc2626" />
          <Text className="ml-2 font-bold text-red-600 tracking-widest">{formatTime(timeRemaining)}</Text>
        </View>
      </View>

      <View className="flex-1 px-6 pt-8">
        <View className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-8">
          <Text className="text-xl font-bold text-slate-800 leading-relaxed">{currentQuestion.text}</Text>
        </View>

        <View className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedOptionIndex === index;
            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.7}
                onPress={() => selectAnswer(currentQuestion.id, index)}
                className={`w-full p-4 rounded-xl flex-row items-center border-2 transition-all ${
                  isSelected ? 'border-exam-primary bg-exam-accent/30' : 'border-slate-200 bg-white'
                }`}
              >
                {isSelected ? <CheckCircle2 size={24} color="#4338ca" /> : <Circle size={24} color="#cbd5e1" />}
                <Text className={`ml-4 text-base flex-1 ${isSelected ? 'text-exam-dark font-bold' : 'text-slate-600 font-medium'}`}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View className="px-6 py-5 bg-white border-t border-slate-200 flex-row justify-between items-center pb-8">
        <TouchableOpacity
          onPress={previousQuestion}
          disabled={currentQuestionIndex === 0}
          className={`px-4 py-3 rounded-xl flex-row items-center ${currentQuestionIndex === 0 ? 'opacity-40' : 'opacity-100'}`}
        >
          <ChevronLeft size={20} color="#475569" />
          <Text className="ml-1 font-bold text-slate-600">Back</Text>
        </TouchableOpacity>

        {isLastQuestion ? (
          <TouchableOpacity onPress={handleComplete} className="bg-exam-primary px-8 py-3.5 rounded-xl shadow-md flex-row items-center">
            <ShieldCheck size={20} color="#ffffff" />
            <Text className="font-bold text-white text-base ml-2">Submit Exam</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={nextQuestion} className="bg-exam-dark px-8 py-3.5 rounded-xl flex-row items-center shadow-md">
            <Text className="font-bold text-white text-base mr-1">Next</Text>
            <ChevronRight size={20} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}