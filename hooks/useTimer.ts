import { useEffect } from 'react';
import { useExamStore } from '@/store/useExamStore';
import { ExamState } from '@/types/exam.types';

export const useTimer = () => {
  const tick = useExamStore((s: ExamState) => s.tick);
  const isSubmitted = useExamStore((s: ExamState) => s.isSubmitted);

  useEffect(() => {
    if (isSubmitted) return;

    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [isSubmitted]);
};
