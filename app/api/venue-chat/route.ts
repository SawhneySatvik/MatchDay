// app/api/venue-chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getFlashModel, parseGeminiJSON } from "@/lib/gemini";
import { ChatMessage, TicketData, UserPreferences, VenueInfo, PlanItem } from "@/lib/store";

// SAVE TO PROMPT LIBRARY
const SYSTEM_CONTEXT = (
  ticket: TicketData,
  preferences: UserPreferences,
  venueInfo: VenueInfo | null,
  plan: PlanItem[]
) => `You are MatchDay AI — a personal game-day concierge. You know everything about this fan's day.

FAN CONTEXT:
- Match: ${ticket.match}
- Venue: ${ticket.venue}
- Seat: ${ticket.stand}, ${ticket.section}, Seat ${ticket.seat}
- Gate: ${ticket.gate}
- Kickoff: ${ticket.kickoffTime} on ${ticket.date}
- Food Preference: ${preferences.foodPreference}
- Priorities: ${preferences.priorities.join(", ")}
- Do Not Miss: ${preferences.doNotMiss.join(", ") || "Nothing specified"}
- Accessibility Needs: ${preferences.accessibilityNeeds ? "Yes" : "No"}

VENUE FACILITIES:
${venueInfo ? JSON.stringify(venueInfo, null, 2) : "Venue data loading..."}

CURRENT GAME DAY PLAN:
${plan.length > 0 ? plan.map((p) => `${p.time}: ${p.title}`).join("\n") : "Plan not yet generated"}

RULES:
- Give specific, actionable advice referencing the fan's actual seat and preferences
- For food recommendations, always respect their ${preferences.foodPreference} preference
- When updating the plan, return a JSON block: {"updatedPlan": [...]} 
- Keep responses concise and friendly — this is a mobile interface
- Reference specific stalls/gates by name, not generically
- If asked about timing, always reason based on the kickoff time`;

export async function POST(req: NextRequest) {
  try {
    const { message, history, ticket, preferences, venueInfo, plan } =
      await req.json();

    const model = getFlashModel();
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: SYSTEM_CONTEXT(ticket, preferences, venueInfo, plan) }],
        },
        {
          role: "model",
          parts: [
            {
              text: "Got it. I know your seat, your preferences, and your plan. Ask me anything about today!",
            },
          ],
        },
        // Inject prior conversation history
        ...history.map((msg: ChatMessage) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        })),
      ],
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    // Check if response contains a plan update
    let updatedPlan: PlanItem[] | null = null;
    if (responseText.includes('"updatedPlan"')) {
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*"updatedPlan"[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = parseGeminiJSON<{ updatedPlan: PlanItem[] }>(jsonMatch[0], "venue-chat");
          updatedPlan = parsed.updatedPlan;
        }
      } catch {
        // Plan update parse failed — ignore, return text as-is
      }
    }

    // Strip JSON from display text
    const displayText = responseText
      .replace(/\{[\s\S]*"updatedPlan"[\s\S]*\}/g, "")
      .trim();

    return NextResponse.json({ response: displayText, updatedPlan });
  } catch (error) {
    console.error("[venue-chat] Error:", error);
    return NextResponse.json(
      { error: "Failed to get response." },
      { status: 500 }
    );
  }
}

// TODO(01:12): Add conversational API for venue-related queries
// TODO(01:12): Improve contextual responses for real-time stadium queries