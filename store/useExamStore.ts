import { create } from "zustand";
import { Alert } from "react-native"; // <-- Added for error visibility
import { ExamState } from "../types/exam.types";
import { supabase } from "../utils/supabase";
import { ProctorResult } from '../utils/geminiProctor';

export const useExamStore = create<ExamState>((set, get) => ({
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  timeRemaining: 60 * 30, 
  isSubmitted: false,
  isLoading: true, 

  fetchExamData: async (examId: string) => {
    set({ isLoading: true, isSubmitted: false, answers: {}, currentQuestionIndex: 0 });
    try {
      const { data, error } = await supabase.from('questions').select('*').eq('exam_id', examId);
      if (error) throw error;
      if (data && data.length > 0) {
        set({ questions: data, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error("Failed to fetch exam:", error);
      set({ isLoading: false });
    }
  },

  logViolation: async (examId: string, result: ProctorResult) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('proctor_logs').insert({
        user_id: user.id, exam_id: examId, reason: result.reason, confidence: result.confidence
      });
    } catch (error) {
      console.error("Proctor logging error:", error);
    }
  },

  selectAnswer: (questionId, optionIndex) => {
    set((state) => ({ answers: { ...state.answers, [questionId]: optionIndex } }));
  },

  nextQuestion: () => {
    const { currentQuestionIndex, questions } = get();
    if (currentQuestionIndex < questions.length - 1) set({ currentQuestionIndex: currentQuestionIndex + 1 });
  },

  previousQuestion: () => {
    const { currentQuestionIndex } = get();
    if (currentQuestionIndex > 0) set({ currentQuestionIndex: currentQuestionIndex - 1 });
  },

  submitExam: async (examId: string, status: 'completed' | 'cancelled' = 'completed') => {
    const { questions, answers } = get();
    
    let correctAnswers = 0;
    questions.forEach((q) => { if (answers[q.id] === q.correct_option_index) correctAnswers++; });

    const scorePercentage = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;
    const passed = scorePercentage >= 60;
    const attemptedCount = Object.keys(answers).length;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('exam_results').insert({
          user_id: user.id,
          exam_id: examId,
          score: scorePercentage,
          total_questions: questions.length,
          passed: passed,
          status: status,
          attempted_questions: attemptedCount
        });

        // IF THE DATABASE REJECTS IT, WE WILL KNOW IMMEDIATELY
        if (error) {
          console.error("Supabase Insert Error:", error);
          Alert.alert("Database Error", `Failed to save exam: ${error.message}`);
        }
      }
    } catch (error) {
      console.error("Failed to save result:", error);
    }
  },

  tick: () => {
    const { timeRemaining, isSubmitted } = get();
    if (timeRemaining > 0 && !isSubmitted) set({ timeRemaining: timeRemaining - 1 });
  },
}));