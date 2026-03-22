import { Question } from "@/types/exam.types";

export const mockQuestions: Question[] = [
  {
    id: "q1",
    question: "What is React Native?",
    options: [
      { id: "a", text: "A database" },
      { id: "b", text: "A mobile framework" },
      { id: "c", text: "An operating system" },
      { id: "d", text: "A backend server" },
    ],
    correctAnswerId: "b",
  },
  {
    id: "q2",
    question: "What is Zustand used for?",
    options: [
      { id: "a", text: "Routing" },
      { id: "b", text: "State management" },
      { id: "c", text: "Styling" },
      { id: "d", text: "Testing" },
    ],
    correctAnswerId: "b",
  },
];