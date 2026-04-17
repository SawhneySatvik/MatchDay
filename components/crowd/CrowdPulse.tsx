// components/crowd/CrowdPulse.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Clock,
  Users,
  Sparkles,
  Loader2,
  DoorOpen,
  Utensils,
  Bath,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMatchDayStore, CrowdZone, MatchPhase } from "@/lib/store";
import { toast } from "sonner";

const PHASE_OPTIONS: { id: MatchPhase; label: string; emoji: string }[] = [
  { id: "pre-match", label: "Pre-match", emoji: "🏟️" },
  { id: "during", label: "Live", emoji: "⚽" },
  { id: "post-match", label: "Post-match", emoji: "🚪" },
];

const CROWD_LEVEL_CONFIG = {
  LOW: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    barColor: "bg-emerald-400",
    barWidth: "w-1/4",
    label: "Low",
    pulse: false,
  },
  MEDIUM: {
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    barColor: "bg-amber-400",
    barWidth: "w-2/4",
    label: "Moderate",
    pulse: false,
  },
  HIGH: {
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    barColor: "bg-red-400",
    barWidth: "w-3/4",
    label: "Busy",
    pulse: true,
  },
};

const ZONE_ICONS: Record<string, React.ElementType> = {
  "Entry Gates": DoorOpen,
  "Food Court A": Utensils,
  "Food Court B": Utensils,
  "Restrooms": Bath,
  "Exit Gates": LogOut,
};

export function CrowdPulse() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    ticket,
    matchPhase,
    crowdData,
    setMatchPhase,
    setCrowdCache,
    getCrowdCache,
    setCrowdData,
  } = useMatchDayStore();

  const fetchCrowdData = useCallback(async (phase: MatchPhase) => {
    if (!ticket) return;

    // Check cache first — 15 min TTL
    const cached = getCrowdCache(phase);
    if (cached) {
      setCrowdData(cached);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/crowd-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venue: ticket.venue,
          gate: ticket.gate,
          stand: ticket.stand,
          section: ticket.section,
          kickoffTime: ticket.kickoffTime,
          matchPhase: phase,
        }),
      });

      if (!res.ok) throw new Error("Failed");
      const { zones } = await res.json();
      setCrowdCache(phase, zones); // Saves to cache + sets crowdData
    } catch {
      toast.error("Couldn't fetch crowd data.");
    } finally {
      setIsLoading(false);
    }
  }, [ticket, getCrowdCache, setCrowdData, setCrowdCache]);

  // Fetch on mount — only if no crowd data exists yet in the store
  useEffect(() => {
    if (!crowdData && ticket) {
      fetchCrowdData(matchPhase);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePhaseChange(phase: MatchPhase) {
    setMatchPhase(phase);
    fetchCrowdData(phase);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="flex flex-col gap-4"
    >
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Activity className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Crowd Pulse</p>
            <p className="text-xs text-muted-foreground">AI-estimated density</p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/5 border border-primary/10">
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="text-xs text-primary font-medium">Live Intel</span>
        </div>
      </div>

      {/* Match phase selector */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {PHASE_OPTIONS.map((phase) => (
          <button
            key={phase.id}
            onClick={() => handlePhaseChange(phase.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all",
              matchPhase === phase.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>{phase.emoji}</span>
            <span>{phase.label}</span>
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3 py-6"
        >
          <div className="relative">
            <Loader2 className="w-7 h-7 text-primary animate-spin" />
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
          </div>
          <p className="text-xs text-muted-foreground">
            Analyzing crowd patterns for {PHASE_OPTIONS.find(p => p.id === matchPhase)?.label?.toLowerCase()}...
          </p>
        </motion.div>
      )}

      {/* Crowd zone cards */}
      {!isLoading && crowdData && crowdData.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={matchPhase}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-2.5"
          >
            {crowdData.map((zone, i) => (
              <CrowdZoneCard key={zone.zone} zone={zone} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}

function CrowdZoneCard({ zone, index }: { zone: CrowdZone; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = CROWD_LEVEL_CONFIG[zone.crowdLevel];
  const Icon = ZONE_ICONS[zone.zone] || Users;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full rounded-2xl border transition-all text-left overflow-hidden",
          config.bg
        )}
      >
        <div className="flex items-center gap-3 p-3.5">
          {/* Icon with optional pulse */}
          <div className="relative flex-shrink-0">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                config.bg,
                "border"
              )}
            >
              <Icon className={cn("w-4 h-4", config.color)} />
            </div>
            {config.pulse && (
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{zone.zone}</p>
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  config.bg,
                  config.color
                )}
              >
                {config.label}
              </span>
            </div>

            {/* Crowd bar */}
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className={cn("h-full rounded-full", config.barColor, config.barWidth)}
                />
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">
                  {zone.estimatedWait}
                </span>
              </div>
            </div>
          </div>

          <ChevronRight
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform flex-shrink-0",
              isExpanded && "rotate-90"
            )}
          />
        </div>
      </button>

      {/* Expanded recommendation */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pt-1">
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {zone.recommendation}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
