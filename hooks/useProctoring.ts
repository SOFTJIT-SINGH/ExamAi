import { useEffect, useRef } from 'react';
import { CameraView } from 'expo-camera';
import { analyzeProctorFrame, ProctorResult } from '../utils/geminiProctor';

export const useProctoring = (
  cameraRef: React.RefObject<CameraView | null>,
  isProctoringActive: boolean,
  intervalMs: number = 10000,
  onViolation: (result: ProctorResult) => void
) => {
  const isAnalyzing = useRef(false);

  useEffect(() => {
    if (!isProctoringActive) return;

    const captureAndAnalyze = async () => {
      if (isAnalyzing.current || !cameraRef.current) return;

      try {
        isAnalyzing.current = true;
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.1, // Ultra-low quality for fast, cheap API calls
        });

        if (photo?.base64) {
          console.log('🤖 Analyzing proctor frame...');
          const result = await analyzeProctorFrame(photo.base64);
          
          if (result && result.violation) {
            onViolation(result);
          }
        }
      } catch (error) {
        console.error('Proctoring pipeline error:', error);
      } finally {
        isAnalyzing.current = false;
      }
    };

    const intervalId = setInterval(captureAndAnalyze, intervalMs);
    return () => clearInterval(intervalId);
  }, [cameraRef, isProctoringActive, intervalMs, onViolation]);
};