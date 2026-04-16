// app/page.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Ticket, Settings2, Route, MapPin, CalendarCheck } from "lucide-react";
import { useMatchDayStore, Stage } from "@/lib/store";
import { TicketUpload } from "@/components/ticket/TicketUpload";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { TravelScreen } from "@/components/travel/TravelScreen";
import { VenueScreen } from "@/components/venue/VenueScreen";
import { PlanScreen } from "@/components/plan/PlanScreen";

const STAGES: { key: Stage; label: string; icon: React.ElementType }[] = [
  { key: "upload", label: "Ticket", icon: Ticket },
  { key: "onboarding", label: "Preferences", icon: Settings2 },
  { key: "travel", label: "Travel", icon: Route },
  { key: "venue", label: "Venue", icon: MapPin },
  { key: "plan", label: "Plan", icon: CalendarCheck },
];

const STAGE_COMPONENTS: Record<string, React.ComponentType> = {
  upload: TicketUpload,
  onboarding: OnboardingScreen,
  travel: TravelScreen,
  venue: VenueScreen,
  plan: PlanScreen,
  live: PlanScreen,
};

const PREV_STAGE: Record<string, Stage> = {
  onboarding: "upload",
  travel: "onboarding",
  venue: "travel",
  plan: "venue",
  live: "plan",
};

export default function Home() {
  const { stage } = useMatchDayStore();
  const StageComponent = STAGE_COMPONENTS[stage];

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Ambient background glow — visible everywhere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
        {/* Extra glow visible on desktop only */}
        <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/[0.03] blur-[120px]" />
      </div>

      {/* Stage progress bar */}
      <StageProgressBar />

      {/* Desktop wrapper: constrained centre column with glassmorphic framing */}
      <div className="flex-1 relative w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="h-full"
          >
            <div className="px-5 py-6 pb-safe md:px-8 md:py-8 lg:px-10 lg:py-10">
              <StageComponent />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

/* ──────────────────────────────────────────────────────── */
/* Stage progress bar with back button + responsive labels */
/* ──────────────────────────────────────────────────────── */
function StageProgressBar() {
  const { stage, setStage } = useMatchDayStore();
  const currentIndex = STAGES.findIndex((s) => s.key === stage);
  const canGoBack = stage in PREV_STAGE;

  return (
    <div className="sticky top-0 z-50 px-5 pt-safe pt-4 pb-3 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto flex items-center gap-3">
        {/* Back button */}
        <button
          onClick={() => canGoBack && setStage(PREV_STAGE[stage])}
          disabled={!canGoBack}
          aria-label="Go back"
          className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all flex-shrink-0 ${
            canGoBack
              ? "bg-muted hover:bg-muted/80 text-foreground cursor-pointer active:scale-95"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Progress segments — mobile: bars, tablet+: labelled dots */}
        {/* Mobile bars */}
        <div className="flex items-center gap-1.5 flex-1 md:hidden">
          {STAGES.map((s, i) => (
            <div
              key={s.key}
              className={`h-1 rounded-full flex-1 transition-all duration-500 ${
                i <= currentIndex ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        {/* Tablet+ labelled steps */}
        <div className="hidden md:flex items-center gap-1 flex-1">
          {STAGES.map((s, i) => {
            const Icon = s.icon;
            const isCompleted = i < currentIndex;
            const isCurrent = i === currentIndex;

            return (
              <div key={s.key} className="flex items-center flex-1">
                <button
                  onClick={() => {
                    if (isCompleted) setStage(s.key);
                  }}
                  disabled={!isCompleted}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isCurrent
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : isCompleted
                      ? "text-muted-foreground hover:text-foreground cursor-pointer"
                      : "text-muted-foreground/40"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">{s.label}</span>
                </button>
                {i < STAGES.length - 1 && (
                  <div
                    className={`flex-1 h-px mx-1 transition-colors duration-500 ${
                      i < currentIndex ? "bg-primary/40" : "bg-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}