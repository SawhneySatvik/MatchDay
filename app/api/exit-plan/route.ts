// app/api/exit-plan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getJsonFlashModel, parseGeminiJSON } from "@/lib/gemini";
import { ExitPlan } from "@/lib/store";

const EXIT_PLAN_PROMPT = (
  venue: string,
  gate: string,
  stand: string,
  section: string,
  kickoffTime: string,
  matchMinute: string,
  score: string,
  transportMode: string
) => `You are an exit strategy planner for large sporting venues in India. Help fans leave efficiently after or during a match.

VENUE: ${venue}
USER GATE: ${gate}
USER STAND: ${stand}
USER SECTION: ${section}
KICKOFF TIME: ${kickoffTime}
CURRENT MATCH MINUTE: ${matchMinute}
CURRENT SCORE: ${score}
TRANSPORT MODE: ${transportMode}

Based on the match state, generate an optimal exit plan. Consider:
1. If the match is still ongoing (before 90th min), suggest early departure times to beat the crowd
2. Post-match crowd surge typically peaks 0-15 min after final whistle
3. Side gates and lesser-used exits have 40-60% less crowd than main gates
4. Public transport gets overwhelmed 10-20 min post-match — recommend leaving before or waiting 25+ min

Return ONLY JSON with this exact structure:
{
  "leaveByTime": "When to leave the seat (e.g. '85th minute' or '9:30 PM')",
  "recommendedGate": "Specific gate name to exit from",
  "estimatedCrowdLevel": "LOW or MEDIUM or HIGH",
  "route": "Specific walking route from seat to gate to transport, with landmarks",
  "backupOptions": [
    { "gate": "Alternative gate name", "reason": "Why this is a backup" },
    { "gate": "Second alternative", "reason": "Why this one" }
  ],
  "reasoning": "Full explanation of timing logic, crowd patterns, and why this exit strategy is optimal"
}

Rules:
- Be specific about gate names for this venue
- Reference the user's stand and section in route directions
- If leaving early (before final whistle), estimate reduced crowd
- Factor in the score — blowout games see earlier departures
- Return ONLY the JSON object`;

export async function POST(req: NextRequest) {
  try {
    const {
      venue,
      gate,
      stand,
      section,
      kickoffTime,
      matchMinute,
      score,
      transportMode,
    } = await req.json();

    if (!venue) {
      return NextResponse.json(
        { error: "venue is required" },
        { status: 400 }
      );
    }

    const model = getJsonFlashModel();
    const prompt = EXIT_PLAN_PROMPT(
      venue,
      gate || "Main Gate",
      stand || "General",
      section || "General",
      kickoffTime || "7:00 PM",
      matchMinute || "90",
      score || "Match ended",
      transportMode || "transit"
    );

    console.log("[exit-plan] Generating exit plan for:", venue);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const exitPlan = parseGeminiJSON<ExitPlan>(text, "exit-plan");

    return NextResponse.json({ exitPlan });
  } catch (error) {
    console.error("[exit-plan] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate exit plan." },
      { status: 500 }
    );
  }
}
