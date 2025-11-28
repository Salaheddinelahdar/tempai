import { GoogleGenAI, Type } from "@google/genai";
import { WeatherData, AISuggestion } from '../types';

export const generateSuggestions = async (weather: WeatherData, style: string, language: string): Promise<AISuggestion> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      // Mock response if no key is present to prevent app crash in demo without env setup
      return {
        outfit: "Demo Mode: Add API_KEY to env. Wear a light jacket.",
        activities: "Go for a walk.",
        summary: "Weather is pleasant."
      };
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      You are a helpful style and lifestyle assistant.
      The current weather in ${weather.location.city} is:
      - Temperature: ${weather.current.temp}°C
      - Feels Like: ${weather.current.feelsLike}°C
      - Condition: ${weather.current.description}
      - Wind: ${weather.current.windSpeed} km/h
      - Chance of rain: ${weather.daily[0]?.pop || 0}%

      User preference style: ${style}.
      Language: ${language}.

      Provide a JSON response with:
      1. outfit: A short outfit suggestion.
      2. activities: 1-2 recommended activities.
      3. summary: A very brief weather summary (1 sentence).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            outfit: { type: Type.STRING },
            activities: { type: Type.STRING },
            summary: { type: Type.STRING },
          },
          required: ["outfit", "activities", "summary"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");
    
    return JSON.parse(text) as AISuggestion;

  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
