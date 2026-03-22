import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Expo requires the EXPO_PUBLIC_ prefix to read env variables on the client
const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export type ProctorResult = {
  violation: boolean;
  reason?: string;
  confidence: number;
};

export const analyzeProctorFrame = async (base64Image: string): Promise<ProctorResult> => {
  if (!apiKey) {
    throw new Error("Missing EXPO_PUBLIC_GEMINI_API_KEY in .env file");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Turn off safety filters so it doesn't refuse to analyze the webcam
    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    const prompt = `You are a strict AI exam proctor. Analyze this webcam frame of a student.
You must return ONLY a raw JSON object matching this exact structure:
{ "violation": boolean, "reason": "string", "confidence": number }

Mark "violation": true IF ANY of the following occur:
1. The student is NOT in the frame (reason: "No face detected").
2. There are MULTIPLE people in the frame (reason: "Multiple people detected").
3. The student's face is blatantly TURNED AWAY from the camera (reason: "Looking away from screen").
4. A phone, book, or unauthorized device is visible (reason: "Unauthorized object detected").

If the student is looking directly at the camera/screen normally, return "violation": false.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [
        { text: prompt }, 
        { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
      ]}],
      safetySettings,
    });

    const responseText = result.response.text();
    
    // Bulletproof JSON extractor (ignores any conversational text the AI might add)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("AI did not return valid JSON.");
    }

    return JSON.parse(jsonMatch[0]) as ProctorResult;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error; // Throw it so the hook can catch it and alert you!
  }
};