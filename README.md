<div align="center">
<img src="/public/assets/Gemini_Generated_Image_c5ckz3c5ckz3c5ck.png" alt="MatchDay — AI Game Day Companion" width="100%" style="border-radius: 12px; margin-bottom: 24px;" />
# MatchDay — AI Game Day Companion
 
**From ticket scan to final whistle. Your personal AI concierge for large-scale sporting venues.**
 
[![Live Demo](https://img.shields.io/badge/Live%20Demo-matchday.vercel.app-black?style=for-the-badge&logo=vercel)](https://matchday.vercel.app)
[![Built for PromptWars](https://img.shields.io/badge/PromptWars-Virtual%20Round-f5c518?style=for-the-badge)](https://promptwars.in)
[![Powered by Gemini](https://img.shields.io/badge/Gemini-1.5%20Pro%20%2B%20Flash-4285F4?style=for-the-badge&logo=google)](https://aistudio.google.com)
[![Google Maps](https://img.shields.io/badge/Google%20Maps-Platform-34A853?style=for-the-badge&logo=google-maps)](https://developers.google.com/maps)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
 
---
 
*Built for PromptWars Virtual by Hack2Skill × Google for Developers*  
*Problem Statement: Improve the physical event experience at large-scale sporting venues*
 
</div>
---
 
## The Problem
 
Going to a cricket match at Wankhede or Eden Gardens should be one of the best experiences of your life. Instead, it's often defined by:
 
- Standing in the wrong queue for 20 minutes before finding your gate
- Not knowing which food court has a 2-minute wait vs. a 15-minute wait  
- Missing the first over because you misjudged travel time from home
- Getting trapped in a post-match crowd surge because you exited at the wrong time through the wrong gate
- Having no single source of truth for your seat, your plan, and your surroundings
**MatchDay solves all of this.** It is the first AI-native match day companion that accumulates full context about *your* day — your ticket, your seat, your preferences, your travel — and delivers real-time, personalised intelligence from the moment you leave home to the moment you beat the post-match crowd out of the stadium.
 
---
 
## What Makes MatchDay Different
 
Most venue apps are information portals. MatchDay is a **stateful AI concierge**. Every Gemini call is grounded in your full context — seat, gate, stand, food preference, travel mode, current match phase, and live crowd data. The AI doesn't give generic answers. It knows you.
 
| Feature | Generic Venue App | MatchDay |
|---|---|---|
| Ticket information | Manual entry | Gemini Vision OCR — any format |
| Travel planning | Static directions | AI-reasoned leave-by time with crowd pattern logic |
| Venue navigation | Static map | Personalised to your seat and real-time crowd phase |
| Food recommendations | List of stalls | Filtered by your dietary preference + current wait time |
| Crowd intelligence | None | AI-estimated density per zone, updated per match phase |
| Exit planning | None | Score-aware, gate-specific exit strategy |
| In-match assistance | None | Multi-turn stateful AI chat with full game-day context |
| Language support | English only | English, हिन्दी, मराठी, বাংলা, ગુજરાતી |
 
---
 
## Core Features
 
### 🎟 AI Ticket Scan — Gemini 1.5 Pro Vision
Upload any match ticket — printed, digital, PDF, photo of a printout. Gemini's multimodal vision model extracts every piece of structured information in under 3 seconds: match, teams, venue, date, kickoff time, stand, section, seat number, and gate. No manual entry. No form fields. Just drop your ticket and go.
 
### 🗺 Smart Travel Planning — Gemini 1.5 Flash
Tell MatchDay where you're coming from. Gemini reasons over your kickoff time, historical crowd arrival patterns, gate timing, and your transport mode to generate a personalised leave-by time with full rationale — not just a Google Maps ETA, but an AI-reasoned recommendation that accounts for queue time at your specific gate.
 
### 🏟 Venue Intelligence — Google Maps Platform
An interactive venue map built on `@vis.gl/react-google-maps` renders your specific gate, the nearest food stalls matching your dietary preference, restrooms, medical points, and ATMs — all with walking distances calculated from your actual seat location. Filter by facility type. See facilities ranked by proximity to you, not the centre of the stadium.
 
### 👥 Crowd Pulse — AI Crowd Intelligence Engine
The centrepiece of MatchDay's real-time capability. Gemini analyses crowd density across 5 venue zones — Entry Gates, Food Court A, Food Court B, Restrooms, and Exit Gates — and returns structured JSON with crowd level (LOW / MEDIUM / HIGH), estimated wait time, and a personalised recommendation for each zone. Estimates are calibrated to your match phase (pre-match, live, post-match) and gate location. Results are cached with a 15-minute TTL to avoid redundant API calls.
 
### 📋 AI Game Day Plan — Structured Timeline Generation
Gemini generates a complete structured timeline for your day — from "leave home" to "post-match exit" — as a sequence of typed plan items (travel, arrive, food, seat, event, break), each with a time, title, description, and AI reasoning. The plan is not a static template. It is generated fresh from everything Gemini knows about you: your seat, preferences, travel mode, kickoff time, and venue facilities.
 
### 🔄 Match-Aware Plan Updates
The plan is not static once generated. Tell the AI concierge what changed — "we're losing badly, I want to leave at 80 minutes", "my kid needs food now", "it's raining, I need a covered route" — and Gemini regenerates the timeline from that point forward, adapting to your new reality. The response parser detects `updatedPlan` JSON within the chat response and silently updates the Zustand store.
 
### 🚪 Smart Exit Planner
A dedicated exit strategy feature built on a separate Gemini API route. Inputs: current match minute, score, your stand and gate, transport mode. Output: a structured exit plan with leave-by time, recommended gate, estimated crowd level at that gate, specific walking route with landmarks, and two backup gate options with reasoning. The AI factors in the match state — blowout games see earlier fan departures, affecting crowd patterns at exit gates.
 
### 💬 Multi-Turn AI Concierge — Stateful Chat
The `venue-chat` route is the most sophisticated Gemini integration in MatchDay. Every chat message is sent with a full system context injection containing: ticket data, user preferences, venue facilities, the current plan, match phase, and live crowd data. The AI maintains genuine conversational memory across turns and can answer anything from "which food court is least busy right now?" to "what's the fastest route from my seat to Gate 6 if I leave at minute 75?". History is trimmed to the last 20 messages to manage token budget across long sessions.
 
### 🌐 Indian Language Support
MatchDay supports 5 languages — English, Hindi (हिन्दी), Marathi (मराठी), Bengali (বাংলা), and Gujarati (ગુજરાતી). UI strings are served from static JSON translation files generated by Gemini and swapped client-side via a language selector in the Zustand store. The AI concierge responds in the user's selected language — the system prompt instructs Gemini to match the fan's language in every response.
 
---
 
## Architecture
 
```
┌─────────────────────────────────────────────────────────────────┐
│                        MatchDay Client                          │
│                    Next.js 14 App Router                        │
│                                                                 │
│  ┌──────────┐  ┌────────────┐  ┌───────────┐  ┌────────────┐  │
│  │ Landing  │  │  Ticket    │  │Onboarding │  │  Travel    │  │
│  │  Page    │→ │  Upload    │→ │  Wizard   │→ │  Screen    │  │
│  └──────────┘  └────────────┘  └───────────┘  └────────────┘  │
│                                                       ↓         │
│  ┌──────────┐  ┌────────────┐  ┌───────────┐  ┌────────────┐  │
│  │  Exit    │  │    Plan    │  │   Venue   │  │  Venue     │  │
│  │ Planner  │  │  Screen   │  │  Screen   │←  │    Map     │  │
│  └──────────┘  └─────┬──────┘  └─────┬─────┘  └────────────┘  │
│                      │               │                          │
│              ┌───────┴───────────────┴──────┐                  │
│              │       Zustand Store           │                  │
│              │  (Full game-day state, TTL    │                  │
│              │   session, crowd cache,       │                  │
│              │   plan, chat history)         │                  │
│              └───────────────────────────────┘                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ API Route Handlers
        ┌──────────────────┼──────────────────────┐
        │                  │                       │
        ▼                  ▼                       ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────────────┐
│extract-ticket│  │  crowd-          │  │    venue-chat        │
│travel-plan   │  │  intelligence    │  │  (stateful, multi-   │
│plan-generate │  │  exit-plan       │  │   turn, full context │
│              │  │                  │  │   injection)         │
└──────┬───────┘  └────────┬─────────┘  └──────────┬───────────┘
       │                   │                        │
       └───────────────────┼────────────────────────┘
                           ▼
              ┌────────────────────────┐
              │      Gemini API        │
              │  1.5 Pro  (OCR)        │
              │  1.5 Flash (all else)  │
              └────────────────────────┘
```
 
**5-Stage User Flow:**
`landing` → `upload` → `onboarding` → `travel` → `venue` → `plan` (+ live concierge)
 
Each stage gate-keeps the next — you cannot reach the venue map without a scanned ticket and completed preferences. This ensures every Gemini call in `venue-chat` has complete context.
 
---
 
## Tech Stack
 
| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | API routes + React in one deploy, zero backend infra |
| AI — Vision | Gemini 1.5 Pro | Best-in-class multimodal for ticket OCR |
| AI — Reasoning | Gemini 1.5 Flash | Fast, cheap, structured JSON output for all reasoning tasks |
| Maps | `@vis.gl/react-google-maps` | React-native Google Maps with route rendering and custom markers |
| State | Zustand + `persist` middleware | Cross-stage state with localStorage persistence, TTL sessions, crowd cache |
| Animation | Framer Motion | Scroll-driven video hero, stage transitions, staggered reveals |
| Styling | Tailwind CSS | Design token system, dark theme, glass utilities |
| Deploy | Vercel | Zero-config Next.js deployment, edge functions |
| Fonts | Bebas Neue + DM Sans | Display weight contrast — sports-premium aesthetic |
 
---
 
## Gemini Integration — Prompt Library
 
MatchDay has 5 distinct Gemini integrations, each with production-quality prompt engineering.
 
### 1. `TICKET_EXTRACTION_PROMPT` — `app/api/extract-ticket/route.ts`
Multimodal OCR using Gemini 1.5 Pro. Accepts base64-encoded image or PDF. Returns structured JSON with 10 fields. Uses `response_mime_type: "application/json"` for guaranteed structured output.
 
```
Extract all information from this match ticket image and return a JSON object with:
match, teams, venue, venueAddress, date, kickoffTime, stand, gate, seat, section, rawText.
If any field is not visible on the ticket, return null for that field.
Return ONLY valid JSON — no explanation, no markdown.
```
 
### 2. `TRAVEL_PLAN_PROMPT` — `app/api/travel-plan/route.ts`
Timing-aware travel reasoning. Gemini receives kickoff time, user location, transport mode, and reasons about crowd arrival patterns at the specific gate to produce a leave-by recommendation with full rationale and step-by-step directions.
 
### 3. `CROWD_PROMPT` — `app/api/crowd-intelligence/route.ts`
Phase-calibrated crowd density estimation. Gemini receives match phase, gate, stand, and section, and returns a 5-zone crowd analysis array. Each zone includes crowd level, estimated wait time, and a personalised recommendation referencing the user's actual gate.
 
### 4. `EXIT_PLAN_PROMPT` — `app/api/exit-plan/route.ts`
Score-aware exit strategy generation. Gemini factors in match minute, current score, transport mode, and stand location to produce a structured exit plan with primary gate, route description, crowd estimate, and two backup options.
 
### 5. `SYSTEM_CONTEXT` — `app/api/venue-chat/route.ts`
The most sophisticated prompt in the codebase. Every chat turn injects:
- Full ticket data (seat, gate, stand, section, kickoff)
- User preferences (food, transport, priorities, accessibility, location)
- All venue facilities (food stalls, gates, restrooms, medical points)
- Current game day plan (full timeline)
- Match phase
- Live crowd intelligence data (all 5 zones with current levels)
- A conditional `planUpdate` flag that triggers structured plan regeneration
The model is instructed to return `{"updatedPlan": [...]}` JSON inline when the user requests plan changes — the route extracts this, strips it from the display text, and silently updates the Zustand store.
 
---
 
## State Management — Zustand Store Design
 
`lib/store.ts` is the backbone of MatchDay's stateful architecture. Key design decisions:
 
**Session TTL:** Sessions expire after 48 hours. On rehydration, `onRehydrateStorage` checks `sessionCreatedAt` and resets state if expired — preventing stale ticket data from a previous match day.
 
**Crowd Cache:** Crowd intelligence results are cached per match phase with a 15-minute TTL via `getCrowdCache(phase)`. Switching between Pre-match / Live / Post-match tabs hits the cache on the second visit — only the first request per phase per session costs an API call.
 
**Session Archive:** On `reset()`, the current session is archived to `savedSessions[]` (capped at 5) in localStorage. Future enhancement: a "previous match days" history view.
 
**Preference Cascading:** `setPreferences()` implements smart invalidation — changing location or travel mode clears `travelOptions` and `plan`, since they're now stale. Changing food preference only clears `plan`.
 
**Partialize:** Only serialisable state is persisted to localStorage — action functions are excluded, preventing JSON serialisation errors.
 
---
 
## Google Antigravity — Build Process
 
MatchDay was built with Google Antigravity as the primary scaffolding tool for the 14-day PromptWars cycle.
 
Antigravity was used to:
- Scaffold the initial Next.js project structure (folder layout, `package.json`, Tailwind config, `.env.local.example`)
- Generate the 5 API route handlers from prompt specifications
- Build the `VenueMap` component with `@vis.gl/react-google-maps` route rendering and marker clustering
- Implement the `CrowdPulse` component with phase selector, cache logic, and animated zone cards
- Generate the `ExitPlanner` component and its form state
- Build the `StadiumChat` multi-turn chat UI with quick-prompt chips
- Scaffold the `LandingPage` component with scroll-driven video hero using Framer Motion
Manual implementation covered: Zustand store architecture (TTL logic, crowd cache, session archiving, preference cascade invalidation), all Gemini system prompts and prompt engineering, the `parseGeminiJSON` utility with error recovery, Google Maps API configuration and route rendering logic, and Indian language translation files.
 
---
 
## Project Structure
 
```
matchday/
├── app/
│   ├── layout.tsx              # Google Maps APIProvider, fonts, dark theme
│   ├── page.tsx                # Stage orchestrator — 6 stages, animated transitions
│   ├── globals.css             # Design tokens, glass utility, glow effects, i18n font loading
│   └── api/
│       ├── extract-ticket/     # POST — Gemini Pro multimodal OCR → structured JSON
│       ├── travel-plan/        # POST — Gemini Flash timing-aware travel reasoning
│       ├── plan-generate/      # POST — Gemini Flash full timeline generation
│       ├── crowd-intelligence/ # POST — Gemini Flash phase-calibrated zone density
│       ├── exit-plan/          # POST — Gemini Flash score-aware exit strategy
│       └── venue-chat/         # POST — Multi-turn stateful concierge with context injection
│
├── components/
│   ├── landing/LandingPage     # Scroll-driven video hero, feature cards, how-it-works
│   ├── ticket/TicketUpload     # Drag/drop + Gemini scan animation
│   ├── onboarding/             # 5-step preferences wizard with Places Autocomplete
│   ├── travel/TravelScreen     # Gemini travel options + live route map
│   ├── venue/VenueScreen       # Facility cards + venue map with crowd overlay
│   ├── crowd/CrowdPulse        # AI crowd intelligence — phase selector + zone cards
│   ├── plan/PlanScreen         # Timeline + floating AI chat drawer
│   ├── plan/ExitPlanner        # Score-aware exit strategy generator
│   ├── maps/VenueMap           # Reusable map — route rendering, facility markers, filters
│   └── chat/StadiumChat        # Multi-turn chat with quick prompts and plan update detection
│
├── lib/
│   ├── store.ts                # Zustand store — full game-day state, TTL, crowd cache
│   ├── gemini.ts               # Flash + Pro clients, JSON parser, image builder
│   └── i18n/
│       ├── translations.json   # Static translations: EN, HI, MR, BN, GU
│       └── useTranslation.ts   # useT() hook — reads language from store
│
└── data/
    └── venues.ts               # Static venue data — Wankhede, Eden Gardens (VenueInfo schema)
```
 
---
 
## Local Setup
 
```bash
# 1. Clone and install
git clone https://github.com/SawhneySatvik/MatchDay.git
cd MatchDay
npm install
 
# 2. Configure environment
cp .env.local.example .env.local
# Add your keys (see below)
 
# 3. Run
npm run dev
# → http://localhost:3000
```
 
### Environment Variables
 
```env
# Gemini API Key — get from https://aistudio.google.com
GEMINI_API_KEY=your_gemini_api_key_here
 
# Google Maps API Key — get from https://console.cloud.google.com
# Enable: Maps JavaScript API, Places API, Routes API, Geocoding API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_api_key_here
```
 
**Required Google Cloud APIs:**
- Maps JavaScript API
- Places API (New)
- Routes API
- Geocoding API
---
 
## Deploy to Vercel
 
```bash
# One-command deploy
npx vercel deploy
 
# Set environment variables in Vercel dashboard:
# Settings → Environment Variables → Add:
# GEMINI_API_KEY
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```
 
MatchDay is a pure Next.js deployment — no separate backend, no Docker, no database. Everything runs on Vercel's edge network.
 
---
 
## How MatchDay Addresses the Problem Statement
 
The PS required solutions for: crowd movement, waiting times, real-time coordination, and seamless experience. Here's the direct mapping:
 
| PS Requirement | MatchDay Feature | Implementation |
|---|---|---|
| **Crowd movement** | Crowd Pulse zone density | Gemini estimates crowd level per zone, calibrated to match phase and user's gate proximity |
| **Waiting times** | Crowd Pulse wait estimates | Structured wait time per zone (LOW ~2 min, MEDIUM ~8 min, HIGH ~15 min) with routing advice |
| **Real-time coordination** | Match-aware plan updates | User reports changing conditions to the concierge; Gemini regenerates the plan in real time |
| **Seamless experience** | 5-stage guided flow | Ticket → Preferences → Travel → Venue → Plan — each stage feeds context into the next |
| **Enjoyable experience** | Personalised AI concierge | Every response references the user's actual seat, gate, preferences, and current situation |
| **Post-match safety** | Exit Planner | Score-aware, gate-specific exit strategy reduces post-match crowd surge risk |
 
---
 
## Supported Venues
 
MatchDay ships with built-in venue data for:
 
| Venue | City | Capacity |
|---|---|---|
| Wankhede Stadium | Mumbai | 33,108 |
| Eden Gardens | Kolkata | 66,349 |
 
**Adding a venue:** Add an entry to `data/venues.ts` following the `VenueInfo` schema. The venue name extracted from the ticket by Gemini is fuzzy-matched against keys in this object. Venues not in the database degrade gracefully — the concierge still functions with full ticket context, only the static facility map is unavailable.
 
---
 
## Indian Language Support
 
MatchDay is built for Indian fans at Indian venues. The UI is fully localised in:
 
| Language | Script | Code | Primary Venues |
|---|---|---|---|
| English | Latin | `en` | All |
| Hindi | देवनागरी | `hi` | All India |
| Marathi | देवनागरी | `mr` | Wankhede, Mumbai |
| Bengali | বাংলা | `bn` | Eden Gardens, Kolkata |
| Gujarati | ગુજરાતી | `gu` | Narendra Modi Stadium |
 
Translations are static JSON files generated by Gemini — zero runtime cost, zero extra API calls. The AI concierge responds in the user's selected language automatically via a system prompt instruction.
 
---

## About
 
Built by **Satvik Sawhney** for PromptWars Virtual — Round 4 (April 2026).
 
- Final-year B.Tech CS (AI/ML) at SRM University + BS Data Science at IIT Madras
- Software Engineering Intern at Juspay
- [LinkedIn](https://linkedin.com/in/satviksawhney) · [GitHub](https://github.com/SawhneySatvik) · [X](https://x.com/satviksawhney)
---
 
<div align="center">
**Built with Gemini AI · Google Maps Platform · Next.js 14 · PromptWars Virtual**
 
*MatchDay — Because your match day deserves better than a printed PDF and a wrong queue.*
 
</div>