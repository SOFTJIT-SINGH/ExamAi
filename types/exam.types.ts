export type Option = {
  id: string;
  text: string;
};

export type Question = {
  id: string;
  question: string;
  options: Option[];
  correctAnswerId: string;
};

export type ExamState = {
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, string>; // questionId -> optionId
  timeRemaining: number;
  isSubmitted: boolean;

  selectAnswer: (questionId: string, optionId: string) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  submitExam: () => void;
  tick: () => void;
};