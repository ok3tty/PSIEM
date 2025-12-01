// server.js  (ES module style)

import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Test GET route so we can see if server is actually running
app.get("/api/chat", (req, res) => {
  console.log("➡️  GET /api/chat hit");
  res.json({ status: "ok", message: "GET /api/chat is working" });
});

// Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/api/chat", async (req, res) => {
  console.log("➡️  POST /api/chat body:", req.body);

  const { message } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: "Missing message" });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(message);
    const text = result.response.text();
    console.log("✅ Gemini reply:", text.slice(0, 80), "...");

    res.json({ reply: text });
  } catch (err) {
    console.error("❌ Gemini error:", err);
    res.status(500).json({ error: "Gemini API error" });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Gemini server running at http://localhost:${PORT}`);
});
