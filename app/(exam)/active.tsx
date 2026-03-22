import { useEffect } from "react";
import { useExamStore } from "@/store/useExamStore";

export const useTimer = () => {
  const tick = useExamStore((s) => s.tick);
  const isSubmitted = useExamStore((s) => s.isSubmitted);

  useEffect(() => {
    if (isSubmitted) return;

    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [isSubmitted]);
};