// lib/store.ts
import { create } from "zustand";

export type Stage = "upload" | "onboarding" | "travel" | "venue" | "plan" | "live";

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
  timestamp: Date;
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

export const useMatchDayStore = create<MatchDayStore>((set) => ({
  stage: "upload",
  ticket: null,
  preferences: defaultPreferences,
  travelOptions: [],
  selectedTravel: null,
  venueInfo: null,
  plan: [],
  chatHistory: [],
  venueCoords: null,

  setStage: (stage) => set({ stage }),
  setTicket: (ticket) => set({ ticket }),
  setPreferences: (prefs) =>
    set((state) => ({ preferences: { ...state.preferences, ...prefs } })),
  setTravelOptions: (travelOptions) => set({ travelOptions }),
  setSelectedTravel: (selectedTravel) => set({ selectedTravel }),
  setVenueInfo: (venueInfo) => set({ venueInfo }),
  setPlan: (plan) => set({ plan }),
  addChatMessage: (message) =>
    set((state) => ({ chatHistory: [...state.chatHistory, message] })),
  setVenueCoords: (venueCoords) => set({ venueCoords }),
  reset: () =>
    set({
      stage: "upload",
      ticket: null,
      preferences: defaultPreferences,
      travelOptions: [],
      selectedTravel: null,
      venueInfo: null,
      plan: [],
      chatHistory: [],
      venueCoords: null,
    }),
}));

// TODO(01:12): Set up global state management for app flow