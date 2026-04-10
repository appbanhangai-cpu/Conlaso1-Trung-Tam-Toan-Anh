import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log("Starting server...");
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Lazy AI getter
  const getAIModel = () => {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured on the server.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) as any;
    return ai.getGenerativeModel({ model: "gemini-3-flash-preview" });
  };

  // API Routes
  app.post("/api/chat", async (req, res) => {
    console.log("POST /api/chat");
    try {
      const { messages, systemInstruction } = req.body;
      const model = getAIModel();
      
      const result = await model.generateContent({
        contents: messages.map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        })),
        systemInstruction: systemInstruction
      });

      res.json({ text: result.response.text() });
    } catch (error: any) {
      console.error("Chat API Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/enhance", async (req, res) => {
    console.log("POST /api/enhance");
    try {
      const { prompt } = req.body;
      const model = getAIModel();
      const result = await model.generateContent(prompt);
      res.json({ text: result.response.text() });
    } catch (error: any) {
      console.error("Enhance API Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sentiment", async (req, res) => {
    console.log("POST /api/sentiment");
    try {
      const { prompt } = req.body;
      const model = getAIModel();
      const result = await model.generateContent(prompt);
      res.json({ text: result.response.text() });
    } catch (error: any) {
      console.error("Sentiment API Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Initializing Vite in middleware mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware attached.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
