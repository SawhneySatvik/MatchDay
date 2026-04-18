// lib/store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Stage = "landing" | "upload" | "onboarding" | "travel" | "venue" | "plan" | "live";
export type MatchPhase = "pre-match" | "during" | "post-match";

// Session expiry: 2 days in milliseconds
const SESSION_TTL_MS = 2 * 24 * 60 * 60 * 1000;
// Crowd cache TTL: 15 minutes
const CROWD_CACHE_TTL_MS = 15 * 60 * 1000;

export interface CrowdZone {
  zone: string;
  crowdLevel: "LOW" | "MEDIUM" | "HIGH";
  estimatedWait: string;
  recommendation: string;
  coords: { lat: number; lng: number };
}

export interface CrowdCacheEntry {
  data: CrowdZone[];
  timestamp: number; // Date.now()
}

export interface ExitPlan {
  leaveByTime: string;
  recommendedGate: string;
  estimatedCrowdLevel: "LOW" | "MEDIUM" | "HIGH";
  route: string;
  backupOptions: { gate: string; reason: string }[];
  reasoning: string;
}

export interface TicketData {
  match: string;
  teams: string;
  venue: string;
  venueAddress: string;
  date: string;
  kickoffTime: string;
  stand: string;
  gate: string;
  seat: string;
  section: string;
  rawText: string;
}

export interface UserPreferences {
  location: string;
  locationCoords: { lat: number; lng: number } | null;
  travelMode: "transit" | "driving" | "walking";
  foodPreference: "veg" | "non-veg" | "both";
  priorities: ("food" | "restroom" | "merchandise" | "atmosphere")[];
  accessibilityNeeds: boolean;
  doNotMiss: string[];
}

export interface TravelOption {
  mode: string;
  label: string;
  duration: string;
  leaveBy: string;
  reasoning: string;
  steps: string[];
  recommended: boolean;
}

export interface VenueInfo {
  foodStalls: FoodStall[];
  gates: Gate[];
  restrooms: RestRoom[];
  medicalPoints: Facility[];
  atms: Facility[];
}

export interface FoodStall {
  id: string;
  name: string;
  type: "veg" | "non-veg" | "both";
  walkTime: string;
  section: string;
  speciality: string;
  coords: { lat: number; lng: number };
}

export interface Gate {
  id: string;
  name: string;
  serves: string[];
  coords: { lat: number; lng: number };
  congestionLevel: "low" | "medium" | "high";
}

export interface RestRoom {
  id: string;
  name: string;
  section: string;
  walkTime: string;
  coords: { lat: number; lng: number };
}

export interface Facility {
  id: string;
  name: string;
  section: string;
  coords: { lat: number; lng: number };
}

export interface PlanItem {
  time: string;
  title: string;
  description: string;
  type: "travel" | "arrive" | "food" | "seat" | "event" | "break";
  reasoning: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string; // ISO string for JSON serialization
}

interface MatchDayStore {
  stage: Stage;
  ticket: TicketData | null;
  preferences: UserPreferences;
  travelOptions: TravelOption[];
  selectedTravel: TravelOption | null;
  venueInfo: VenueInfo | null;
  plan: PlanItem[];
  chatHistory: ChatMessage[];
  venueCoords: { lat: number; lng: number } | null;
  crowdData: CrowdZone[] | null;
  crowdCache: Record<string, CrowdCacheEntry>;
  matchPhase: MatchPhase;
  exitPlan: ExitPlan | null;
  savedSessions: Partial<MatchDayStore>[];
  sessionCreatedAt: number | null; // Date.now() when session started

  // Actions
  setStage: (stage: Stage) => void;
  setTicket: (ticket: TicketData) => void;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
  setTravelOptions: (options: TravelOption[]) => void;
  setSelectedTravel: (option: TravelOption) => void;
  setVenueInfo: (info: VenueInfo) => void;
  setPlan: (plan: PlanItem[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  setVenueCoords: (coords: { lat: number; lng: number }) => void;
  setCrowdData: (data: CrowdZone[]) => void;
  setCrowdCache: (phase: MatchPhase, data: CrowdZone[]) => void;
  getCrowdCache: (phase: MatchPhase) => CrowdZone[] | null;
  setMatchPhase: (phase: MatchPhase) => void;
  setExitPlan: (plan: ExitPlan) => void;
  setSavedSessions: (sessions: Partial<MatchDayStore>[]) => void;
  restoreSession: (session: Partial<MatchDayStore>) => void;
  reset: () => void;
}

const defaultPreferences: UserPreferences = {
  location: "",
  locationCoords: null,
  travelMode: "transit",
  foodPreference: "both",
  priorities: ["food"],
  accessibilityNeeds: false,
  doNotMiss: [],
};

const defaultState = {
  stage: "landing" as Stage,
  ticket: null,
  preferences: defaultPreferences,
  travelOptions: [] as TravelOption[],
  selectedTravel: null,
  venueInfo: null,
  plan: [] as PlanItem[],
  chatHistory: [] as ChatMessage[],
  venueCoords: null,
  crowdData: null,
  crowdCache: {} as Record<string, CrowdCacheEntry>,
  matchPhase: "pre-match" as MatchPhase,
  exitPlan: null,
  savedSessions: [] as Partial<MatchDayStore>[],
  sessionCreatedAt: null as number | null,
};

export const useMatchDayStore = create<MatchDayStore>()(
  persist(
    (set, get) => ({
      ...defaultState,

      setStage: (stage) => set({ stage }),
      setTicket: (ticket) =>
        set({ ticket, sessionCreatedAt: get().sessionCreatedAt || Date.now() }),
      setPreferences: (prefs) =>
        set((state) => {
          // If location or travelMode changes, invalidate travelOptions & plan
          // If food, priorities, or doNotMiss change, invalidate plan
          const needsTravelReset = prefs.location !== undefined || prefs.travelMode !== undefined;
          const needsPlanReset =
            needsTravelReset ||
            prefs.foodPreference !== undefined ||
            prefs.priorities !== undefined ||
            prefs.doNotMiss !== undefined;

          return {
            preferences: { ...state.preferences, ...prefs },
            ...(needsTravelReset ? { travelOptions: [] as TravelOption[], selectedTravel: null } : {}),
            ...(needsPlanReset ? { plan: [] as PlanItem[] } : {}),
          };
        }),
      setTravelOptions: (travelOptions) => set({ travelOptions }),
      setSelectedTravel: (selectedTravel) => set({ selectedTravel }),
      setVenueInfo: (venueInfo) => set({ venueInfo }),
      setPlan: (plan) => set({ plan }),
      addChatMessage: (message) =>
        set((state) => ({ chatHistory: [...state.chatHistory, message] })),
      setVenueCoords: (venueCoords) => set({ venueCoords }),
      setCrowdData: (crowdData) => set({ crowdData }),
      setCrowdCache: (phase, data) =>
        set((state) => ({
          crowdData: data,
          crowdCache: {
            ...state.crowdCache,
            [phase]: { data, timestamp: Date.now() },
          },
        })),
      getCrowdCache: (phase) => {
        const entry = get().crowdCache[phase];
        if (!entry) return null;
        const age = Date.now() - entry.timestamp;
        if (age > CROWD_CACHE_TTL_MS) return null; // Expired
        return entry.data;
      },
      setMatchPhase: (matchPhase) => set({ matchPhase }),
      setExitPlan: (exitPlan) => set({ exitPlan }),
      setSavedSessions: (savedSessions) => set({ savedSessions }),
      restoreSession: (session) => set({
        ...defaultState,
        ...session,
        savedSessions: get().savedSessions // Prevent overwriting all sessions with the ancient one
      }),
      reset: () => {
        const state = get();
        // Archive current session if it has a ticket
        let newSavedSessions = state.savedSessions;
        if (state.ticket) {
          const sessionSnapshot = { ...state };
          delete (sessionSnapshot as any).savedSessions;
          // Keep only last 5 sessions
          newSavedSessions = [sessionSnapshot, ...state.savedSessions].slice(0, 5);
        }
        set({
          ...defaultState,
          savedSessions: newSavedSessions,
        });
      },
    }),
    {
      name: "matchday-session",
      storage: createJSONStorage(() => localStorage),
      // Check session expiry on rehydrate
      onRehydrateStorage: () => {
        return (state) => {
          if (!state) return;
          const { sessionCreatedAt } = state;
          if (sessionCreatedAt) {
            const age = Date.now() - sessionCreatedAt;
            if (age > SESSION_TTL_MS) {
              // Session expired — reset everything except saved sessions
              const savedSessions = state.savedSessions;
              state.reset();
              state.setSavedSessions(savedSessions);
            }
          }
          if (!state.ticket && state.stage !== "landing") {
            state.setStage("landing");
          }
        };
      },
      // Only persist serializable state, not functions
      partialize: (state) => ({
        stage: state.stage,
        ticket: state.ticket,
        preferences: state.preferences,
        travelOptions: state.travelOptions,
        selectedTravel: state.selectedTravel,
        venueInfo: state.venueInfo,
        plan: state.plan,
        chatHistory: state.chatHistory,
        venueCoords: state.venueCoords,
        crowdData: state.crowdData,
        crowdCache: state.crowdCache,
        matchPhase: state.matchPhase,
        exitPlan: state.exitPlan,
        savedSessions: state.savedSessions,
        sessionCreatedAt: state.sessionCreatedAt,
      }),
    }
  )
);