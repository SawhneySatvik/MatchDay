// app/api/plan-generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getJsonFlashModel, parseGeminiJSON } from "@/lib/gemini";
import { PlanItem } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: "prompt required" }, { status: 400 });

    const model = getJsonFlashModel();
    const result = await model.generateContent(prompt);
    
    console.log("[plan-generate] Sending prompt to Gemini");
    const text = result.response.text();
    const plan = parseGeminiJSON<PlanItem[]>(text, "plan-generate");

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("[plan-generate] Error:", error);
    return NextResponse.json({ error: "Failed to generate plan." }, { status: 500 });
  }
}

// TODO(01:12): Create plan generation API from ticket data