// components/onboarding/OnboardingScreen.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import {
  MapPin,
  Train,
  Car,
  Footprints,
  Leaf,
  Drumstick,
  UtensilsCrossed,
  Accessibility,
  Zap,
  ShoppingBag,
  Bath,
  Wind,
  CheckCircle2,
  ChevronRight,
  Ticket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMatchDayStore, UserPreferences } from "@/lib/store";
import { toast } from "sonner";

type OnboardingStep = "location" | "travel" | "food" | "priorities" | "doNotMiss";

const STEP_CONFIG: { id: OnboardingStep; label: string }[] = [
  { id: "location", label: "Your location" },
  { id: "travel", label: "Travel mode" },
  { id: "food", label: "Food preference" },
  { id: "priorities", label: "Priorities" },
  { id: "doNotMiss", label: "Must-see moments" },
];

export function OnboardingScreen() {
  const [step, setStep] = useState<OnboardingStep>("location");
  const { ticket, preferences, setPreferences, setStage } = useMatchDayStore();

  const stepIndex = STEP_CONFIG.findIndex((s) => s.id === step);

  function next() {
    const nextStep = STEP_CONFIG[stepIndex + 1];
    if (nextStep) {
      setStep(nextStep.id);
    } else {
      // All steps done — go to travel
      setStage("travel");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Ticket summary pill */}
      {ticket && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-4 flex items-start gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
            <Ticket className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {ticket.match}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {ticket.venue} · {ticket.date} · {ticket.kickoffTime}
            </p>
            <p className="text-xs text-primary mt-0.5">
              {ticket.stand}, Seat {ticket.seat} · Gate {ticket.gate}
            </p>
          </div>
        </motion.div>
      )}

      {/* Step progress dots */}
      <div className="flex items-center gap-1.5">
        {STEP_CONFIG.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i < stepIndex
                ? "bg-primary w-4"
                : i === stepIndex
                ? "bg-primary w-8"
                : "bg-border w-4"
            )}
          />
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
        >
          {step === "location" && (
            <LocationStep preferences={preferences} setPreferences={setPreferences} onNext={next} />
          )}
          {step === "travel" && (
            <TravelModeStep preferences={preferences} setPreferences={setPreferences} onNext={next} />
          )}
          {step === "food" && (
            <FoodStep preferences={preferences} setPreferences={setPreferences} onNext={next} />
          )}
          {step === "priorities" && (
            <PrioritiesStep preferences={preferences} setPreferences={setPreferences} onNext={next} />
          )}
          {step === "doNotMiss" && (
            <DoNotMissStep preferences={preferences} setPreferences={setPreferences} onNext={next} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Step 1: Location with Google Places ──────────────────────────────────────

function LocationStep({
  preferences,
  setPreferences,
  onNext,
}: {
  preferences: UserPreferences;
  setPreferences: (p: Partial<UserPreferences>) => void;
  onNext: () => void;
}) {
  const [inputValue, setInputValue] = useState(preferences.location || "");
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const placesLib = useMapsLibrary("places");
  const autocompleteRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (!placesLib) return;
    autocompleteRef.current = new placesLib.AutocompleteService();
    geocoderRef.current = new google.maps.Geocoder();
  }, [placesLib]);

  function handleInput(value: string) {
    setInputValue(value);
    if (!value.trim() || !autocompleteRef.current) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    autocompleteRef.current.getPlacePredictions(
      { input: value, types: ["geocode", "establishment"], componentRestrictions: { country: "in" } },
      (predictions) => {
        setSuggestions(predictions || []);
        setIsOpen(true);
      }
    );
  }

  function selectPlace(prediction: google.maps.places.AutocompletePrediction) {
    setInputValue(prediction.description);
    setSuggestions([]);
    setIsOpen(false);

    // Geocode to get coords
    if (!geocoderRef.current) return;
    geocoderRef.current.geocode({ placeId: prediction.place_id }, (results) => {
      if (results && results[0]) {
        const loc = results[0].geometry.location;
        setPreferences({
          location: prediction.description,
          locationCoords: { lat: loc.lat(), lng: loc.lng() },
        });
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-syne, system-ui)" }}>
          Where are you travelling from?
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          We'll plan the best route and leave time for you
        </p>
      </div>

      <div className="relative">
        <div className="relative flex items-center">
          <MapPin className="absolute left-4 w-4 h-4 text-muted-foreground" />
          <input
            value={inputValue}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="Search your area, neighbourhood..."
            className="w-full pl-11 pr-4 py-4 bg-card border border-border rounded-2xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
          />
        </div>

        <AnimatePresence>
          {isOpen && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl overflow-hidden z-20 shadow-xl"
            >
              {suggestions.slice(0, 4).map((s) => (
                <button
                  key={s.place_id}
                  onClick={() => selectPlace(s)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left border-b border-border last:border-0"
                >
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {s.structured_formatting.main_text}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {s.structured_formatting.secondary_text}
                    </p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ContinueButton
        disabled={!preferences.locationCoords}
        onClick={onNext}
      />
    </div>
  );
}

// ── Step 2: Travel Mode ───────────────────────────────────────────────────────

const TRAVEL_MODES = [
  {
    id: "transit" as const,
    label: "Metro / Bus",
    sublabel: "Recommended for match days",
    icon: Train,
    recommended: true,
  },
  {
    id: "driving" as const,
    label: "Cab / Drive",
    sublabel: "Factor in parking + traffic",
    icon: Car,
    recommended: false,
  },
  {
    id: "walking" as const,
    label: "Walk / Auto",
    sublabel: "If you're nearby",
    icon: Footprints,
    recommended: false,
  },
];

function TravelModeStep({
  preferences,
  setPreferences,
  onNext,
}: {
  preferences: UserPreferences;
  setPreferences: (p: Partial<UserPreferences>) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-syne, system-ui)" }}>
          How are you getting there?
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          We'll factor this into your leave-by time
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {TRAVEL_MODES.map((mode) => {
          const Icon = mode.icon;
          const selected = preferences.travelMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setPreferences({ travelMode: mode.id })}
              className={cn(
                "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                selected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-border/80"
              )}
            >
              <div
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
                  selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{mode.label}</p>
                  {mode.recommended && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{mode.sublabel}</p>
              </div>
              {selected && <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      <ContinueButton onClick={onNext} />
    </div>
  );
}

// ── Step 3: Food preference ───────────────────────────────────────────────────

const FOOD_OPTIONS = [
  { id: "veg" as const, label: "Vegetarian", icon: Leaf, color: "text-green-400" },
  { id: "non-veg" as const, label: "Non-Veg", icon: Drumstick, color: "text-orange-400" },
  { id: "both" as const, label: "Both", icon: UtensilsCrossed, color: "text-primary" },
];

function FoodStep({
  preferences,
  setPreferences,
  onNext,
}: {
  preferences: UserPreferences;
  setPreferences: (p: Partial<UserPreferences>) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-syne, system-ui)" }}>
          Food preference?
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          We'll only recommend stalls that match your preference
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {FOOD_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const selected = preferences.foodPreference === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => setPreferences({ foodPreference: opt.id })}
              className={cn(
                "flex flex-col items-center gap-2.5 p-4 rounded-2xl border transition-all",
                selected ? "border-primary bg-primary/5" : "border-border bg-card"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  selected ? "bg-primary/10" : "bg-muted"
                )}
              >
                <Icon className={cn("w-5 h-5", selected ? opt.color : "text-muted-foreground")} />
              </div>
              <p className="text-xs font-medium text-foreground">{opt.label}</p>
              {selected && (
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      <ContinueButton onClick={onNext} />
    </div>
  );
}

// ── Step 4: Priorities ────────────────────────────────────────────────────────

const PRIORITY_OPTIONS = [
  { id: "food" as const, label: "Food & Drinks", icon: UtensilsCrossed },
  { id: "restroom" as const, label: "Restroom Access", icon: Bath },
  { id: "merchandise" as const, label: "Merchandise", icon: ShoppingBag },
  { id: "atmosphere" as const, label: "Atmosphere First", icon: Wind },
];

function PrioritiesStep({
  preferences,
  setPreferences,
  onNext,
}: {
  preferences: UserPreferences;
  setPreferences: (p: Partial<UserPreferences>) => void;
  onNext: () => void;
}) {
  function toggle(id: typeof PRIORITY_OPTIONS[number]["id"]) {
    const current = preferences.priorities;
    const next = current.includes(id) ? current.filter((p) => p !== id) : [...current, id];
    setPreferences({ priorities: next });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-syne, system-ui)" }}>
          What matters most to you?
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Pick all that apply — we'll build your plan around these
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {PRIORITY_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const selected = preferences.priorities.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => toggle(opt.id)}
              className={cn(
                "flex items-center gap-3 p-4 rounded-2xl border transition-all text-left",
                selected ? "border-primary bg-primary/5" : "border-border bg-card"
              )}
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                  selected ? "bg-primary/10" : "bg-muted"
                )}
              >
                <Icon className={cn("w-4 h-4", selected ? "text-primary" : "text-muted-foreground")} />
              </div>
              <p className="text-sm font-medium text-foreground leading-tight">{opt.label}</p>
            </button>
          );
        })}
      </div>

      {/* Accessibility toggle */}
      <button
        onClick={() => setPreferences({ accessibilityNeeds: !preferences.accessibilityNeeds })}
        className={cn(
          "flex items-center gap-3 p-4 rounded-2xl border transition-all text-left",
          preferences.accessibilityNeeds ? "border-primary bg-primary/5" : "border-border bg-card"
        )}
      >
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
            preferences.accessibilityNeeds ? "bg-primary/10" : "bg-muted"
          )}
        >
          <Accessibility
            className={cn(
              "w-4 h-4",
              preferences.accessibilityNeeds ? "text-primary" : "text-muted-foreground"
            )}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Accessibility needs</p>
          <p className="text-xs text-muted-foreground">We'll prioritise accessible routes & facilities</p>
        </div>
      </button>

      <ContinueButton onClick={onNext} />
    </div>
  );
}

// ── Step 5: Do Not Miss ───────────────────────────────────────────────────────

const MOMENT_OPTIONS = [
  "Opening Ceremony",
  "National Anthem",
  "Player Walk-out",
  "Toss",
  "Halftime Show",
  "Post-match Presentation",
];

function DoNotMissStep({
  preferences,
  setPreferences,
  onNext,
}: {
  preferences: UserPreferences;
  setPreferences: (p: Partial<UserPreferences>) => void;
  onNext: () => void;
}) {
  function toggle(moment: string) {
    const current = preferences.doNotMiss;
    const next = current.includes(moment)
      ? current.filter((m) => m !== moment)
      : [...current, moment];
    setPreferences({ doNotMiss: next });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-syne, system-ui)" }}>
          What can't you miss?
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          We'll make sure you're in your seat for these
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {MOMENT_OPTIONS.map((moment) => {
          const selected = preferences.doNotMiss.includes(moment);
          return (
            <button
              key={moment}
              onClick={() => toggle(moment)}
              className={cn(
                "flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all text-left",
                selected ? "border-primary bg-primary/5" : "border-border bg-card"
              )}
            >
              <div className="flex items-center gap-3">
                <Zap className={cn("w-4 h-4", selected ? "text-primary" : "text-muted-foreground")} />
                <p className="text-sm font-medium text-foreground">{moment}</p>
              </div>
              {selected && <CheckCircle2 className="w-4 h-4 text-primary" />}
            </button>
          );
        })}
      </div>

      <ContinueButton onClick={onNext} label="Build my game day →" />
    </div>
  );
}

// ── Shared continue button ────────────────────────────────────────────────────

function ContinueButton({
  onClick,
  disabled = false,
  label = "Continue",
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full py-4 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2",
        disabled
          ? "bg-muted text-muted-foreground cursor-not-allowed"
          : "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.98] glow-amber"
      )}
    >
      {label}
      <ChevronRight className="w-4 h-4" />
    </button>
  );
}

// TODO(01:12): Design onboarding flow after ticket parsing