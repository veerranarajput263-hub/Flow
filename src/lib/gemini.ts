import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function suggestRemix(originalPrompt: string, style: 'cyberpunk' | 'minimalist' | 'brutalist' | 'ethereal') {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Original prompt: "${originalPrompt}". 
      I want to remix this vision in a ${style} style. 
      Provide a new, highly descriptive artistic prompt that builds on the original but completely changes the aesthetic to ${style}.
      Keep it high-fidelity, polished, and suitable for a creator platform.
      Return ONLY the new prompt string.`,
    });

    return response.text?.trim() || originalPrompt;
  } catch (error) {
    console.error("Gemini Error:", error);
    return originalPrompt;
  }
}
