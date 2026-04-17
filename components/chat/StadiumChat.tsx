// components/chat/StadiumChat.tsx
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Sparkles, Ticket, User, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMatchDayStore, ChatMessage, MatchPhase } from "@/lib/store";
import { toast } from "sonner";

const PHASE_PROMPTS: Record<MatchPhase, string[]> = {
  "pre-match": [
    "Best time to arrive?",
    "Food queue status?",
    "Which gate should I use?",
    "What to bring?",
  ],
  during: [
    "Should I grab food now?",
    "Restroom break strategy",
    "Update score in my plan",
    "Where's the nearest restroom?",
  ],
  "post-match": [
    "Plan my exit now",
    "Best gate to leave?",
    "Cab booking tip",
    "Update my plan — leaving early",
  ],
};

function ContextChipBar() {
  const { ticket, preferences } = useMatchDayStore();

  if (!ticket) return null;

  const chips: { emoji: string; text: string }[] = [];

  // Ticket info
  if (ticket.gate && ticket.gate !== "Not specified") {
    chips.push({ emoji: "🎟️", text: `${ticket.gate} · ${ticket.section || ticket.stand}${ticket.seat && ticket.seat !== "Not specified" ? ` · Seat ${ticket.seat}` : ""}` });
  }

  // Preferences
  const prefParts: string[] = [];
  if (preferences.foodPreference === "veg") prefParts.push("Vegetarian");
  if (preferences.foodPreference === "non-veg") prefParts.push("Non-veg");
  if (preferences.accessibilityNeeds) prefParts.push("Accessibility");
  if (preferences.priorities.includes("food")) prefParts.push("Food priority");
  if (prefParts.length > 0) {
    chips.push({ emoji: "👤", text: prefParts.join(" · ") });
  }

  // Location
  if (preferences.location) {
    const shortLoc = preferences.location.length > 20
      ? preferences.location.substring(0, 20) + "…"
      : preferences.location;
    chips.push({ emoji: "📍", text: `From ${shortLoc}` });
  }

  if (chips.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 pt-3 pb-2"
    >
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {chips.map((chip, i) => (
          <div
            key={i}
            className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/60 border border-border/50 backdrop-blur-sm"
          >
            <span className="text-xs">{chip.emoji}</span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{chip.text}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function StadiumChat() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    ticket,
    preferences,
    venueInfo,
    plan,
    chatHistory,
    matchPhase,
    crowdData,
    addChatMessage,
    setPlan,
  } = useMatchDayStore();

  const quickPrompts = useMemo(() => PHASE_PROMPTS[matchPhase] || PHASE_PROMPTS["pre-match"], [matchPhase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  async function sendMessage(text: string, planUpdate = false) {
    if (!text.trim() || isLoading || !ticket) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    addChatMessage(userMsg);
    setInput("");
    setIsLoading(true);

    // Detect plan-update intent from keywords
    const updateKeywords = ["update", "plan", "leaving", "leave early", "change", "raining", "food now", "kid", "score"];
    const isPlanUpdate = planUpdate || updateKeywords.some((kw) => text.toLowerCase().includes(kw));

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
          planUpdate: isPlanUpdate,
        }),
      });

      if (!res.ok) throw new Error("Chat failed");
      const { response, updatedPlan } = await res.json();

      addChatMessage({
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      });

      if (updatedPlan) {
        setPlan(updatedPlan);
        toast.success("Your plan was updated!");
      }
    } catch {
      toast.error("Couldn't get a response. Try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Context chip bar — shows what the AI knows */}
      <ContextChipBar />

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {chatHistory.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Your stadium concierge is ready
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              I know your seat, preferences, and plan. Ask me anything!
            </p>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {chatHistory.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mr-2 mt-auto mb-1 flex-shrink-0">
                  <Sparkles className="w-3 h-3 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "glass rounded-bl-sm text-foreground"
                )}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-3 h-3 text-primary" />
            </div>
            <div className="glass rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Match-phase-aware quick prompts */}
      {chatHistory.length < 2 && (
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                className="flex-shrink-0 px-3 py-2 rounded-xl bg-muted text-xs text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors border border-border"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 pb-safe pb-4 pt-2 border-t border-border">
        <div className="flex items-end gap-2 glass rounded-2xl px-4 py-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about food, gates, timing..."
            rows={1}
            className="flex-1 bg-transparent resize-none text-sm text-foreground placeholder:text-muted-foreground outline-none py-2 max-h-24"
            style={{ lineHeight: "1.5" }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all",
              input.trim() && !isLoading
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}