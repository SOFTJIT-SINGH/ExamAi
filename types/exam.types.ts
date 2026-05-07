import { Session } from '@supabase/supabase-js';
import { ProctorResult } from '../utils/geminiProctor';

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: 'student' | 'admin';
}

export interface Category {
  id: string;
  name: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  category: string;
  created_at?: string;
}

export interface AuthState {
  session: Session | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  initializeAuth: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName?: string,
    phone?: string
  ) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  updateUserProfile: (firstName: string, lastName: string, phone?: string) => Promise<void>;
}

export interface Question {
  id: string;
  exam_id: string;
  question_text: string;
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
  fetchExamData: (examId: string, limit?: number) => Promise<void>;
  selectAnswer: (questionId: string, optionIndex: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  submitExam: (examId: string, status?: 'completed' | 'cancelled' | 'terminated') => Promise<void>;
  tick: () => void;
  logViolation: (examId: string, result: ProctorResult) => Promise<void>;
}
