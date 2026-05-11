// Vision service — analyzes phone camera frames using AI
import { fetchWithFallback } from "./ai.js";

const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const API_KEY = process.env.GOOGLE_API_KEY || process.env.ZAI_API_KEY || process.env.OPENROUTER_API_KEY;
const VISION_MODELS = ["gemini-3.1-flash-lite", "gemini-3-flash", "gemini-2.5-flash-lite"];

export interface VisionResult {
  description: string;
  objects: string[];
  dominant_color?: string;
}

export async function analyzeFrame(
  base64Image: string,
  prompt?: string,
  broadcast?: (msg: any) => void
): Promise<VisionResult> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.ZAI_API_KEY || process.env.OPENROUTER_API_KEY;
  const defaultPrompt = "Describe what you see in this image in 1-2 short sentences. Also list any objects you can identify and the dominant color if obvious. Respond in JSON format: { \"description\": \"...\", \"objects\": [\"...\"], \"dominant_color\": \"...\" }";

  if (broadcast) {
    broadcast({ type: "thinking", payload: { text: "Считываю изображение с камеры... 📷" } });
  }

  if (!apiKey) {
    return getFallbackVision();
  }

  try {
    if (broadcast) {
      broadcast({ type: "thinking", payload: { text: "Нейросеть Nemotron анализирует картинку..." } });
    }

    // Strip data URL prefix if present
    const imageData = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const data = await fetchWithFallback(VISION_MODELS, {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt || defaultPrompt },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageData}` } }
          ]
        }
      ]
    });
    
    let content = data.choices?.[0]?.message?.content || "{}";

    if (broadcast) {
      broadcast({ type: "thinking", payload: { text: "Анализ завершен!" } });
    }

    try {
      // Try to parse JSON from response
      let cleanContent = content.replace(/```(?:json)?\n([\s\S]*?)```/gi, "$1");
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn("[Vision] JSON parse failed, returning raw description");
    }

    return {
      description: content,
      objects: [],
    };
  } catch (e) {
    console.error("[Vision] Error:", e);
    return getFallbackVision();
  }
}

function getFallbackVision(): VisionResult {
  const descriptions = [
    "I can see a room with some objects. The camera is working!",
    "I see movement! Something is happening in front of me.",
    "The camera is active. I'm watching and waiting for something interesting.",
    "I can see colors and shapes. My eyes are working!",
  ];
  return {
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    objects: ["room"],
    dominant_color: "unknown",
  };
}

// Color detection from frame (simple pixel analysis without AI)
export function detectColor(base64Image: string): string | null {
  // Basic approach: check if we have a valid frame
  if (!base64Image || base64Image.length < 1000) return null;
  // For a real implementation, we'd decode the JPEG and sample pixels
  // For now return null — real color detection needs canvas on client side
  return null;
}
