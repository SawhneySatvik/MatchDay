// components/ticket/TicketUpload.tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Ticket, Loader2, CheckCircle2, AlertCircle, Clock, MapPin, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMatchDayStore, TicketData } from "@/lib/store";
import { toast } from "sonner";

const STORAGE_KEY = "matchday_saved_tickets";

type UploadState = "idle" | "loading" | "success" | "error";

export function TicketUpload() {
  const [state, setState] = useState<UploadState>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { setTicket, setStage, savedSessions, setSavedSessions, restoreSession } = useMatchDayStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  function clearSavedSessions() {
    setSavedSessions([]);
    toast.success("Recent sessions cleared");
  }

  function loadSavedSession(session: any) {
    restoreSession(session);
    toast.success(`Resumed ${session.ticket?.match}`);
  }

  const processTicket = async (file: File) => {
    setState("loading");

    // Convert to base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]); // strip data URI prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    try {
      const res = await fetch("/api/extract-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      });

      if (!res.ok) throw new Error("Extraction failed");
      const { ticket } = await res.json();

      setTicket(ticket);
      setState("success");

      setTimeout(() => {
        setStage("onboarding");
      }, 1200);
    } catch {
      setState("error");
      toast.error("Couldn't read this ticket. Try a clearer photo.");
    }
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      const previewURL = URL.createObjectURL(file);
      setPreview(previewURL);
      processTicket(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".heic"] },
    maxFiles: 1,
    disabled: state === "loading" || state === "success",
  });

  return (
    <div className="flex flex-col items-center gap-6 max-w-lg mx-auto lg:py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <Ticket className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-medium text-primary tracking-wide uppercase">
            Step 1 of 5
          </span>
        </div>
        <h1
          className="text-3xl font-bold tracking-tight mb-2"
          style={{ fontFamily: "var(--font-syne, system-ui)" }}
        >
          Upload your ticket
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Photo or screenshot — we'll scan it instantly
        </p>
      </motion.div>

      {/* Drop zone */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full"
      >
        <div
          {...getRootProps()}
          className={cn(
            "relative w-full rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-card",
            state === "loading" && "pointer-events-none",
            state === "success" && "border-accent/50 bg-accent/5"
          )}
        >
          <input {...getInputProps()} />

          <AnimatePresence mode="wait">
            {preview && (state === "loading" || state === "success") ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative"
              >
                {/* Ticket image preview */}
                <img
                  src={preview}
                  alt="Ticket preview"
                  className="w-full max-h-64 object-contain p-4 opacity-60"
                />
                {/* Scan overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur-sm">
                  {state === "loading" ? (
                    <>
                      <div className="relative">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">
                          Reading your ticket...
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Gemini Vision is extracting match details
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-10 h-10 text-accent" />
                      <p className="text-sm font-medium text-accent">
                        Ticket scanned!
                      </p>
                    </>
                  )}
                </div>
              </motion.div>
            ) : state === "error" ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3 py-12 px-6"
              >
                <AlertCircle className="w-10 h-10 text-destructive" />
                <div className="text-center">
                  <p className="text-sm font-medium">Couldn't read ticket</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tap to try again with a clearer image
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-4 py-12 px-6"
              >
                <div
                  className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200",
                    isDragActive
                      ? "bg-primary text-primary-foreground scale-110"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Upload className="w-7 h-7" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {isDragActive ? "Drop it here" : "Tap to upload ticket"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, HEIC, WebP — any format works
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Demo hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-xs text-muted-foreground text-center"
      >
        Works with IPL, Test matches, ISL, Concerts & more
      </motion.p>

      {/* Saved tickets (Recent Sessions) */}
      {mounted && savedSessions && savedSessions.length > 0 && state === "idle" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Recent Sessions
            </p>
            <button
              onClick={clearSavedSessions}
              className="text-xs text-muted-foreground hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          </div>
          {savedSessions.map((session, i) => {
            const ticket = session.ticket;
            if (!ticket) return null;
            return (
              <motion.button
                key={`${ticket.match}-${ticket.venue}-${i}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.06 }}
                onClick={() => loadSavedSession(session)}
                className="w-full glass rounded-2xl p-4 flex items-center gap-3 text-left hover:bg-card/80 transition-colors active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <Ticket className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{ticket.match}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate">{ticket.venue}</span>
                    </div>
                    {ticket.date && ticket.date !== "Not specified" && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{ticket.date}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}