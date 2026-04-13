// data/venues.ts
import { VenueInfo } from "@/lib/store";

export const VENUE_DATA: Record<string, VenueInfo> = {
  "Wankhede Stadium": {
    foodStalls: [
      {
        id: "f1",
        name: "Mumbai Masala",
        type: "veg",
        walkTime: "3 min",
        section: "North Stand - Ground Level",
        speciality: "Vada Pav, Misal Pav",
        coords: { lat: 18.9388, lng: 72.8254 },
      },
      {
        id: "f2",
        name: "Grill House",
        type: "non-veg",
        walkTime: "4 min",
        section: "South Stand - Level 2",
        speciality: "Tandoori Chicken, Kebabs",
        coords: { lat: 18.9382, lng: 72.8258 },
      },
    ],
    gates: [
      {
        id: "g1",
        name: "Gate 1 — North",
        serves: ["North Stand", "VIP Pavilion"],
        coords: { lat: 18.9395, lng: 72.8254 },
        congestionLevel: "high",
      },
    ],
    restrooms: [
      {
        id: "r1",
        name: "Restroom Block A",
        section: "North Stand",
        walkTime: "2 min",
        coords: { lat: 18.9390, lng: 72.8252 },
      },
    ],
    medicalPoints: [
      {
        id: "m1",
        name: "First Aid",
        section: "North Concourse",
        coords: { lat: 18.9393, lng: 72.8256 },
      },
    ],
    atms: [
      {
        id: "a1",
        name: "SBI ATM",
        section: "Main Entrance",
        coords: { lat: 18.9390, lng: 72.8250 },
      },
    ],
  },

  "Eden Gardens": {
    foodStalls: [
      {
        id: "f1",
        name: "Bengal Kitchen",
        type: "both",
        walkTime: "3 min",
        section: "Club House End",
        speciality: "Rolls, Biryani",
        coords: { lat: 22.5645, lng: 88.3433 },
      },
    ],
    gates: [
      {
        id: "g1",
        name: "Gate A — Main",
        serves: ["A Block", "Club House"],
        coords: { lat: 22.5650, lng: 88.3430 },
        congestionLevel: "high",
      },
    ],
    restrooms: [
      {
        id: "r1",
        name: "Restroom A",
        section: "A Block",
        walkTime: "3 min",
        coords: { lat: 22.5646, lng: 88.3432 },
      },
    ],
    medicalPoints: [
      {
        id: "m1",
        name: "Medical Centre",
        section: "Near Gate A",
        coords: { lat: 22.5649, lng: 88.3428 },
      },
    ],
    atms: [
      {
        id: "a1",
        name: "PNB ATM",
        section: "Main Lobby",
        coords: { lat: 22.5651, lng: 88.3431 },
      },
    ],
  },

  "M. Chinnaswamy Stadium": {
    foodStalls: [
      {
        id: "f1",
        name: "Bangalore Bites",
        type: "veg",
        walkTime: "2 min",
        section: "East Stand",
        speciality: "Dosa, Filter Coffee",
        coords: { lat: 12.9788, lng: 77.5996 },
      },
      {
        id: "f2",
        name: "RCB Grill",
        type: "non-veg",
        walkTime: "4 min",
        section: "West Stand",
        speciality: "Chicken Wings, Burgers",
        coords: { lat: 12.9785, lng: 77.5992 },
      },
    ],
    gates: [
      {
        id: "g1",
        name: "Gate 3",
        serves: ["East Stand"],
        coords: { lat: 12.9792, lng: 77.5998 },
        congestionLevel: "high",
      },
      {
        id: "g2",
        name: "Gate 7",
        serves: ["West Stand"],
        coords: { lat: 12.9783, lng: 77.5990 },
        congestionLevel: "medium",
      },
    ],
    restrooms: [
      {
        id: "r1",
        name: "Restroom East",
        section: "East Stand",
        walkTime: "2 min",
        coords: { lat: 12.9787, lng: 77.5997 },
      },
    ],
    medicalPoints: [
      {
        id: "m1",
        name: "First Aid Bay",
        section: "Central Concourse",
        coords: { lat: 12.9789, lng: 77.5995 },
      },
    ],
    atms: [
      {
        id: "a1",
        name: "HDFC ATM",
        section: "Gate 3 Entry",
        coords: { lat: 12.9791, lng: 77.5999 },
      },
    ],
  },

  "Narendra Modi Stadium": {
    foodStalls: [
      {
        id: "f1",
        name: "Gujarati Tadka",
        type: "veg",
        walkTime: "5 min",
        section: "Block B",
        speciality: "Dhokla, Thepla",
        coords: { lat: 23.0917, lng: 72.5970 },
      },
      {
        id: "f2",
        name: "Global Eats",
        type: "both",
        walkTime: "6 min",
        section: "Block D",
        speciality: "Pizza, Wraps",
        coords: { lat: 23.0920, lng: 72.5975 },
      },
    ],
    gates: [
      {
        id: "g1",
        name: "Gate 1",
        serves: ["Block A", "VIP"],
        coords: { lat: 23.0925, lng: 72.5968 },
        congestionLevel: "high",
      },
      {
        id: "g2",
        name: "Gate 4",
        serves: ["Block D"],
        coords: { lat: 23.0915, lng: 72.5978 },
        congestionLevel: "low",
      },
    ],
    restrooms: [
      {
        id: "r1",
        name: "Restroom Block B",
        section: "Level 1",
        walkTime: "4 min",
        coords: { lat: 23.0918, lng: 72.5971 },
      },
    ],
    medicalPoints: [
      {
        id: "m1",
        name: "Emergency Care",
        section: "Central Ring",
        coords: { lat: 23.0922, lng: 72.5972 },
      },
    ],
    atms: [
      {
        id: "a1",
        name: "ICICI ATM",
        section: "Main Plaza",
        coords: { lat: 23.0920, lng: 72.5969 },
      },
    ],
  },

  "M. A. Chidambaram Stadium": {
    foodStalls: [
      {
        id: "f1",
        name: "Chepauk Snacks",
        type: "veg",
        walkTime: "3 min",
        section: "Anna Pavilion",
        speciality: "Idli, Pongal",
        coords: { lat: 13.0622, lng: 80.2795 },
      },
      {
        id: "f2",
        name: "Marina Grill",
        type: "non-veg",
        walkTime: "4 min",
        section: "Beach End",
        speciality: "Fish Fry, Chicken 65",
        coords: { lat: 13.0625, lng: 80.2799 },
      },
    ],
    gates: [
      {
        id: "g1",
        name: "Gate 2",
        serves: ["Pavilion"],
        coords: { lat: 13.0628, lng: 80.2793 },
        congestionLevel: "high",
      },
      {
        id: "g2",
        name: "Gate 5",
        serves: ["General Stand"],
        coords: { lat: 13.0618, lng: 80.2801 },
        congestionLevel: "medium",
      },
    ],
    restrooms: [
      {
        id: "r1",
        name: "Restroom Pavilion",
        section: "Level 1",
        walkTime: "2 min",
        coords: { lat: 13.0623, lng: 80.2796 },
      },
    ],
    medicalPoints: [
      {
        id: "m1",
        name: "Medical Bay",
        section: "Near Gate 2",
        coords: { lat: 13.0627, lng: 80.2794 },
      },
    ],
    atms: [
      {
        id: "a1",
        name: "Axis Bank ATM",
        section: "Entry Plaza",
        coords: { lat: 13.0626, lng: 80.2792 },
      },
    ],
  },
};

export function getVenueData(venueName: string): VenueInfo | null {
  // Fuzzy match — try to find a key that contains the venue name
  const key = Object.keys(VENUE_DATA).find((k) =>
    venueName.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(venueName.toLowerCase())
  );
  return key ? VENUE_DATA[key] : null;
}

// TODO(01:12): Add structured venue data including sections, gates, and amenities