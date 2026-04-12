// app/api/travel-plan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getJsonFlashModel, parseGeminiJSON } from "@/lib/gemini";
import { TravelOption } from "@/lib/store";

// SAVE TO PROMPT LIBRARY
const TRAVEL_PLAN_PROMPT = (
  venue: string,
  kickoffTime: string,
  date: string,
  userLocation: string,
  gate: string
) => `You are an experienced game-day travel advisor who knows Indian cities well.

Match Details:
- Venue: ${venue}
- Gate: ${gate}
- Date: ${date}
- Kickoff: ${kickoffTime}
- Fan Location: ${userLocation}

Generate exactly 3 travel options from the fan's location to the venue. For each option, think through:
1. Typical travel time considering time of day and day of week
2. Gates typically open 90 minutes before kickoff
3. Crowd surge usually hits 60-75 minutes before kickoff
4. Account for security queues (add 15-20 min buffer inside venue)

Return ONLY a JSON array with this exact structure:
[
  {
    "mode": "transit",
    "label": "Metro + Walk",
    "duration": "45 min",
    "leaveBy": "5:15 PM",
    "reasoning": "Metro Line X drops you 800m from the venue. Crowd surge expected at 5:45 PM — leaving at 5:15 keeps you 30 min ahead. Factor in 15 min security queue.",
    "steps": ["Take Metro Line X from [nearest station]", "Alight at [Stadium station]", "Walk 800m via [street name] to Gate ${gate}"],
    "recommended": true
  },
  {
    "mode": "driving",
    "label": "Cab / Drive",
    "duration": "35 min",
    "leaveBy": "5:00 PM",
    "reasoning": "...",
    "steps": ["..."],
    "recommended": false
  },
  {
    "mode": "walking",
    "label": "Walk / Auto",
    "duration": "20 min",
    "leaveBy": "5:30 PM",
    "reasoning": "...",
    "steps": ["..."],
    "recommended": false
  }
]

Rules:
- Mark the single best option as recommended: true
- The reasoning must explain the TIMING logic, not just directions
- Steps should be specific to the actual city/route
- Return ONLY the JSON array`;

export async function POST(req: NextRequest) {
  try {
    const { venue, kickoffTime, date, userLocation, gate } = await req.json();

    if (!venue || !kickoffTime || !userLocation) {
      return NextResponse.json(
        { error: "venue, kickoffTime, and userLocation are required" },
        { status: 400 }
      );
    }

    const model = getJsonFlashModel();
    const prompt = TRAVEL_PLAN_PROMPT(venue, kickoffTime, date, userLocation, gate);
    
    console.log("[travel-plan] Sending prompt to Gemini with venue:", venue);
    const result = await model.generateContent(prompt);
    
    const candidate = result.response.candidates?.[0];
    console.log("[travel-plan] Gemini finish reason:", candidate?.finishReason);
    
    const text = result.response.text();
    const options = parseGeminiJSON<TravelOption[]>(text, "travel-plan");

    return NextResponse.json({ options });
  } catch (error) {
    console.error("[travel-plan] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate travel plan." },
      { status: 500 }
    );
  }
}

// TODO(01:12): Implement travel planning API based on venue and timing