import { useEffect, RefObject } from 'react';
import { CameraView } from 'expo-camera';
import { analyzeProctorFrame } from '../utils/geminiProctor';

export type ProctorResult = {
  violation: boolean;
  reason?: string;
  confidence: number;
};

export const useProctoring = (
  cameraRef: RefObject<CameraView>,
  isActive: boolean,
  interval: number = 10000, 
  onViolation: (result: ProctorResult) => void
) => {
  useEffect(() => {
    if (!isActive || !cameraRef.current) return;

    const timer = setInterval(async () => {
      try {
        if (cameraRef.current) {
          const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.1 });
          
          if (photo?.base64) {
             const result = await analyzeProctorFrame(photo.base64); 
             if (result.violation) {
               onViolation(result);
             }
          }
        }
      } catch (error: any) {
        // NO MORE SILENT FAILURES! 
        // This will pop up an alert on your screen if the API breaks.
        console.error("Proctoring System Failure:", error);
        onViolation({
          violation: true,
          reason: `SYSTEM ERROR: ${error.message || "Failed to connect to AI Proctor."}`,
          confidence: 1.0
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [isActive, interval, cameraRef, onViolation]);
};