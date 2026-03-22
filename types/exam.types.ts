export interface Question {
  id: string;
  exam_id: string;
  text: string;
  options: string[]; // Supabase will return our JSONB array of strings here
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
  submitExam: () => void;
  tick: () => void;
}