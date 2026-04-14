// app/page.tsx
"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMatchDayStore } from "@/lib/store";
import { TicketUpload } from "@/components/ticket/TicketUpload";
import { OnboardingScreen } from "@/components/onboarding/OnboardingScreen";
import { TravelScreen } from "@/components/travel/TravelScreen";
import { VenueScreen } from "@/components/venue/VenueScreen";
import { PlanScreen } from "@/components/plan/PlanScreen";

const STAGE_COMPONENTS = {
  upload: TicketUpload,
  onboarding: OnboardingScreen,
  travel: TravelScreen,
  venue: VenueScreen,
  plan: PlanScreen,
  live: PlanScreen, // reuses plan screen in live mode
};

export default function Home() {
  const { stage } = useMatchDayStore();

  const StageComponent = STAGE_COMPONENTS[stage];

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      {/* Stage progress bar */}
      <StageProgressBar />

      {/* Main content area */}
      <div className="flex-1 relative max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="h-full"
          >
            <div className="px-5 py-6 pb-safe">
              <StageComponent />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

// Stage progress indicator
function StageProgressBar() {
  const { stage } = useMatchDayStore();
  const stages = ["upload", "onboarding", "travel", "venue", "plan"];
  const currentIndex = stages.indexOf(stage);

  return (
    <div className="sticky top-0 z-50 px-5 pt-safe pt-4 pb-3 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-md mx-auto flex items-center gap-1.5">
        {stages.map((s, i) => (
          <div
            key={s}
            className={`h-1 rounded-full flex-1 transition-all duration-500 ${
              i <= currentIndex ? "bg-primary" : "bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// TODO(01:12): Set up root layout and base landing page
// TODO(01:12): Polish landing experience and entry flow