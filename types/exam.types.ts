import { Session } from '@supabase/supabase-js';
import { ProctorResult } from '../utils/geminiProctor';

export interface AuthState {
  session: Session | null;
  isLoading: boolean;
  initializeAuth: () => Promise<void>;
  
  // FIXED: Added firstName and lastName to the blueprint
  signUp: (email: string, password: string, firstName: string, lastName?: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
}

export interface Question {
  id: string;
  exam_id: string;
  text: string;
  options: string[];
  correct_option_index: number;
  explanation?: string;
}

export interface ExamState {
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, number>;
  timeRemaining: number;
  isSubmitted: boolean;
  isLoading: boolean;

  // FIXED: Added the optional limit parameter
  fetchExamData: (examId: string, limit?: number) => Promise<void>;
  selectAnswer: (questionId: string, optionIndex: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  submitExam: (examId: string, status?: 'completed' | 'cancelled' | 'terminated') => Promise<void>;
  tick: () => void;
  logViolation: (examId: string, result: ProctorResult) => Promise<void>;
}