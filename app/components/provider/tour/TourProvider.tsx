"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  PROVIDER_TOURS, tourIdForPath, isTourMainRoute, tourSeenKey,
  type TourPageId, type TourDef,
} from "@/lib/provider-tours";
import { TourLayer } from "./TourLayer";

type Phase = "idle" | "welcome" | "running";

interface TourContextValue {
  pageId: TourPageId | null;
  def: TourDef | null;
  phase: Phase;
  step: number;
  helpOpen: boolean;
  onLastStep: boolean;
  start(): void;
  next(): void;
  back(): void;
  skip(): void;
  toggleHelp(): void;
  closeHelp(): void;
  replay(): void;
}

const TourContext = createContext<TourContextValue | null>(null);
export const useTour = () => useContext(TourContext);

function seen(id: TourPageId) {
  try { return !!window.localStorage.getItem(tourSeenKey(id)); } catch { return false; }
}
function markSeen(id: TourPageId) {
  try { window.localStorage.setItem(tourSeenKey(id), "seen"); } catch { /* private mode */ }
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageId = tourIdForPath(pathname);
  const def = pageId ? PROVIDER_TOURS[pageId] : null;
  const total = def?.steps.length ?? 0;

  const [phase, setPhase] = useState<Phase>("idle");
  const [step, setStep] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);

  // Reset everything when the route changes — the React "adjust state during
  // render" pattern (not an effect, so no cascading-render lint).
  const [prevPath, setPrevPath] = useState(pathname);
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setPhase("idle");
    setStep(0);
    setHelpOpen(false);
  }

  // First visit to a nav main page → pop the welcome card once the page has
  // had a moment to render. setState lives in the timer callback, not the
  // effect body.
  useEffect(() => {
    if (!pageId || !isTourMainRoute(pathname) || phase !== "idle") return;
    if (seen(pageId)) return;
    const t = window.setTimeout(() => setPhase("welcome"), 650);
    return () => window.clearTimeout(t);
  }, [pageId, pathname, phase]);

  const onLastStep = phase === "running" && step >= total - 1;

  const value: TourContextValue = {
    pageId, def, phase, step, helpOpen, onLastStep,
    start: () => { setHelpOpen(false); setStep(0); setPhase("running"); },
    next: () => {
      if (step >= total - 1) {
        if (pageId) markSeen(pageId);
        setPhase("idle");
        setStep(0);
      } else {
        setStep(step + 1);
      }
    },
    back: () => setStep(Math.max(0, step - 1)),
    skip: () => {
      if (pageId) markSeen(pageId);
      setPhase("idle");
      setStep(0);
    },
    toggleHelp: () => {
      if (phase === "welcome") return;
      setHelpOpen(!helpOpen);
    },
    closeHelp: () => setHelpOpen(false),
    replay: () => { setHelpOpen(false); setStep(0); setPhase("running"); },
  };

  return (
    <TourContext.Provider value={value}>
      {children}
      <TourLayer />
    </TourContext.Provider>
  );
}
