// app/api/crowd-intelligence/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getJsonFlashModel, parseGeminiJSON } from "@/lib/gemini";
import { CrowdZone } from "@/lib/store";

const CROWD_PROMPT = (
  venue: string,
  gate: string,
  stand: string,
  section: string,
  kickoffTime: string,
  matchPhase: string,
  venueZones: string
) => `You are a crowd intelligence system for large sporting venues in India. Estimate crowd density across venue zones based on historical patterns and event context.

VENUE: ${venue}
USER GATE: ${gate}
USER STAND: ${stand}
USER SECTION: ${section}
KICKOFF TIME: ${kickoffTime}
CURRENT PHASE: ${matchPhase}

VENUE ZONES TO ANALYZE:
${venueZones}

Based on the match phase, estimate crowd levels for each zone:

PRE-MATCH PATTERNS:
- Entry gates see HIGH crowd 60-90 min before kickoff, tapering off 30 min before
- Food courts see MEDIUM crowd as fans arrive early to eat
- Restrooms see LOW crowd pre-match
- Exit gates see LOW crowd

DURING MATCH PATTERNS:
- Entry gates see LOW crowd (most fans seated)
- Food courts see HIGH crowd at halftime, LOW during play
- Restrooms see HIGH crowd at halftime
- Exit gates see LOW crowd

POST-MATCH PATTERNS:
- Entry gates see LOW crowd
- Food courts see LOW crowd
- Restrooms see MEDIUM crowd
- Exit gates see HIGH crowd immediately after, tapering off after 20 min

Return ONLY a JSON array with this exact structure:
[
  {
    "zone": "Entry Gates",
    "crowdLevel": "HIGH",
    "estimatedWait": "~15 min",
    "recommendation": "Use ${gate} — it's closest to your ${stand} seat. Arrive 75+ min early to beat the rush.",
    "coords": { "lat": 0, "lng": 0 }
  }
]

Rules:
- Always include exactly 5 zones: Entry Gates, Food Court A, Food Court B, Restrooms, Exit Gates  
- estimatedWait should be realistic: LOW = "~2 min", MEDIUM = "~8 min", HIGH = "~15 min"
- recommendation must be specific and actionable, referencing the user's gate/stand
- coords should be approximate positions around the venue (spread them visually)
- Return ONLY the JSON array`;

export async function POST(req: NextRequest) {
  try {
    const { venue, gate, stand, section, kickoffTime, matchPhase } =
      await req.json();

    if (!venue || !matchPhase) {
      return NextResponse.json(
        { error: "venue and matchPhase are required" },
        { status: 400 }
      );
    }

    const venueZones = [
      "Entry Gates (main entrance area)",
      "Food Court A (north side concourse)",
      "Food Court B (south side concourse)",
      "Restrooms (distributed across stands)",
      "Exit Gates (all exit points)",
    ].join("\n");

    const model = getJsonFlashModel();
    const prompt = CROWD_PROMPT(
      venue,
      gate || "Main Gate",
      stand || "General",
      section || "General",
      kickoffTime || "7:00 PM",
      matchPhase,
      venueZones
    );

    console.log("[crowd-intelligence] Generating for phase:", matchPhase);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const zones = parseGeminiJSON<CrowdZone[]>(text, "crowd-intelligence");

    return NextResponse.json({ zones });
  } catch (error) {
    console.error("[crowd-intelligence] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate crowd intelligence." },
      { status: 500 }
    );
  }
}
