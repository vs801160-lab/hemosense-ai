import { GoogleGenAI, Type } from "@google/genai";
import { HealthAnalysis, Language } from "../types";

/**
 * Analyzes a base64 encoded tongue image using Gemini 3 Flash.
 * Returns a structured health report.
 */
export const analyzeTongueImage = async (base64Image: string, lang: Language = 'hi'): Promise<HealthAnalysis> => {
  // Initialize AI client with environment variable API Key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Model specifically chosen for visual medical-style tasks
  const model = 'gemini-3-flash-preview';
  
  const systemInstruction = `
    You are an expert Medical AI specializing in Tongue Diagnosis (Lingual Analysis).
    Analyze the provided tongue image for:
    1. Color (Pale, Pink, Red, Purple)
    2. Coating (Thin, Thick, Yellow, White)
    3. Texture (Cracks, Spots, Swelling)
    
    Based on these, estimate Hemoglobin levels (Hb) and general health status.
    Output language MUST be ${lang === 'hi' ? 'Hindi' : 'English'}.
    Return a strictly valid JSON response.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { 
          inlineData: { 
            mimeType: 'image/jpeg', 
            data: base64Image 
          } 
        },
        { 
          text: `Provide a detailed tongue analysis report in ${lang === 'hi' ? 'Hindi' : 'English'}. Include estimated Hb level, health status, specific observations, and helpful recommendations.` 
        }
      ]
    },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hemoglobinEstimate: { 
            type: Type.STRING, 
            description: "Estimated Hemoglobin level (e.g., '12.5 g/dL')" 
          },
          healthStatus: { 
            type: Type.STRING, 
            enum: ["Excellent", "Good", "Fair", "Poor"],
            description: "General health classification"
          },
          observations: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Visual findings from the tongue"
          },
          recommendations: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Actionable medical/health advice"
          },
          description: { 
            type: Type.STRING, 
            description: "A short summary of the findings" 
          }
        },
        required: ["hemoglobinEstimate", "healthStatus", "observations", "recommendations", "description"]
      }
    }
  });

  // Extract text from the response object
  const resultText = response.text;
  if (!resultText) {
    throw new Error("AI could not generate a report. Please try again.");
  }
  
  try {
    const parsed = JSON.parse(resultText);
    return { 
      ...parsed, 
      timestamp: Date.now() 
    };
  } catch (error) {
    console.error("JSON Parse Error:", resultText);
    throw new Error("Analysis failed to parse. Please try again.");
  }
};
