// lib/gemini.ts
import { GoogleGenerativeAI, GenerativeModel, Part } from "@google/generative-ai";
import JSON5 from "json5";

let genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export function getFlashModel(): GenerativeModel {
  return getClient().getGenerativeModel({
    model: "gemma-4-31b-it",
    generationConfig: {
      temperature: 0.3,
      topP: 0.8,
    },
  });
}

export function getJsonFlashModel(): GenerativeModel {
  return getClient().getGenerativeModel({
    model: "gemma-4-31b-it",
    generationConfig: {
      temperature: 0.3,
      topP: 0.8,
      responseMimeType: "application/json",
    },
  });
}

export function getProModel(): GenerativeModel {
  return getClient().getGenerativeModel({
    model: "gemma-4-31b-it",
    generationConfig: {
      temperature: 0.4,
      topP: 0.85,
    },
  });
}

export function getJsonProModel(): GenerativeModel {
  return getClient().getGenerativeModel({
    model: "gemma-4-31b-it",
    generationConfig: {
      temperature: 0.4,
      topP: 0.85,
      responseMimeType: "application/json",
    },
  });
}

export function parseGeminiJSON<T>(text: string, contextName: string = "gemini"): T {
  // 1. Try extracting an explicitly labeled markdown block
  const mdMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/i);
  const coreText = mdMatch ? mdMatch[1] : text;

  // 2. Sliding window parse: hunt for the true JSON payload
  // If the model output conversational filler, the first '{' or '[' might be 
  // inside the filler text itself, throwing off a simple regex match.
  const startChars = ['{', '['];
  for (let i = 0; i < coreText.length; i++) {
    const char = coreText[i];
    if (startChars.includes(char)) {
      const endChar = char === '{' ? '}' : ']';
      const lastIndex = coreText.lastIndexOf(endChar);
      
      if (lastIndex > i) {
        const slice = coreText.substring(i, lastIndex + 1);
        try {
          const parsed = JSON5.parse(slice);
          console.log(`[${contextName}] Cleaned json payload:`, slice);
          return parsed as T;
        } catch (err) {
          // Invalid chunk (e.g. grabbed an opening bracket from conversational text 
          // all the way to a closing bracket from the actual JSON block). 
          // Ignore and keep hunting!
        }
      }
    }
  }

  // 3. Complete failure
  console.error(`[${contextName}] JSON parsing completely failed! Text was:`, text);
  throw new Error(`[${contextName}] Could not extract parseable JSON from response.`);
}

// Build image part for multimodal calls
export function buildImagePart(base64Data: string, mimeType: string): Part {
  return {
    inlineData: {
      data: base64Data,
      mimeType: mimeType as "image/jpeg" | "image/png" | "image/webp",
    },
  };
}

// TODO(01:12): Integrate Gemini API client for AI-powered workflows