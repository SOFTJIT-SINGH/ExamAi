import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Clock, ChevronRight, ChevronLeft, CheckCircle2, Circle } from 'lucide-react-native';
import { useExamStore } from './useExamStore';

export default function ActiveExamScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  
  // Zustand State Selection
  const {
    questions,
    currentQuestionIndex,
    answers,
    timeRemainingSeconds,
    isSubmitted,
    selectAnswer,
    nextQuestion,
    prevQuestion,
    submitExam,
    decrementTime
  } = useExamStore();

  const currentQuestion = questions[currentQuestionIndex];
  const selectedOptionIndex = answers[currentQuestion.id];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  // Timer Effect
  useEffect(() => {
    if (isSubmitted) return;
    
    const timer = setInterval(() => {
      decrementTime();
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isSubmitted, decrementTime]);

  // Camera Permissions On Mount
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Time Formatting (MM:SS)
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleComplete = () => {
    Alert.alert(
      "Submit Exam",
      "Are you sure you want to submit your exam? You cannot undo this action.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Submit", style: "destructive", onPress: submitExam }
      ]
    );
  };

  if (isSubmitted) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 justify-center items-center px-6">
        <CheckCircle2 size={64} color="#16a34a" />
        <Text className="text-2xl font-bold text-slate-900 mt-6 text-center">
          Exam Submitted Successfully
        </Text>
        <Text className="text-base text-slate-500 mt-2 text-center">
          Your proctoring data and answers have been securely saved.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50 relative">
      {/* Picture-in-Picture Proctoring Camera */}
      {permission?.granted ? (
        <View className="absolute top-16 right-4 w-28 h-36 rounded-xl overflow-hidden border-2 border-slate-200 shadow-md z-50 bg-black">
          <CameraView 
            style={{ flex: 1 }} 
            facing="front"
            mute={true}
          />
        </View>
      ) : null}

      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center border-b border-slate-200 mt-4 pr-36">
        <View>
          <Text className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
        </View>
        <View className="flex-row items-center bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
          <Clock size={16} color="#dc2626" />
          <Text className="ml-2 font-bold text-red-600">
            {formatTime(timeRemainingSeconds)}
          </Text>
        </View>
      </View>

      {/* Question Content */}
      <View className="flex-1 px-6 pt-8">
        <Text className="text-2xl font-bold text-slate-900 leading-snug mb-8">
          {currentQuestion.text}
        </Text>

        {/* Options */}
        <View className="space-y-4">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedOptionIndex === index;
            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.7}
                onPress={() => selectAnswer(currentQuestion.id, index)}
                className={`w-full p-4 rounded-2xl flex-row items-center border-2 transition-all ${
                  isSelected 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'border-slate-200 bg-white'
                }`}
              >
                {isSelected ? (
                  <CheckCircle2 size={24} color="#2563eb" />
                ) : (
                  <Circle size={24} color="#cbd5e1" />
                )}
                <Text 
                  className={`ml-4 text-base flex-1 ${
                    isSelected ? 'text-blue-900 font-semibold' : 'text-slate-700 font-medium'
                  }`}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Bottom Navigation */}
      <View className="px-6 py-6 border-t border-slate-200 bg-white flex-row justify-between items-center">
        <TouchableOpacity
          onPress={prevQuestion}
          disabled={currentQuestionIndex === 0}
          className={`px-4 py-3 rounded-xl flex-row items-center ${
            currentQuestionIndex === 0 ? 'opacity-50' : 'opacity-100'
          }`}
        >
          <ChevronLeft size={20} color="#475569" />
          <Text className="ml-2 font-semibold text-slate-600">Previous</Text>
        </TouchableOpacity>

        {isLastQuestion ? (
          <TouchableOpacity
            onPress={handleComplete}
            className="bg-blue-600 px-6 py-3 rounded-xl shadow-sm shadow-blue-200"
          >
            <Text className="font-bold text-white text-base">Submit Exam</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={nextQuestion}
            className="bg-slate-900 px-6 py-3 rounded-xl flex-row items-center shadow-sm"
          >
            <Text className="font-bold text-white text-base mr-2">Next</Text>
            <ChevronRight size={20} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}