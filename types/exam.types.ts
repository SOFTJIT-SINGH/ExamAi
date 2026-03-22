import { ProctorResult } from '../utils/geminiProctor';

export interface Question {
  id: string;
  exam_id: string;
  text: string;
  options: string[];
  correct_option_index: number;
  explanation?: string; // <-- Added to support the new database column
}

export interface ExamState {
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, number>;
  timeRemaining: number;
  isSubmitted: boolean;
  isLoading: boolean;

  fetchExamData: (examId: string) => Promise<void>;
  selectAnswer: (questionId: string, optionIndex: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  submitExam: (examId: string, status?: 'completed' | 'cancelled') => Promise<void>;
  tick: () => void;
  logViolation: (examId: string, result: ProctorResult) => Promise<void>; // <-- THE MISSING PIECE
}