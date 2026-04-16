// components/venue/VenueScreen.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Utensils,
  DoorOpen,
  Bath,
  Cross,
  CreditCard,
  Sparkles,
  Leaf,
  ChevronRight,
  MapPin,
  Clock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMatchDayStore, FoodStall, Gate, RestRoom } from "@/lib/store";
import { VenueMap } from "@/components/maps/VenueMap";
import { getVenueData } from "@/data/venues";

type VenueTab = "food" | "gates" | "facilities";

export function VenueScreen() {
  const [activeTab, setActiveTab] = useState<VenueTab>("food");
  const [recommendedStalls, setRecommendedStalls] = useState<FoodStall[]>([]);
  const [recommendedGate, setRecommendedGate] = useState<Gate | null>(null);

  const { ticket, preferences, venueInfo, venueCoords, setVenueInfo, setStage } =
    useMatchDayStore();

  // Load venue data on mount
  useEffect(() => {
    if (!ticket || venueInfo) return;
    const data = getVenueData(ticket.venue);
    if (data) {
      setVenueInfo(data);
    }
  }, [ticket, venueInfo, setVenueInfo]);

  // Compute personalised recommendations from venue data + preferences
  useEffect(() => {
    if (!venueInfo) return;

    // Filter food stalls by preference
    const filtered = venueInfo.foodStalls.filter((s) => {
      if (preferences.foodPreference === "veg") return s.type === "veg" || s.type === "both";
      if (preferences.foodPreference === "non-veg") return s.type === "non-veg" || s.type === "both";
      return true;
    });
    setRecommendedStalls(filtered);

    // Find lowest-congestion gate
    const sortedGates = [...venueInfo.gates].sort((a, b) => {
      const order = { low: 0, medium: 1, high: 2 };
      return order[a.congestionLevel] - order[b.congestionLevel];
    });
    setRecommendedGate(sortedGates[0] || null);
  }, [venueInfo, preferences]);

  const TABS: { id: VenueTab; label: string; icon: React.ElementType }[] = [
    { id: "food", label: "Food", icon: Utensils },
    { id: "gates", label: "Gates", icon: DoorOpen },
    { id: "facilities", label: "Facilities", icon: Cross },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 mb-3">
          <MapPin className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-medium text-accent tracking-wide uppercase">
            Venue Intel
          </span>
        </div>
        <h2
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-syne, system-ui)" }}
        >
          {ticket?.venue}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Personalised for {ticket?.stand}, Seat {ticket?.seat}
        </p>
      </motion.div>

      {/* Responsive two-column grid for desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left column: Map + AI Tip */}
        <div className="flex flex-col gap-5">
          {/* Map */}
          {venueCoords && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="lg:sticky lg:top-24"
            >
              <VenueMap
                venueCoords={venueCoords}
                venueInfo={venueInfo}
                mode="venue"
              />
            </motion.div>
          )}

          {/* AI Seat Tip — shows below map on mobile, pinned on desktop */}
          {ticket && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="p-4 rounded-2xl bg-primary/5 border border-primary/15"
            >
              <div className="flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-primary mb-1">
                    For your seat
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You're in <span className="text-foreground font-medium">{ticket.stand}</span>.{" "}
                    {recommendedGate
                      ? `Your quickest entry is ${recommendedGate.name} — currently showing ${recommendedGate.congestionLevel} congestion.`
                      : "Loading gate recommendations..."}{" "}
                    {recommendedStalls.length > 0
                      ? `Nearest ${preferences.foodPreference === "veg" ? "veg" : "food"} stall: ${recommendedStalls[0].name} (${recommendedStalls[0].walkTime} walk).`
                      : ""}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right column: Tabs + Content + CTA */}
        <div className="flex flex-col gap-5">
          {/* Tabs */}
          <div className="flex gap-1 bg-muted rounded-xl p-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          {!venueInfo ? (
            <div className="flex items-center justify-center py-10 gap-3">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Loading venue data...</p>
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-3"
            >
              {activeTab === "food" && (
                <>
                  {recommendedStalls.length === 0 ? (
                    <EmptyState message="No stalls match your preference for this venue." />
                  ) : (
                    recommendedStalls.map((stall, i) => (
                      <FoodStallCard key={stall.id} stall={stall} index={i} />
                    ))
                  )}
                </>
              )}

              {activeTab === "gates" && (
                <>
                  {venueInfo.gates.map((gate, i) => (
                    <GateCard key={gate.id} gate={gate} index={i} isRecommended={gate.id === recommendedGate?.id} />
                  ))}
                </>
              )}

              {activeTab === "facilities" && (
                <>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Restrooms
                  </p>
                  {venueInfo.restrooms.map((r, i) => (
                    <FacilityCard key={r.id} icon={Bath} name={r.name} detail={`${r.section} · ${r.walkTime} walk`} index={i} />
                  ))}
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-2">
                    Medical & ATMs
                  </p>
                  {venueInfo.medicalPoints.map((m, i) => (
                    <FacilityCard key={m.id} icon={Cross} name={m.name} detail={m.section} index={i} />
                  ))}
                  {venueInfo.atms.map((a, i) => (
                    <FacilityCard key={a.id} icon={CreditCard} name={a.name} detail={a.section} index={i} />
                  ))}
                </>
              )}
            </motion.div>
          )}

          {/* CTA */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => setStage("plan")}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 glow-amber hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Generate my game day plan
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function FoodStallCard({ stall, index }: { stall: FoodStall; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="glass rounded-2xl p-4 flex items-start gap-3"
    >
      <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
        <Utensils className="w-4 h-4 text-orange-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground">{stall.name}</p>
          {stall.type === "veg" && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <Leaf className="w-3 h-3" /> Veg
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{stall.speciality}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{stall.section}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-primary" />
            <span className="text-xs text-primary font-medium">{stall.walkTime} walk</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function GateCard({ gate, index, isRecommended }: { gate: Gate; index: number; isRecommended: boolean }) {
  const CONGESTION_CONFIG = {
    low: { color: "text-accent", bg: "bg-accent/10 border-accent/20", label: "Low congestion" },
    medium: { color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", label: "Moderate" },
    high: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", label: "Busy — avoid if possible" },
  };
  const config = CONGESTION_CONFIG[gate.congestionLevel];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={cn("rounded-2xl p-4 border", isRecommended ? "border-primary/30 bg-primary/5" : "glass border-border")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", config.bg, "border")}>
            <DoorOpen className={cn("w-4 h-4", config.color)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{gate.name}</p>
              {isRecommended && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Use this
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Serves: {gate.serves.join(", ")}
            </p>
          </div>
        </div>
        <span className={cn("text-xs font-medium px-2 py-1 rounded-lg border", config.bg, config.color)}>
          {config.label}
        </span>
      </div>
    </motion.div>
  );
}

function FacilityCard({
  icon: Icon,
  name,
  detail,
  index,
}: {
  icon: React.ElementType;
  name: string;
  detail: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="glass rounded-2xl p-4 flex items-center gap-3"
    >
      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
      </div>
    </motion.div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// TODO(01:12): Develop venue navigation and section overview UI
// TODO(01:12): Optimize real-time coordination across flows