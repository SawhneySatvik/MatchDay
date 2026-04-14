// components/travel/TravelScreen.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Train,
  Car,
  Footprints,
  Clock,
  AlarmClock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Loader2,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMatchDayStore, TravelOption } from "@/lib/store";
import { VenueMap } from "@/components/maps/VenueMap";
import { toast } from "sonner";

const MODE_ICONS: Record<string, React.ElementType> = {
  transit: Train,
  driving: Car,
  walking: Footprints,
};

export function TravelScreen() {
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const {
    ticket,
    preferences,
    travelOptions,
    selectedTravel,
    venueCoords,
    setTravelOptions,
    setSelectedTravel,
    setVenueCoords,
    setStage,
  } = useMatchDayStore();

  // Geocode venue on mount
  useEffect(() => {
    if (!ticket || venueCoords) return;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: ticket.venueAddress || ticket.venue }, (results) => {
      if (results && results[0]) {
        const loc = results[0].geometry.location;
        setVenueCoords({ lat: loc.lat(), lng: loc.lng() });
      }
    });
  }, [ticket, venueCoords, setVenueCoords]);

  // Fetch travel options
  useEffect(() => {
    if (travelOptions.length > 0 || !ticket || !preferences.location) return;
    fetchTravelOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchTravelOptions() {
    setLoading(true);
    try {
      const res = await fetch("/api/travel-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venue: ticket?.venue,
          kickoffTime: ticket?.kickoffTime,
          date: ticket?.date,
          userLocation: preferences.location,
          gate: ticket?.gate,
        }),
      });

      if (!res.ok) throw new Error();
      const { options } = await res.json();
      setTravelOptions(options);

      // Auto-select recommended
      const recommended = options.find((o: TravelOption) => o.recommended);
      if (recommended) setSelectedTravel(recommended);
    } catch {
      toast.error("Couldn't generate travel plan. Check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-primary tracking-wide uppercase">
            AI Travel Planner
          </span>
        </div>
        <h2
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-syne, system-ui)" }}
        >
          Getting to the venue
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Timing based on kickoff at {ticket?.kickoffTime} and crowd patterns
        </p>
      </motion.div>

      {/* Map */}
      {venueCoords && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <VenueMap
            venueCoords={venueCoords}
            userCoords={preferences.locationCoords}
            mode="travel"
          />
        </motion.div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="relative">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Calculating your route...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Factoring in crowd surge and kickoff timing
            </p>
          </div>
        </div>
      )}

      {/* Travel options */}
      {!loading && travelOptions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col gap-3"
        >
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Choose your route
          </p>

          {travelOptions.map((option, i) => {
            const Icon = MODE_ICONS[option.mode] || Train;
            const isSelected = selectedTravel?.mode === option.mode;
            const optionId = `${option.mode}-${i}`;
            const isExpanded = expandedId === optionId;

            return (
              <motion.div
                key={optionId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <div
                  className={cn(
                    "rounded-2xl border transition-all overflow-hidden",
                    isSelected ? "border-primary" : "border-border",
                    option.recommended && !isSelected && "border-primary/30"
                  )}
                >
                  {/* Option header */}
                  <button
                    onClick={() => {
                      setSelectedTravel(option);
                      setExpandedId(isExpanded ? null : optionId);
                    }}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 text-left transition-colors",
                      isSelected ? "bg-primary/5" : "bg-card"
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">
                          {option.label}
                        </p>
                        {option.recommended && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                            Best option
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {option.duration}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <AlarmClock className="w-3 h-3 text-primary" />
                          <span className="text-xs font-medium text-primary">
                            Leave by {option.leaveBy}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expand / check */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-0 border-t border-border">
                          {/* Gemini reasoning */}
                          <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Sparkles className="w-3 h-3 text-primary" />
                              <span className="text-xs font-medium text-primary">
                                Why this timing
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {option.reasoning}
                            </p>
                          </div>

                          {/* Steps */}
                          <div className="mt-3 flex flex-col gap-2">
                            {option.steps.map((step, j) => (
                              <div key={j} className="flex items-start gap-2.5">
                                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-xs text-muted-foreground font-medium">
                                    {j + 1}
                                  </span>
                                </div>
                                <p className="text-xs text-foreground leading-relaxed">{step}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* CTA */}
      {selectedTravel && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setStage("venue")}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 glow-amber hover:opacity-90 active:scale-[0.98] transition-all"
        >
          Explore the venue
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      )}
    </div>
  );
}

// TODO(01:12): Create travel guidance UI with time-based suggestions
// TODO(01:12): Optimize real-time coordination across flows