import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

export const getAI = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured. Please add it to your environment variables.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
};

export const GEN_MODEL = "gemini-3-flash-preview";
