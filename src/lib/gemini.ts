import { GoogleGenAI } from "@google/genai";

// Initialize GoogleGenAI from the frontend as per skill requirements.
// The GEMINI_API_KEY is provided by the environment.
export const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY as string 
});

export const GEN_MODEL = "gemini-3-flash-preview";
