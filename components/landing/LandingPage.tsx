"use client";

import React from "react";
import { useMatchDayStore } from "@/lib/store";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import { motion, useInView, useScroll, useTransform, useSpring } from "framer-motion";
import { useRef, useEffect } from "react";
import { QrCode, Activity, LogOut, ChevronDown } from "lucide-react";

const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400" });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "700"] });

export function LandingPage() {
  const setStage = useMatchDayStore((state) => state.setStage);

  const heroRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const featuresRef = useRef(null);
  const howItWorksRef = useRef(null);

  const isFeaturesInView = useInView(featuresRef, { once: true, margin: "-100px" });
  const isHowItWorksInView = useInView(howItWorksRef, { once: true, margin: "-100px" });

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end end"],
  });

  // Smooth out the scroll progress to avoid jittery "slideshow" ticking from mouse wheels
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  // ─── Scroll-controlled video playback ───────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.pause();
    video.currentTime = 0;

    let rafId: number;

    const unsubscribe = smoothProgress.on("change", (scrollV: number) => {
      if (!video.duration || isNaN(video.duration)) return;

      const normalised = Math.min(Math.max(scrollV / 0.85, 0), 1);
      
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (video) video.currentTime = normalised * video.duration;
      });
    });

    return () => {
      unsubscribe();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [smoothProgress]);
  // ────────────────────────────────────────────────────────────────────────────

  // Visual transforms — scale/fade the video container as scroll progresses
  const videoScale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.85, 0.85]);
  const videoOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 0.4, 0.4]);
  const videoBorderRadius = useTransform(scrollYProgress, [0, 0.5], ["0px", "24px"]);

  // Hero title fades out quickly on first scroll movement
  const titleY = useTransform(scrollYProgress, [0, 0.25], [0, -80]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0]);

  // CTA fades in once the video is near its end (~80% scroll)
  // Give it a wide ramp so it feels cinematic, not abrupt
  const ctaY = useTransform(scrollYProgress, [0.6, 0.85], [40, 0]);
  const ctaOpacity = useTransform(scrollYProgress, [0.6, 0.85], [0, 1]);
  // Only allow pointer events once the CTA is visible
  const ctaPointerEvents = useTransform(scrollYProgress, (v) =>
    v >= 0.6 ? "auto" : "none"
  );

  // Scroll indicator fades out as soon as the user starts scrolling
  const chevronOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);

  return (
    <div
      className={`w-full bg-background min-h-screen text-foreground overflow-clip ${dmSans.className}`}
    >
      {/* ── SECTION 1 — SCROLL-DRIVEN VIDEO HERO ────────────────────────────── */}
      {/*
        h-[300vh] gives us 200vh of "sticky" scroll distance.
        The sticky container pins for that full distance, during which:
          0–85%  scroll → video plays to its last frame
          60–85% scroll → CTA fades in over the video
          85%+   scroll → section scrolls away normally, features section arrives
      */}
      <section ref={heroRef} className="relative w-full h-[300vh] bg-background">
        <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden">

          {/* Video layer */}
          <motion.div
            className="absolute inset-0 w-full h-full origin-center flex items-center justify-center z-0 overflow-hidden"
            style={{
              scale: videoScale,
              opacity: videoOpacity,
              borderRadius: videoBorderRadius,
            }}
          >
            <video
              ref={videoRef}
              src="/assets/Video_Generation_With_Three_Frames.mp4"
              muted
              playsInline
              preload="auto"
              className="w-full h-full object-cover origin-center"
            />
            {/* Subtle dark overlay so text always reads over the video */}
            <div className="absolute inset-0 bg-background/30 mix-blend-multiply" />
          </motion.div>

          {/* Initial hero title — fades out on first scroll */}
          <motion.div
            style={{ y: titleY, opacity: titleOpacity }}
            className="absolute z-10 flex flex-col items-center justify-center text-center px-4 w-full"
          >
            <h1
              className={`${bebas.className} text-[64px] md:text-[96px] text-foreground leading-[0.9] tracking-[-0.01em] drop-shadow-lg`}
            >
              {"MATCHDAY\nINTELLIGENCE"}
            </h1>
            <p className="mt-6 text-lg md:text-xl text-foreground/80 max-w-[480px] drop-shadow">
              Your personal AI concierge for match day at large sporting venues.
            </p>
          </motion.div>

          {/* Scroll indicator — disappears immediately on first scroll */}
          <motion.div
            style={{ opacity: chevronOpacity }}
            className="absolute bottom-10 z-10 flex flex-col items-center"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown className="w-8 h-8 text-foreground/50" />
            </motion.div>
            <div className="text-xs uppercase tracking-widest mt-2 font-medium text-foreground/30">
              Scroll
            </div>
          </motion.div>

          {/* Final-frame CTA — fades in as video reaches its last frame */}
          <motion.div
            style={{
              y: ctaY,
              opacity: ctaOpacity,
              pointerEvents: ctaPointerEvents as any,
            }}
            className="absolute z-20 flex flex-col items-center w-full px-4 text-center"
          >
            <h2
              className={`${bebas.className} text-[48px] md:text-[72px] text-foreground mb-6 drop-shadow-xl`}
            >
              Scan Your Tickets Now
            </h2>
            <button
              onClick={() => setStage("upload")}
              className="bg-primary hover:bg-primary/90 text-background px-8 py-4 rounded-xl font-bold text-[16px] shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer will-change-transform"
            >
              Start Experience →
            </button>
            <p className="mt-4 text-[13px] text-foreground/50 italic backdrop-blur-sm py-1 px-4 rounded-full bg-background/20">
              Powered by Google Maps & Gemini AI
            </p>
          </motion.div>

        </div>
      </section>

      {/* ── SECTION 2 — FEATURES ─────────────────────────────────────────────── */}
      <section
        className="bg-card py-[100px] relative z-10 border-t border-border/10"
        ref={featuresRef}
      >
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden"
            animate={isFeaturesInView ? "visible" : "hidden"}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.15 } },
            }}
          >
            {[
              {
                icon: <QrCode className="w-7 h-7" />,
                iconBg: "bg-primary/10",
                iconColor: "text-primary",
                borderHover: "hover:border-primary/50",
                title: "Scan any ticket",
                desc: "Upload your match ticket. Gemini Vision extracts your seat, gate, and stand in seconds — no manual entry.",
                tag: "Gemini 1.5 Pro",
                tagStyle: "bg-primary/10 text-primary border-primary/20",
              },
              {
                icon: <Activity className="w-7 h-7" />,
                iconBg: "bg-accent/10",
                iconColor: "text-accent",
                borderHover: "hover:border-accent/50",
                title: "Live crowd pulse",
                desc: "AI-estimated wait times for every zone — entry gates, food courts, restrooms — updated by match phase.",
                tag: "Gemini Flash",
                tagStyle: "bg-accent/10 text-accent border-accent/20",
              },
              {
                icon: <LogOut className="w-7 h-7" />,
                iconBg: "bg-foreground/10",
                iconColor: "text-foreground",
                borderHover: "hover:border-foreground/50",
                title: "Beat the crowds",
                desc: "Score-aware exit strategy. Gemini factors in the match minute, your stand, and transport mode to get you out faster.",
                tag: "Real-time Nav",
                tagStyle: "bg-foreground/10 text-foreground border-foreground/20",
              },
            ].map((card) => (
              <motion.div
                key={card.title}
                className={`bg-foreground/[0.03] border border-border/20 rounded-2xl p-8 ${card.borderHover} transition-all duration-300 hover:-translate-y-2 flex flex-col group shadow-lg`}
                variants={{
                  hidden: { opacity: 0, y: 40 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <div
                  className={`w-14 h-14 ${card.iconBg} rounded-xl flex items-center justify-center ${card.iconColor} mb-6 transition-transform group-hover:scale-110`}
                >
                  {card.icon}
                </div>
                <h3 className={`${bebas.className} text-[32px] text-foreground`}>
                  {card.title}
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-foreground/70 mb-8 flex-1">
                  {card.desc}
                </p>
                <div className="mt-auto">
                  <span
                    className={`inline-block px-3 py-1.5 rounded-lg text-xs font-semibold border ${card.tagStyle}`}
                  >
                    {card.tag}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 3 — HOW IT WORKS ─────────────────────────────────────────── */}
      <section className="bg-background py-[100px]" ref={howItWorksRef}>
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={
              isHowItWorksInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
            }
            className={`${bebas.className} text-[56px] text-foreground text-center mb-[80px]`}
          >
            How it works
          </motion.h2>

          <div className="relative">
            <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-px border-t border-dashed border-border/30 z-0" />

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 relative z-10"
              initial="hidden"
              animate={isHowItWorksInView ? "visible" : "hidden"}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.2 } },
              }}
            >
              {[
                {
                  num: "01",
                  numColor: "text-primary/10",
                  icon: <QrCode className="w-8 h-8 text-primary" />,
                  title: "Upload ticket",
                  desc: "Drag and drop your ticket image. Gemini Vision reads it fast.",
                },
                {
                  num: "02",
                  numColor: "text-accent/10",
                  icon: <Activity className="w-8 h-8 text-accent" />,
                  title: "Set preferences",
                  desc: "Food, transport, priorities — setup takes exactly 60 seconds.",
                },
                {
                  num: "03",
                  numColor: "text-foreground/5",
                  icon: <LogOut className="w-8 h-8 text-foreground" />,
                  title: "Game day, sorted",
                  desc: "Your full plan, live crowd intel, and interactive AI chat.",
                },
              ].map((step) => (
                <motion.div
                  key={step.num}
                  className="flex flex-col relative pt-4 md:items-center md:text-center text-left"
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0 },
                  }}
                >
                  <span
                    className={`${bebas.className} text-[80px] ${step.numColor} absolute -top-12 left-0 md:left-1/2 md:-translate-x-1/2 z-[-1]`}
                  >
                    {step.num}
                  </span>
                  <div className="w-20 h-20 bg-card border border-border/30 rounded-2xl flex items-center justify-center mb-6 mx-0 md:mx-auto shadow-2xl">
                    {step.icon}
                  </div>
                  <h4 className="text-[18px] font-bold text-foreground mb-3">
                    {step.title}
                  </h4>
                  <p className="text-[15px] text-foreground/60 max-w-[240px]">
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4 — TRUST BAR ────────────────────────────────────────────── */}
      <section className="bg-card border-t border-border/10 py-8 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 text-[13px] font-bold uppercase text-foreground/30 tracking-[0.15em]">
            {["Powered by Gemini AI", "Google Maps", "Next.js 14", "PromptWars"].map(
              (label, i, arr) => (
                <React.Fragment key={label}>
                  <span>{label}</span>
                  {i < arr.length - 1 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-border" />
                  )}
                </React.Fragment>
              )
            )}
          </div>
        </div>
      </section>
    </div>
  );
}