import { GoogleGenAI, Type } from "@google/genai";

export const extractPlateFromImage = async (base64Image: string): Promise<string | null> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key missing for Gemini");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Clean base64 string if it contains metadata header
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          {
            text: "Identify the vehicle license plate in this image. Return ONLY the plate characters in uppercase, no spaces or hyphens. If no plate is found, return 'NOT_FOUND'."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            plate: { type: Type.STRING }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return null;

    const data = JSON.parse(jsonText);
    return data.plate === 'NOT_FOUND' ? null : data.plate;

  } catch (error) {
    console.error("Gemini OCR Error:", error);
    return null;
  }
};