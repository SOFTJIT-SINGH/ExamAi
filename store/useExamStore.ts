import { create } from "zustand";
import { ExamState } from "../types/exam.types";
import { supabase } from "../utils/supabase";
import { ProctorResult } from '../utils/geminiProctor';

export const useExamStore = create<ExamState>((set, get) => ({
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  timeRemaining: 60 * 30, // 30 mins
  isSubmitted: false,
  isLoading: true, // Starts loading by default
  logViolation: (examId: string, result: ProctorResult) => Promise<void>,

  fetchExamData: async (examId: string) => {
    set({ isLoading: true });
    try {
      console.log(`Fetching data for exam: ${examId}...`);
      
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('exam_id', examId);

      // --- ADD THESE TWO LOGS ---
      console.log("Supabase Data:", data);
      console.log("Supabase Error:", error);

      if (error) throw error;
      if (data && data.length > 0) {
        set({ questions: data, isLoading: false });
      } else {
        console.warn("No questions found for this Exam ID!");
        set({ isLoading: false }); // Stop loading even if empty so we don't trap the user
      }
    } catch (error) {
      console.error("Failed to fetch exam:", error);
      set({ isLoading: false });
    }
  },
  // --- NEW: Securely log violations to Supabase ---
  
  logViolation: async (examId: string, result: ProctorResult) => {
    try {
      // 1. Get the securely authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 2. Insert the log. RLS ensures this cannot be tampered with.
      const { error } = await supabase.from('proctor_logs').insert({
        user_id: user.id,
        exam_id: examId,
        reason: result.reason,
        confidence: result.confidence
      });

      if (error) {
        console.error("Failed to save proctor log:", error.message);
      } else {
        console.log(`🔒 Violation securely logged for user: ${user.id}`);
      }
    } catch (error) {
      console.error("Proctor logging error:", error);
    }
  },

  selectAnswer: (questionId, optionIndex) => {
    set((state) => ({
      answers: { ...state.answers, [questionId]: optionIndex },
    }));
  },

  nextQuestion: () => {
    const { currentQuestionIndex, questions } = get();
    if (currentQuestionIndex < questions.length - 1) {
      set({ currentQuestionIndex: currentQuestionIndex + 1 });
    }
  },

  previousQuestion: () => {
    const { currentQuestionIndex } = get();
    if (currentQuestionIndex > 0) {
      set({ currentQuestionIndex: currentQuestionIndex - 1 });
    }
  },

// Replace your old submitExam with this upgraded one
  submitExam: async (examId: string) => {
    const { questions, answers } = get();
    
    // 1. Calculate Score
    let correctAnswers = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correct_option_index) {
        correctAnswers++;
      }
    });

    const scorePercentage = (correctAnswers / questions.length) * 100;
    const passed = scorePercentage >= 60; // 60% passing threshold

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // 2. Save to Database
        await supabase.from('exam_results').insert({
          user_id: user.id,
          exam_id: examId,
          score: scorePercentage,
          total_questions: questions.length,
          passed: passed
        });
      }
    } catch (error) {
      console.error("Failed to save result:", error);
    }

    // 3. Update UI State
    set({ isSubmitted: true });
  },
  tick: () => {
    const { timeRemaining, isSubmitted } = get();
    if (timeRemaining > 0 && !isSubmitted) {
      set({ timeRemaining: timeRemaining - 1 });
    }
    if (timeRemaining === 1) {
      set({ isSubmitted: true });
    }
  },
}));