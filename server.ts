import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  const apiKey = process.env.GEMINI_API_KEY || "AIzaSyDPTK_F6FxOGsQzkFz_tzbHg8zAIYrzwtg";
  const ai = new GoogleGenAI({ apiKey });

  // API routes
  app.post("/api/analyze-image", async (req, res) => {
    try {
      const { image, location, activeLenses } = req.body;
      const prompt = `Identify this historical landmark from the image. Current GPS: ${location?.lat}, ${location?.lng}. ${activeLenses ? `The user is currently interested in these historical eras: ${activeLenses}.` : ''} Provide a detailed historical chronicle (max 1500 characters).`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ 
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: image.split(',')[1] } }, 
            { text: prompt }
          ] 
        }],
        config: { 
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              date: { type: Type.STRING },
              category: { type: Type.STRING },
              history: { type: Type.STRING },
              coordinates: {
                type: Type.OBJECT,
                properties: { lat: { type: Type.NUMBER }, lng: { type: Type.NUMBER } },
                required: ["lat", "lng"]
              }
            },
            required: ["name", "date", "category", "history", "coordinates"]
          }
        }
      });
      
      res.json(JSON.parse(response.text));
    } catch (error: any) {
      console.error("Analyze Image Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/analyze-landmark", async (req, res) => {
    try {
      const { name, lat, lng, activeLenses } = req.body;
      const prompt = `Provide a brief historical chronicle (1 paragraph, max 1500 characters), category, and estimated date for the landmark: ${name} at ${lat}, ${lng}. ${activeLenses ? `The user is currently focused on these historical eras/types: ${activeLenses}.` : ''} Ensure the history is accurate and engaging.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ text: prompt }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              history: { type: Type.STRING },
              category: { type: Type.STRING },
              date: { type: Type.STRING }
            },
            required: ["history", "category", "date"]
          }
        }
      });
      
      res.json(JSON.parse(response.text));
    } catch (error: any) {
      console.error("Analyze Landmark Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
