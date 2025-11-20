
import { GoogleGenAI, Type } from "@google/genai";
import { FoodAnalysis } from "../types";

// Initialize the Gemini API client
// The API key is injected via process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeFoodImage = async (base64Image: string): Promise<FoodAnalysis> => {
  const modelId = "gemini-2.5-flash";

  const prompt = `
    You are a nutrition expert. Analyze the food in this image.
    1. Identify the main food item (in Thai language).
    2. Estimate the total calories.
    3. Estimate the macronutrients (Carbs, Protein, Fat) in grams.
    4. List 3-5 main ingredients (in Thai language).
    5. Provide a short, 1-sentence healthy suggestion or fun fact about this meal (in Thai language).
    6. Identify 1-2 short tags describing the meal (e.g., 'โปรตีนสูง', 'แป้งน้อย', 'ผักเยอะ', 'น้ำตาลสูง', 'คลีน').
    
    Return the result in JSON format.
  `;

  try {
    // Remove the data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            foodName: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            macros: {
              type: Type.OBJECT,
              properties: {
                carbs: { type: Type.NUMBER },
                protein: { type: Type.NUMBER },
                fat: { type: Type.NUMBER },
              },
              required: ["carbs", "protein", "fat"],
            },
            ingredients: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            suggestion: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["foodName", "calories", "macros", "ingredients", "suggestion", "tags"],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini.");
    }

    const data = JSON.parse(text) as FoodAnalysis;
    return data;
  } catch (error) {
    console.error("Error analyzing food:", error);
    // Fallback mock data in case of error to keep the UI functional for the demo
    return {
      foodName: "ไม่สามารถระบุได้",
      calories: 0,
      macros: { carbs: 0, protein: 0, fat: 0 },
      ingredients: ["เกิดข้อผิดพลาดในการวิเคราะห์"],
      suggestion: "กรุณาลองใหม่อีกครั้งด้วยภาพที่ชัดเจนขึ้น",
      tags: ["ลองใหม่"],
    };
  }
};

export const askDietCoach = async (userMessage: string): Promise<string> => {
    const modelId = "gemini-2.5-flash";
    
    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: userMessage,
            config: {
                systemInstruction: `
                    You are a cheerful, friendly, and knowledgeable Personal Nutrition Coach named 'โค้ชกะทิ' (Coach Kathi).
                    Your goal is to help users plan healthy meals, check calories, and stay motivated.
                    
                    Rules:
                    1. Always reply in Thai language.
                    2. Keep your answers concise (2-3 sentences max) unless asked for a list.
                    3. Use cute emojis (🥗, 🥑, ✨, 💪) to make the conversation fun.
                    4. If asked for meal suggestions, provide specific examples with approximate calories.
                    5. Be encouraging and positive.
                    
                    Example interaction:
                    User: "กินอะไรดี 300 kcal?"
                    Coach: "ลอง 'ยำวุ้นเส้นอกไก่' ไหมคะ? 🌶️ ประมาณ 280 kcal เอง อร่อยแซ่บแถมโปรตีนสูงด้วยนะ! หรือจะเป็น 'โยเกิร์ตใส่ผลไม้' ก็สดชื่นดีค่ะ 🫐✨"
                `
            }
        });
        
        return response.text || "ขออภัยค่ะ โค้ชกำลังมึนหัวนิดหน่อย ลองถามใหม่นะคะ 💫";
    } catch (error) {
        console.error("Error asking coach:", error);
        return "เกิดข้อผิดพลาดในการเชื่อมต่อ ลองใหม่อีกครั้งนะคะ 🥺";
    }
};
