import { create } from "zustand";
// The fix
import { ExamState } from "../types/exam.types";
import { mockQuestions } from "../constants/mockData";

export const useExamStore = create<ExamState>((set, get) => ({
  questions: mockQuestions,
  currentQuestionIndex: 0,
  answers: {},
  timeRemaining: 60 * 30, // 30 mins
  isSubmitted: false,

  selectAnswer: (questionId, optionId) => {
    set((state) => ({
      answers: {
        ...state.answers,
        [questionId]: optionId,
      },
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

  submitExam: () => {
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