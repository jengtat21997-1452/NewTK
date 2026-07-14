import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 images
  app.use(express.json({ limit: "50mb" }));

  // Initialize Gemini
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Route for predicting item name from image
  app.post("/api/predict-item-name", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      
      if (!imageBase64) {
        return res.status(400).json({ error: "No image provided" });
      }

      // Remove the data URI prefix if present (e.g. data:image/jpeg;base64,)
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      let response;
      let retries = 2;
      while (retries >= 0) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
              "What is the name of the main object in this image? Provide a short, concise name in Thai. Do not include any explanations, just the name itself (e.g., 'เมาส์', 'คีย์บอร์ด', 'สายชาร์จ', 'จอภาพ'). If you don't know, just return 'ไม่ทราบชื่อ'",
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: base64Data,
                }
              }
            ],
            config: {
                temperature: 0.2,
            }
          });
          break; // success
        } catch (error: any) {
          if (retries === 0 || error?.status !== 503) {
            throw error;
          }
          console.log(`Gemini API 503 error. Retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          retries--;
        }
      }

      res.json({ name: response?.text?.trim() || "" });
    } catch (error: any) {
      console.error("Gemini API Error:", error?.message || error);
      // Return empty string gracefully so the form doesn't break, 
      // but return 200 OK so the frontend can still use the image.
      res.json({ name: "" });
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
