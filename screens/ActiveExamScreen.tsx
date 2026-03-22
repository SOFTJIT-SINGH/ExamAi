import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Clock, ChevronRight, ChevronLeft, CheckCircle2, Circle, ShieldCheck } from 'lucide-react-native';
import { useExamStore } from '../store/useExamStore';

export default function ActiveExamScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  
  const {
    questions,
    currentQuestionIndex,
    answers,
    timeRemaining, 
    isSubmitted,
    selectAnswer,
    nextQuestion,
    previousQuestion, 
    submitExam,
    tick 
  } = useExamStore();

  const currentQuestion = questions[currentQuestionIndex];
  const selectedOptionId = currentQuestion ? answers[currentQuestion.id] : null;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // --- NEW: Automatic Camera Permission on Mount ---
  useEffect(() => {
    // 1. Wait until Expo finishes checking hardware status
    if (permission === null) return;

    // 2. If we don't have permission, auto-request it
    if (!permission.granted && permission.canAskAgain) {
      // The slight timeout pushes the request to the end of the event loop,
      // completely bypassing the "update on unmounted component" React crash.
      const timer = setTimeout(() => {
        requestPermission();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [permission, requestPermission]);

  // Timer Effect
  useEffect(() => {
    if (isSubmitted) return;
    const timer = setInterval(() => tick(), 1000);
    return () => clearInterval(timer);
  }, [isSubmitted, tick]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleComplete = () => {
    Alert.alert(
      "Submit Exam",
      "Are you sure you want to submit? This action is final.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Submit", style: "destructive", onPress: submitExam }
      ]
    );
  };

  if (isSubmitted) {
    return (
      <SafeAreaView className="flex-1 bg-exam-bg justify-center items-center px-6">
        <ShieldCheck size={72} color="#4338ca" />
        <Text className="text-3xl font-bold text-exam-dark mt-6 text-center">
          Exam Secured
        </Text>
        <Text className="text-base text-slate-500 mt-3 text-center">
          Your proctoring session has ended and answers have been securely transmitted.
        </Text>
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView className="flex-1 bg-exam-bg justify-center items-center">
        <Text className="text-slate-500 font-semibold">Loading Exam...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-exam-bg relative">
      {/* PiP Proctoring Camera */}
      {permission?.granted ? (
        <View className="absolute top-14 right-4 w-28 h-36 rounded-xl overflow-hidden border-[3px] border-exam-accent shadow-lg z-50 bg-black">
          <CameraView style={{ flex: 1 }} facing="front" mute={true} />
        </View>
      ) : (
        <View className="absolute top-14 right-4 w-28 h-36 rounded-xl overflow-hidden border-[3px] border-slate-200 shadow-lg z-50 bg-white justify-center items-center p-3">
          {permission === null ? (
            <Text className="text-xs text-slate-400 font-semibold text-center">Checking Cam...</Text>
          ) : (
            <>
              <ShieldCheck size={24} color="#64748b" className="mb-2" />
              <TouchableOpacity 
                onPress={requestPermission}
                className="bg-exam-primary py-2 px-3 rounded-lg w-full"
              >
                <Text className="text-white text-[10px] font-bold text-center">
                  Enable Cam
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Header */}
      <View className="px-6 py-5 flex-row justify-between items-center border-b border-slate-200 bg-white pr-36">
        <View>
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
            Section 1
          </Text>
          <Text className="text-lg font-bold text-exam-dark">
            Question {currentQuestionIndex + 1} <Text className="text-slate-400">/ {questions.length}</Text>
          </Text>
        </View>
        <View className="flex-row items-center bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 shadow-sm">
          <Clock size={16} color="#dc2626" />
          <Text className="ml-2 font-bold text-red-600 tracking-widest">
            {formatTime(timeRemaining)}
          </Text>
        </View>
      </View>

      {/* Question Content */}
      <View className="flex-1 px-6 pt-8">
        <View className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-8">
          <Text className="text-xl font-bold text-slate-800 leading-relaxed">
            {currentQuestion.text}
          </Text>
        </View>

        {/* Options */}
        <View className="space-y-3">
          {currentQuestion.options?.map((option: any, index: number) => {
            const optionId = option.id !== undefined ? option.id : index;
            const isSelected = selectedOptionId === optionId;
            const optionText = typeof option === 'string' ? option : option.text;

            return (
              <TouchableOpacity
                key={optionId}
                activeOpacity={0.7}
                onPress={() => selectAnswer(currentQuestion.id, optionId)}
                className={`w-full p-4 rounded-xl flex-row items-center border-2 transition-all ${
                  isSelected 
                    ? 'border-exam-primary bg-exam-accent/30' 
                    : 'border-slate-200 bg-white'
                }`}
              >
                {isSelected ? (
                  <CheckCircle2 size={24} color="#4338ca" />
                ) : (
                  <Circle size={24} color="#cbd5e1" />
                )}
                <Text 
                  className={`ml-4 text-base flex-1 ${
                    isSelected ? 'text-exam-dark font-bold' : 'text-slate-600 font-medium'
                  }`}
                >
                  {optionText}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Bottom Navigation */}
      <View className="px-6 py-5 bg-white border-t border-slate-200 flex-row justify-between items-center pb-8">
        <TouchableOpacity
          onPress={previousQuestion}
          disabled={currentQuestionIndex === 0}
          className={`px-4 py-3 rounded-xl flex-row items-center ${
            currentQuestionIndex === 0 ? 'opacity-40' : 'opacity-100'
          }`}
        >
          <ChevronLeft size={20} color="#475569" />
          <Text className="ml-1 font-bold text-slate-600">Back</Text>
        </TouchableOpacity>

        {isLastQuestion ? (
          <TouchableOpacity
            onPress={handleComplete}
            className="bg-exam-primary px-8 py-3.5 rounded-xl shadow-md shadow-indigo-200 flex-row items-center"
          >
            <ShieldCheck size={20} color="#ffffff" />
            <Text className="font-bold text-white text-base ml-2">Submit Exam</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={nextQuestion}
            className="bg-exam-dark px-8 py-3.5 rounded-xl flex-row items-center shadow-md shadow-slate-300"
          >
            <Text className="font-bold text-white text-base mr-1">Next</Text>
            <ChevronRight size={20} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}