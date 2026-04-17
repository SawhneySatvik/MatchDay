// components/plan/PlanScreen.tsx
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  MapPin,
  Utensils,
  Armchair,
  Zap,
  Coffee,
  Sparkles,
  Loader2,
  MessageCircle,
  X,
  Calendar,
  RefreshCw,
  Send,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMatchDayStore, PlanItem } from "@/lib/store";
import { StadiumChat } from "@/components/chat/StadiumChat";
import { ExitPlanner } from "@/components/plan/ExitPlanner";
import { toast } from "sonner";

const PLAN_TYPE_CONFIG: Record<
  PlanItem["type"],
  { icon: React.ElementType; color: string; bg: string }
> = {
  travel: { icon: Car, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  arrive: { icon: MapPin, color: "text-accent", bg: "bg-accent/10 border-accent/20" },
  food: { icon: Utensils, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  seat: { icon: Armchair, color: "text-primary", bg: "bg-primary/10 border-primary/20" },
  event: { icon: Zap, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  break: { icon: Coffee, color: "text-muted-foreground", bg: "bg-muted border-border" },
};

export function PlanScreen() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [planUpdateInput, setPlanUpdateInput] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const { ticket, preferences, selectedTravel, venueInfo, plan, setPlan, chatHistory, matchPhase, crowdData, addChatMessage } =
    useMatchDayStore();

  useEffect(() => {
    if (plan.length > 0 || !ticket) return;
    generatePlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generatePlan() {
    if (!ticket) return;
    setIsGenerating(true);

    // SAVE TO PROMPT LIBRARY
    const prompt = `You are a game day planning expert. Generate a detailed, personalised game day timeline.

MATCH: ${ticket.match}
VENUE: ${ticket.venue}
KICKOFF: ${ticket.kickoffTime} on ${ticket.date}
SEAT: ${ticket.stand}, ${ticket.section}, Seat ${ticket.seat}
GATE: ${ticket.gate}

TRAVEL:
- Mode: ${selectedTravel?.label || preferences.travelMode}
- Leave by: ${selectedTravel?.leaveBy || "TBD"}
- Duration: ${selectedTravel?.duration || "~45 min"}

PREFERENCES:
- Food: ${preferences.foodPreference}
- Priorities: ${preferences.priorities.join(", ")}
- Do NOT miss: ${preferences.doNotMiss.join(", ") || "none specified"}
- Accessibility needs: ${preferences.accessibilityNeeds}

VENUE FOOD NEARBY: ${
  venueInfo?.foodStalls
    .filter((s) =>
      preferences.foodPreference === "veg"
        ? s.type === "veg" || s.type === "both"
        : true
    )
    .slice(0, 2)
    .map((s) => s.name)
    .join(", ") || "see venue data"
}

Generate a timeline from "leave home" to "post-match exit" with 6-8 events.
Return ONLY a JSON array with this structure:
[
  {
    "time": "4:45 PM",
    "title": "Leave home",
    "description": "Head to [station] to catch the metro. You have a comfortable buffer before the crowd surge.",
    "type": "travel",
    "reasoning": "Leaving at 4:45 gives you a 45-min transit window before gates open at 5:30 PM — 30 min ahead of the crowd surge."
  },
  ...
]

Types: travel | arrive | food | seat | event | break
Rules:
- Reason backward from kickoff time for all timing decisions
- Include a food break before kickoff at the recommended stall
- If "National Anthem" or opening moments are in Do NOT miss list, ensure a "be seated" event before kickoff
- Last item should be "Post-match exit plan" with routing advice
- Be specific — reference the actual venue, gate, and seat
- Return ONLY the JSON array, no markdown`;

    try {
      const res = await fetch("/api/plan-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error();
      const { plan: generatedPlan } = await res.json();
      setPlan(generatedPlan);
    } catch {
      toast.error("Couldn't generate plan. Try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handlePlanUpdate(text: string) {
    if (!text.trim() || isUpdating || !ticket) return;
    setIsUpdating(true);
    setPlanUpdateInput("");

    try {
      const res = await fetch("/api/venue-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history: chatHistory,
          ticket,
          preferences,
          venueInfo,
          plan,
          matchPhase,
          crowdData,
          planUpdate: true,
        }),
      });

      if (!res.ok) throw new Error("Update failed");
      const { response, updatedPlan } = await res.json();

      addChatMessage({ role: "user", content: text.trim(), timestamp: new Date().toISOString() });
      addChatMessage({ role: "assistant", content: response, timestamp: new Date().toISOString() });

      if (updatedPlan) {
        setPlan(updatedPlan);
        toast.success("Plan updated based on your input!");
      } else {
        toast.info("AI responded but didn't regenerate the plan.");
      }
    } catch {
      toast.error("Couldn't update plan.");
    } finally {
      setIsUpdating(false);
    }
  }

  const PLAN_UPDATE_CHIPS = [
    "We're losing, I want to leave early",
    "My kid needs food now",
    "It's raining, need covered route",
    "Skip the food break",
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-3">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary tracking-wide uppercase">
              Your Game Day Plan
            </span>
          </div>
          <h2
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-syne, system-ui)" }}
          >
            {ticket?.date}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kickoff {ticket?.kickoffTime} · {ticket?.venue}
          </p>
        </div>
      </motion.div>

      {/* Responsive layout: timeline + inline chat on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Timeline column (wider) */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          {/* Generating state */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4 py-12"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-primary animate-pulse-slow" />
                </div>
                <div className="absolute -inset-1 rounded-2xl border border-primary/20 animate-ping" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">Building your plan...</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Gemini is reasoning over your seat, travel, and preferences
                </p>
              </div>
              {/* Shimmer skeleton */}
              <div className="w-full flex flex-col gap-3 mt-4">
                {[80, 64, 72, 60].map((w, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="w-10 h-10 rounded-xl shimmer flex-shrink-0" />
                    <div className="flex-1 flex flex-col gap-1.5">
                      <div className={`h-3 rounded shimmer`} style={{ width: `${w}%` }} />
                      <div className="h-2.5 rounded shimmer w-full" />
                      <div className="h-2.5 rounded shimmer w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Timeline */}
          {!isGenerating && plan.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative flex flex-col gap-0"
            >
              {/* Vertical line */}
              <div className="absolute left-5 top-5 bottom-5 w-px bg-border" />

              {plan.map((item, i) => {
                const config = PLAN_TYPE_CONFIG[item.type] || PLAN_TYPE_CONFIG.break;
                const Icon = config.icon;

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.12, duration: 0.4, ease: "easeOut" }}
                    className="flex gap-4 pb-5 relative"
                  >
                    {/* Icon node */}
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 z-10 bg-background",
                        config.bg
                      )}
                    >
                      <Icon className={cn("w-4 h-4", config.color)} />
                    </div>

                    {/* Content card */}
                    <div className="flex-1 glass rounded-2xl p-4 -mt-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-primary tracking-wider">
                            {item.time}
                          </p>
                          <p className="text-sm font-semibold text-foreground mt-0.5">
                            {item.title}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Gemini reasoning accordion */}
                      {item.reasoning && (
                        <div className="mt-2.5 pt-2.5 border-t border-border/60">
                          <div className="flex items-start gap-1.5">
                            <Sparkles className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {item.reasoning}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Plan update input */}
          {!isGenerating && plan.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col gap-3 mt-2"
            >
              {/* Divider with label */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <RefreshCw className="w-3 h-3" />
                  <span>Update your plan</span>
                </div>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Quick update chips */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {PLAN_UPDATE_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handlePlanUpdate(chip)}
                    disabled={isUpdating}
                    className="flex-shrink-0 px-3 py-2 rounded-xl bg-muted text-xs text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors border border-border disabled:opacity-50"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Freeform update input */}
              <div className="flex items-end gap-2 glass rounded-2xl px-4 py-2">
                <input
                  type="text"
                  value={planUpdateInput}
                  onChange={(e) => setPlanUpdateInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handlePlanUpdate(planUpdateInput);
                    }
                  }}
                  placeholder="Tell me what changed..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none py-2"
                />
                <button
                  onClick={() => handlePlanUpdate(planUpdateInput)}
                  disabled={!planUpdateInput.trim() || isUpdating}
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
                    planUpdateInput.trim() && !isUpdating
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Smart Exit Planner */}
          {!isGenerating && plan.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <ExitPlanner />
            </div>
          )}

          {/* Empty / error */}
          {!isGenerating && plan.length === 0 && (
            <div className="text-center py-10">
              <p className="text-sm text-muted-foreground">
                Couldn't generate your plan.
              </p>
              <button
                onClick={generatePlan}
                className="mt-3 text-sm text-primary font-medium"
              >
                Try again
              </button>
            </div>
          )}
        </div>

        {/* Desktop inline chat panel (hidden on mobile) */}
        <div className="hidden lg:flex lg:col-span-2 flex-col">
          {plan.length > 0 && (
            <div className="sticky top-24 rounded-2xl border border-border bg-card overflow-hidden" style={{ height: "calc(100vh - 140px)" }}>
              {/* Header */}
              <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">MatchDay AI</p>
                  <p className="text-xs text-muted-foreground">Your live concierge</p>
                </div>
              </div>
              {/* Chat */}
              <div className="flex-1 overflow-hidden" style={{ height: "calc(100% - 72px)" }}>
                <StadiumChat />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile floating chat button (hidden on desktop) */}
      {plan.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-6 right-5 z-40 lg:hidden"
        >
          <button
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-primary text-primary-foreground shadow-xl glow-amber font-semibold text-sm"
          >
            <MessageCircle className="w-4 h-4" />
            Ask MatchDay AI
          </button>
        </motion.div>
      )}

      {/* Mobile chat drawer (hidden on desktop) */}
      <AnimatePresence>
        {isChatOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-3xl overflow-hidden lg:hidden"
              style={{ height: "75dvh" }}
            >
              {/* Handle + header */}
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <div>
                  <div className="w-10 h-1 rounded-full bg-border mx-auto mb-3" />
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">MatchDay AI</p>
                      <p className="text-xs text-muted-foreground">Your live concierge</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Chat */}
              <div className="flex-1 overflow-hidden" style={{ height: "calc(75dvh - 85px)" }}>
                <StadiumChat />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom spacing for floating button (mobile only) */}
      <div className="h-16 lg:hidden" />
    </div>
  );
}

// TODO(01:12): Build plan overview UI for match day experience
// TODO(01:12): Refine plan recommendations with dynamic updates