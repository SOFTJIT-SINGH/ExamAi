import { useEffect, useRef, RefObject } from 'react';
import { CameraView } from 'expo-camera';
import { analyzeProctorFrame } from '../utils/geminiProctor';

export type ProctorResult = {
  violation: boolean;
  reason?: string;
  confidence: number;
};

export const useProctoring = (
  cameraRef: RefObject<CameraView | null>,
  isActive: boolean,
  interval: number = 10000, // Safe 10-second limit for free API tier
  onViolation: (result: ProctorResult) => void
) => {
  const savedOnViolation = useRef(onViolation);
  
  // Track consecutive API failures
  const failureCount = useRef(0);

  // Update the ref whenever the function changes, WITHOUT restarting the timer
  useEffect(() => {
    savedOnViolation.current = onViolation;
  }, [onViolation]);

  useEffect(() => {
    if (!isActive || !cameraRef.current) return;

    console.log('🟢 Proctoring Engine Started! (Protected from re-renders)');

    const timer = setInterval(async () => {
      try {
        if (cameraRef.current) {
          console.log('📸 Snapping photo...');
          const photo = await cameraRef.current.takePictureAsync({
            base64: true,
            quality: 0.2,
            shutterSound: false, // <-- This completely mutes the hardware click!
          });
          if (photo?.base64) {
            console.log('📤 Sending to Gemini...');
            const result = await analyzeProctorFrame(photo.base64);

            console.log('🤖 Gemini Says:', result);

            if (result.violation) {
              // Use the saved ref to trigger the warning!
              savedOnViolation.current(result);
            }
            // Reset failures if successful
            failureCount.current = 0;
          }
        }
      } catch (error: any) {
        console.error('Proctoring System Failure:', error);
        failureCount.current += 1;
        
        if (failureCount.current >= 3) {
          savedOnViolation.current({
            violation: true,
            reason: `SYSTEM ERROR: Connection dropped. Please ensure stable internet.`,
            confidence: 1.0,
          });
          failureCount.current = 0;
        }
      }
    }, interval);

    return () => {
      console.log('🛑 Proctoring Engine Stopped.');
      clearInterval(timer);
    };
    // THE FIX: We removed 'onViolation' from this array so the clock ticks don't kill it!
  }, [isActive, interval, cameraRef]);
};
