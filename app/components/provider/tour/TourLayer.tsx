"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Compass, X, HelpCircle, Play, BookOpen, Video, Keyboard, Sparkles, LifeBuoy, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTour } from "./TourProvider";

interface Rect { x: number; y: number; w: number; h: number; }

const CARD_W = 340;
const CARD_H_EST = 210;
const MARGIN = 14;
const PAD = 8;

export function TourLayer() {
  const tour = useTour();
  const [rect, setRect] = useState<Rect | null>(null);

  const phase = tour?.phase ?? "idle";
  const stepIndex = tour?.step ?? 0;
  const def = tour?.def ?? null;
  const targetKey = def?.steps[stepIndex]?.target;

  // Lock body scroll while the welcome card is up.
  useEffect(() => {
    if (phase !== "welcome") return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [phase]);

  // Measure the current step's target. All setRect calls sit inside rAF /
  // timeout / event handlers, never the effect body.
  useEffect(() => {
    if (phase !== "running" || !targetKey) return;
    const selector = `[data-tour="${targetKey}"]`;

    const measure = () => {
      const el = document.querySelector(selector);
      if (!el) { setRect(null); return; }
      const b = el.getBoundingClientRect();
      setRect({ x: b.left, y: b.top, w: b.width, h: b.height });
    };

    document.querySelector(selector)?.scrollIntoView({ block: "center", behavior: "smooth" });

    let raf = requestAnimationFrame(() => { measure(); raf = requestAnimationFrame(measure); });
    const settle = window.setTimeout(measure, 380);
    const onMove = () => measure();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [phase, targetKey]);

  // Esc closes the help panel / skips the tour.
  useEffect(() => {
    if (phase === "idle" && !tour?.helpOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (tour?.helpOpen) tour.closeHelp();
      else if (phase === "running" || phase === "welcome") tour?.skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, tour]);

  if (!tour || typeof document === "undefined") return null;
  if (phase === "idle" && !tour.helpOpen) return null;

  const nodes: React.ReactNode[] = [];

  // ── Welcome ──────────────────────────────────────────────────────────
  if (phase === "welcome" && def) {
    nodes.push(
      <div key="welcome" className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/55 p-4">
        <div className="w-[400px] max-w-full rounded-2xl bg-white dark:bg-slate-900 p-7 text-center shadow-[0_24px_60px_-16px_rgba(0,43,97,0.3),0_60px_100px_-40px_rgba(0,43,97,0.25)]">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950/40">
            <Compass className="h-6 w-6 text-brand-600 dark:text-brand-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{def.welcome.title}</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{def.welcome.body}</p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button onClick={tour.skip} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
              Skip for now
            </button>
            <button onClick={tour.start} className="rounded-lg practmd-gradient px-5 py-2 text-sm font-semibold text-white">
              Start tour
            </button>
          </div>
          <p className="mt-4 text-[11px] text-slate-400">
            Replay it anytime from the <span className="font-semibold text-slate-500 dark:text-slate-300">?</span> in the top bar.
          </p>
        </div>
      </div>,
    );
  }

  // ── Coach-marks ──────────────────────────────────────────────────────
  if (phase === "running" && def) {
    const step = def.steps[stepIndex];
    const isHelp = step.target === "help";
    const total = def.steps.length;

    let spot: Rect | null = null;
    if (rect) {
      const maxH = window.innerHeight - 120;
      const top = Math.max(rect.y - PAD, 12);
      const bottom = Math.min(rect.y + rect.h + PAD, window.innerHeight - 12);
      spot = {
        x: rect.x - PAD,
        y: top,
        w: rect.w + PAD * 2,
        h: Math.min(bottom - top, maxH),
      };
    }

    let cardX: number;
    let cardY: number;
    if (isHelp) {
      cardX = window.innerWidth - CARD_W - 20;
      cardY = 68;
    } else if (spot) {
      cardY = spot.y + spot.h + MARGIN;
      if (cardY + CARD_H_EST > window.innerHeight - 16) cardY = spot.y - CARD_H_EST - MARGIN;
      if (cardY < 16) cardY = 16;
      cardX = spot.x + spot.w / 2 - CARD_W / 2;
      cardX = Math.max(16, Math.min(cardX, window.innerWidth - CARD_W - 16));
    } else {
      cardX = window.innerWidth / 2 - CARD_W / 2;
      cardY = window.innerHeight / 2 - CARD_H_EST / 2;
    }

    nodes.push(
      <div key="scrim" className="fixed inset-0 z-[190] cursor-pointer" onClick={tour.next} />,
      spot && (
        <div
          key="spot"
          className="pointer-events-none fixed z-[191] rounded-[10px] transition-[top,left,width,height] duration-300 ease-out"
          style={{
            top: spot.y, left: spot.x, width: spot.w, height: spot.h,
            boxShadow: "0 0 0 3px #03d3bf, 0 0 0 9999px rgba(15,23,42,0.6)",
          }}
        />
      ),
      <div
        key="coach"
        className="fixed z-[195] w-[340px] rounded-2xl bg-white p-4 pt-4 shadow-[0_22px_48px_-14px_rgba(0,43,97,0.34),0_0_0_1px_rgba(0,43,97,0.05)] transition-[top,left] duration-300 ease-out dark:bg-slate-900"
        style={{ top: cardY, left: cardX }}
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
            {stepIndex + 1} / {total}
          </span>
          <span className="text-[11px] font-semibold text-slate-400">{def.pageName} tour</span>
          <button onClick={tour.skip} className="ml-auto text-slate-300 hover:text-slate-500">
            <X className="h-4 w-4" />
          </button>
        </div>
        <h3 className="text-[15px] font-bold text-slate-900 dark:text-slate-100">{step.title}</h3>
        <p className="mt-1 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{step.body}</p>
        <div className="my-3 flex gap-1.5">
          {def.steps.map((_, i) => (
            <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i <= stepIndex ? "bg-brand-500" : "bg-slate-200 dark:bg-slate-700")} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={tour.skip} className="px-1.5 py-2 text-[12.5px] font-semibold text-slate-400 hover:text-slate-600">
            Skip tour
          </button>
          {stepIndex > 0 && (
            <button onClick={tour.back} className="ml-auto rounded-lg border border-slate-200 px-3.5 py-2 text-[12.5px] font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              Back
            </button>
          )}
          <button
            onClick={tour.next}
            className={cn("rounded-lg practmd-gradient px-4 py-2 text-[12.5px] font-semibold text-white", stepIndex === 0 && "ml-auto")}
          >
            {stepIndex === total - 1 ? "Finish" : "Next"}
          </button>
        </div>
      </div>,
    );
  }

  // ── Help panel ───────────────────────────────────────────────────────
  if (tour.helpOpen && def) {
    nodes.push(
      <div key="help-back" className="fixed inset-x-0 bottom-0 top-[60px] z-[200] bg-slate-900/20" onClick={tour.closeHelp} />,
      <div key="help" className="fixed right-0 top-[60px] z-[201] flex h-[calc(100%-60px)] w-[420px] max-w-full flex-col border-l border-slate-200 bg-white shadow-[-18px_0_50px_-16px_rgba(0,43,97,0.2)] dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-[60px] items-center gap-2.5 border-b border-slate-100 px-4 dark:border-slate-800">
          <HelpCircle className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Help</span>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
            {def.pageName}
          </span>
          <button onClick={tour.closeHelp} className="ml-auto text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-3 pt-5">
          <p className="mb-4 text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">{def.helpIntro}</p>
          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">In this section</p>
          {def.helpDoc.map((b) => (
            <div key={b.h} className="border-t border-slate-100 py-2.5 first:border-t-0 dark:border-slate-800">
              <h4 className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{b.h}</h4>
              <p className="mt-0.5 text-[12.5px] leading-snug text-slate-500 dark:text-slate-400">{b.p}</p>
            </div>
          ))}

          <p className="mb-1 mt-5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Help resources</p>
          {[
            { icon: BookOpen, label: "Knowledge base", ext: true },
            { icon: Video, label: "Video walkthroughs", ext: true },
            { icon: Keyboard, label: "Keyboard shortcuts" },
            { icon: Sparkles, label: "What's new" },
            { icon: LifeBuoy, label: "Contact support", note: "~2 hr reply" },
          ].map((r) => (
            <div key={r.label} className="flex items-center gap-2.5 border-t border-slate-100 py-2.5 text-[13px] text-slate-600 first:border-t-0 dark:border-slate-800 dark:text-slate-300">
              <r.icon className="h-[15px] w-[15px] text-slate-400" />
              {r.label}
              {r.note && <span className="ml-auto text-[11px] text-slate-400">{r.note}</span>}
              {r.ext && <ArrowRight className="ml-auto h-3.5 w-3.5 -rotate-45 text-slate-300" />}
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <button onClick={tour.replay} className="flex w-full items-center justify-center gap-2 rounded-lg practmd-gradient py-2.5 text-[13px] font-bold text-white">
            <Play className="h-3.5 w-3.5" /> Take the {def.pageName} tour again
          </button>
          <p className="mt-2.5 text-center text-[11px] text-slate-400">
            Was this helpful?
            <button className="mx-1 font-semibold text-brand-600 hover:underline dark:text-brand-400">Yes</button>·
            <button className="mx-1 font-semibold text-brand-600 hover:underline dark:text-brand-400">No</button>
          </p>
        </div>
      </div>,
    );
  }

  return createPortal(<>{nodes}</>, document.body);
}
