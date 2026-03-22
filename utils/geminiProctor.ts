import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || '');

export interface ProctorResult {
  violation: boolean;
  reason: 'MULTIPLE_FACES' | 'NO_FACE' | 'PHONE_DETECTED' | 'LOOKING_AWAY' | 'CLEAR' | null;
  confidence: number;
}

export const analyzeProctorFrame = async (base64Image: string): Promise<ProctorResult | null> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
      You are an strict, automated AI exam proctor. Analyze this image captured from a student's webcam during an exam.
      
      Identify if any of the following academic integrity violations are occurring:
      1. MULTIPLE_FACES: There is more than one person visible in the frame.
      2. NO_FACE: There is no human visible in the frame.
      3. PHONE_DETECTED: The student is holding or looking at a mobile phone or secondary electronic device.
      4. LOOKING_AWAY: The student is clearly looking completely away from the screen/camera for an extended period.

      If no violations are found, the reason should be "CLEAR".
      
      Respond ONLY with a valid, raw JSON object in this exact format. Do not include markdown formatting like \`\`\`json.
      {
        "violation": boolean,
        "reason": "STRING_ENUM_FROM_ABOVE",
        "confidence": number
      }
    `;

    const imageParts = [{ inlineData: { data: base64Image, mimeType: "image/jpeg" } }];
    const result = await model.generateContent([prompt, ...imageParts]);
    const text = result.response.text();

    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText) as ProctorResult;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};