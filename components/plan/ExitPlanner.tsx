// components/plan/ExitPlanner.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  Clock,
  MapPin,
  Sparkles,
  Loader2,
  ChevronRight,
  AlertTriangle,
  Shield,
  Route,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMatchDayStore, ExitPlan } from "@/lib/store";
import { toast } from "sonner";

const CROWD_CONFIG = {
  LOW: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    label: "Low crowd expected",
    icon: Shield,
  },
  MEDIUM: {
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    label: "Moderate crowd expected",
    icon: AlertTriangle,
  },
  HIGH: {
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
    label: "Heavy crowd expected",
    icon: AlertTriangle,
  },
};

export function ExitPlanner() {
  const [isLoading, setIsLoading] = useState(false);
  const [matchMinute, setMatchMinute] = useState("85");
  const [score, setScore] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const { ticket, preferences, exitPlan, setExitPlan } = useMatchDayStore();

  async function generateExitPlan() {
    if (!ticket) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/exit-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venue: ticket.venue,
          gate: ticket.gate,
          stand: ticket.stand,
          section: ticket.section,
          kickoffTime: ticket.kickoffTime,
          matchMinute: matchMinute,
          score: score || "Not specified",
          transportMode: preferences.travelMode,
        }),
      });

      if (!res.ok) throw new Error("Failed");
      const { exitPlan: plan } = await res.json();
      setExitPlan(plan);
      toast.success("Exit plan generated!");
    } catch {
      toast.error("Couldn't generate exit plan.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-col gap-4"
    >
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
          <LogOut className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Smart Exit Planner</p>
          <p className="text-xs text-muted-foreground">AI-optimized departure strategy</p>
        </div>
      </div>

      {/* Input fields — collapsible */}
      {!exitPlan && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground font-medium">Match Minute</label>
              <input
                type="text"
                value={matchMinute}
                onChange={(e) => setMatchMinute(e.target.value)}
                placeholder="e.g. 85"
                className="bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground font-medium">Score (optional)</label>
              <input
                type="text"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="e.g. 2-0"
                className="bg-muted rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          <button
            onClick={generateExitPlan}
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-purple-500/15 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Planning your exit...
              </>
            ) : (
              <>
                <Route className="w-4 h-4" />
                Plan My Exit
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Exit plan result */}
      <AnimatePresence>
        {exitPlan && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="flex flex-col gap-3"
          >
            {/* Main exit card */}
            <div className="glass rounded-2xl p-4 flex flex-col gap-3">
              {/* Leave by time */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Leave at</span>
                </div>
                <span className="text-lg font-bold text-primary font-display">
                  {exitPlan.leaveByTime}
                </span>
              </div>

              {/* Recommended gate */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{exitPlan.recommendedGate}</span>
                </div>
                {(() => {
                  const config = CROWD_CONFIG[exitPlan.estimatedCrowdLevel];
                  const CrowdIcon = config.icon;
                  return (
                    <span className={cn("text-xs px-2 py-1 rounded-lg font-medium border", config.bg, config.color)}>
                      <CrowdIcon className="w-3 h-3 inline mr-1" />
                      {config.label}
                    </span>
                  );
                })()}
              </div>

              {/* Route */}
              <div className="flex items-start gap-2">
                <Route className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">{exitPlan.route}</p>
              </div>

              {/* Reasoning */}
              <div className="mt-1 pt-3 border-t border-border/60">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1.5 w-full"
                >
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span className="text-xs font-medium text-primary">AI Reasoning</span>
                  <ChevronRight
                    className={cn(
                      "w-3 h-3 text-primary ml-auto transition-transform",
                      isExpanded && "rotate-90"
                    )}
                  />
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                        {exitPlan.reasoning}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Backup options */}
            {exitPlan.backupOptions && exitPlan.backupOptions.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Backup Options
                </p>
                {exitPlan.backupOptions.map((backup, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="glass rounded-xl p-3 flex items-start gap-2.5"
                  >
                    <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">{backup.gate}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{backup.reason}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Regenerate button */}
            <button
              onClick={() => {
                setExitPlan(null as unknown as ExitPlan);
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center py-1"
            >
              Regenerate with different inputs
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
