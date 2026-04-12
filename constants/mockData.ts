import { Question } from '@/types/exam.types';

export const mockQuestions: Question[] = [
  {
    id: 'q1',
    exam_id: 'e1',
    text: 'What is React Native?',
    options: ['A database', 'A mobile framework', 'An operating system', 'A backend server'],
    correct_option_index: 1,
  },
  {
    id: 'q2',
    exam_id: 'e1',
    text: 'What is Zustand used for?',
    options: ['Routing', 'State management', 'Styling', 'Testing'],
    correct_option_index: 1,
  },
];
