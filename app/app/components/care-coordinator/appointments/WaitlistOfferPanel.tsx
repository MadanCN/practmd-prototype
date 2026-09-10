"use client";

import { useState, useEffect, useRef } from "react";
import {
  CheckCircle2, Clock, Bell, Send, ChevronRight, SkipForward,
  UserCheck, UserX, AlertCircle,
} from "lucide-react";
import { type CcAppointment } from "@/data/cc-appointments";
import { type CcPatient } from "@/data/cc-patients";
import { CLINIC_CONFIG } from "@/data/cc-masters";
import { cn } from "@/lib/utils";

const PRIORITY_CONFIG = {
  crisis:  { label: "Crisis",  dot: "bg-red-500",   text: "text-red-700 dark:text-red-400",    bg: "bg-red-50 dark:bg-red-950/30",     border: "border-red-200 dark:border-red-800",     ring: "ring-red-400 dark:ring-red-600" },
  urgent:  { label: "Urgent",  dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-800", ring: "ring-amber-400 dark:ring-amber-600" },
  routine: { label: "Routine", dot: "bg-slate-400", text: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-800/50", border: "border-slate-200 dark:border-slate-700", ring: "ring-slate-400 dark:ring-slate-600" },
};

function fmt12(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatCountdown(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

type OfferResult = "accepted" | "declined" | "expired";

interface Props {
  freedSlot: { date: string; startTime: string; endTime: string };
  providerName: string;
  entries: CcAppointment[];       // already ranked: Crisis > Urgent > Routine + FIFO
  patientMap: Record<string, CcPatient>;
}

export default function WaitlistOfferPanel({ freedSlot, providerName, entries, patientMap }: Props) {
  // Which entry is selected (before sending offer)
  const [selectedId, setSelectedId] = useState<string>(entries[0]?.id ?? "");
  // Whether to auto-advance to next patient when timer expires / patient declines
  const [autoAdvance, setAutoAdvance] = useState(true);
  // Which entry currently has the active offer (null = waiting for staff to send)
  const [activeOfferId, setActiveOfferId] = useState<string | null>(null);
  // Results of past offers
  const [sentResults, setSentResults] = useState<Record<string, OfferResult>>({});
  // Countdown in seconds
  const [countdown, setCountdown] = useState(CLINIC_CONFIG.offerExpiryHrs * 3600);
  // Tracks if timer expired (to show banner before moving on)
  const [justExpired, setJustExpired] = useState(false);

  // Refs to avoid stale closures in the timer effect
  const autoAdvanceRef = useRef(autoAdvance);
  const sentResultsRef = useRef(sentResults);
  const activeOfferIdRef = useRef(activeOfferId);
  useEffect(() => { autoAdvanceRef.current = autoAdvance; }, [autoAdvance]);
  useEffect(() => { sentResultsRef.current = sentResults; }, [sentResults]);
  useEffect(() => { activeOfferIdRef.current = activeOfferId; }, [activeOfferId]);

  // Timer countdown
  useEffect(() => {
    if (!activeOfferId) return;
    if (countdown <= 0) {
      // Timer expired — resolve current offer as expired
      const expiredId = activeOfferIdRef.current;
      if (!expiredId) return;
      const newResults = { ...sentResultsRef.current, [expiredId]: "expired" as OfferResult };
      setSentResults(newResults);
      setActiveOfferId(null);
      setJustExpired(true);

      // Find next eligible
      const next = entries.find(e => !newResults[e.id]);
      if (next) {
        setSelectedId(next.id);
        if (autoAdvanceRef.current) {
          setTimeout(() => {
            setJustExpired(false);
            setActiveOfferId(next.id);
            setCountdown(CLINIC_CONFIG.offerExpiryHrs * 3600);
          }, 1200);
        }
      }
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [activeOfferId, countdown, entries]);

  function handleSendOffer() {
    if (!selectedId) return;
    setActiveOfferId(selectedId);
    setCountdown(CLINIC_CONFIG.offerExpiryHrs * 3600);
    setJustExpired(false);
  }

  function handleSimulate(result: "accepted" | "declined") {
    const currentId = activeOfferId;
    if (!currentId) return;
    const newResults = { ...sentResults, [currentId]: result };
    setSentResults(newResults);
    setActiveOfferId(null);

    if (result === "accepted") return; // Done!

    // Declined — find next
    const next = entries.find(e => !newResults[e.id]);
    if (!next) return;
    setSelectedId(next.id);
    if (autoAdvance) {
      // Auto-advance: send immediately after brief pause
      setTimeout(() => {
        setActiveOfferId(next.id);
        setCountdown(CLINIC_CONFIG.offerExpiryHrs * 3600);
      }, 800);
    }
  }

  // Derived state
  const acceptedEntry = entries.find(e => sentResults[e.id] === "accepted");
  const acceptedPatient = acceptedEntry ? patientMap[acceptedEntry.patientId] : null;
  const allExhausted = entries.length > 0 && entries.every(e => sentResults[e.id]) && !acceptedEntry;
  const activeEntry = entries.find(e => e.id === activeOfferId);
  const activePatient = activeEntry ? patientMap[activeEntry.patientId] : null;
  const eligibleEntries = entries.filter(e => !sentResults[e.id]);
  const nextEligibleAfterActive = activeEntry ? entries.find(e => !sentResults[e.id] && e.id !== activeOfferId) : null;

  // ── No waitlist entries ──────────────────────────────────────────────────────
  if (entries.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-600 text-center space-y-1">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No waitlist entries for {providerName}</p>
        <p className="text-xs text-slate-400">Freed slot is open on the calendar.</p>
      </div>
    );
  }

  // ── All done: accepted ────────────────────────────────────────────────────────
  if (acceptedPatient) {
    return (
      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Slot Confirmed!</p>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
            {acceptedPatient.displayName} accepted the slot — appointment created for {fmtDate(freedSlot.date)} at {fmt12(freedSlot.startTime)}.
          </p>
        </div>
      </div>
    );
  }

  // ── All exhausted: no one accepted ───────────────────────────────────────────
  if (allExhausted) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center space-y-1">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">All waitlisted patients offered — none accepted.</p>
        <p className="text-xs text-slate-400">Slot is open on the calendar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Freed slot info */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-lg">
        <AlertCircle className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        <span>Freed slot: <strong className="text-slate-700 dark:text-slate-300">{fmtDate(freedSlot.date)} · {fmt12(freedSlot.startTime)} – {fmt12(freedSlot.endTime)}</strong> · {providerName}</span>
      </div>

      {/* Expired banner */}
      {justExpired && !activeOfferId && (
        <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-3 py-2 rounded-lg">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          Patient did not respond — offer expired. {autoAdvance ? "Sending to next patient…" : "Select next patient to send offer."}
        </div>
      )}

      {/* Active offer section */}
      {activeEntry && activePatient && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 overflow-hidden">
          {/* Active patient header */}
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-xs font-bold text-amber-800 dark:text-amber-200 shrink-0">
              {activePatient.firstName[0]}{activePatient.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{activePatient.displayName}</p>
                {(() => {
                  const priority = activeEntry.waitlistPriority ?? "routine";
                  const cfg = PRIORITY_CONFIG[priority];
                  return (
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full", cfg.text, cfg.bg)}>
                      {cfg.label}
                    </span>
                  );
                })()}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Bell className="w-3 h-3 text-amber-600" />
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Offer sent via Email + SMS</p>
              </div>
            </div>
          </div>

          {/* Timer */}
          <div className="px-4 pb-3 space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="font-mono text-sm font-bold text-amber-700 dark:text-amber-400">{formatCountdown(countdown)}</span>
              <span className="text-xs text-amber-600 dark:text-amber-400">remaining</span>
              {nextEligibleAfterActive && (
                <span className="ml-auto text-[10px] text-slate-500">
                  Next: {patientMap[nextEligibleAfterActive.patientId]?.displayName}
                </span>
              )}
            </div>
            <div className="h-2 bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                style={{ width: `${(countdown / (CLINIC_CONFIG.offerExpiryHrs * 3600)) * 100}%` }} />
            </div>
          </div>

          {/* Demo simulate buttons */}
          <div className="px-4 pb-3 flex items-center gap-2 border-t border-amber-200 dark:border-amber-700 pt-3">
            <span className="text-[10px] text-amber-600 dark:text-amber-500 font-medium mr-auto">Simulate patient response:</span>
            <button onClick={() => handleSimulate("accepted")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors">
              <UserCheck className="w-3.5 h-3.5" />
              Accept
            </button>
            <button onClick={() => handleSimulate("declined")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors">
              <UserX className="w-3.5 h-3.5" />
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Waitlist queue */}
      {!activeOfferId && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Waitlist Queue — {eligibleEntries.length} patient{eligibleEntries.length !== 1 ? "s" : ""}
            </p>
            <span className="text-[10px] text-slate-400">Auto-ranked by priority + FIFO</span>
          </div>

          <div className="space-y-2">
            {entries.map((entry, idx) => {
              const result = sentResults[entry.id];
              const patient = patientMap[entry.patientId];
              const priority = entry.waitlistPriority ?? "routine";
              const cfg = PRIORITY_CONFIG[priority];
              const isSelected = selectedId === entry.id;
              const isEligible = !result;
              return (
                <div key={entry.id}
                  onClick={() => isEligible && setSelectedId(entry.id)}
                  className={cn(
                    "rounded-xl border p-3 transition-all",
                    result && "opacity-50 grayscale cursor-default",
                    !result && "cursor-pointer",
                    isSelected && !result && `ring-2 ${cfg.ring} ring-offset-1 dark:ring-offset-slate-900`,
                    !result ? cn(cfg.bg, cfg.border) : "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700",
                  )}>
                  <div className="flex items-center gap-3">
                    {/* Selection radio */}
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors",
                      isSelected && !result ? cn("border-current bg-current", cfg.text) : "border-slate-300 dark:border-slate-600"
                    )}>
                      {isSelected && !result && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>

                    {/* Rank */}
                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0", cfg.dot)}>
                      {idx + 1}
                    </div>

                    {/* Patient info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {patient?.displayName ?? "Unknown"}
                        </p>
                        <span className={cn("text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full", cfg.text, cfg.bg)}>
                          {cfg.label}
                        </span>
                        {idx === 0 && !result && (
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full font-semibold">
                            Top priority
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {entry.visitType} · WL #{entry.waitlistPosition}
                        {patient?.insuranceProvider && <> · {patient.insuranceProvider}</>}
                      </p>
                    </div>

                    {/* Result badge or next-in-queue indicator */}
                    <div className="shrink-0">
                      {result === "accepted" && <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">Accepted</span>}
                      {result === "declined" && <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-semibold">Declined</span>}
                      {result === "expired" && <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold">No Response</span>}
                      {!result && isSelected && <ChevronRight className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Auto-advance checkbox */}
          <label className={cn(
            "flex items-start gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors text-sm",
            autoAdvance
              ? "bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800"
              : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
          )}>
            <input type="checkbox" checked={autoAdvance} onChange={e => setAutoAdvance(e.target.checked)}
              className="accent-teal-600 w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">Auto-send to next patient if no response</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                When the {CLINIC_CONFIG.offerExpiryHrs}-hour offer window expires or patient declines, automatically send the slot to the next in queue.
              </p>
            </div>
          </label>

          {/* Send offer button */}
          {eligibleEntries.length > 0 && (
            <button onClick={handleSendOffer} disabled={!selectedId}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors">
              <Send className="w-4 h-4" />
              Send Slot Offer to {patientMap[entries.find(e => e.id === selectedId)?.patientId ?? ""]?.displayName ?? "Patient"}
            </button>
          )}
        </>
      )}

      {/* When active offer out — show remaining queue preview */}
      {activeOfferId && eligibleEntries.filter(e => e.id !== activeOfferId).length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Next in Queue</p>
          {eligibleEntries.filter(e => e.id !== activeOfferId).slice(0, 2).map((entry) => {
            const patient = patientMap[entry.patientId];
            const priority = entry.waitlistPriority ?? "routine";
            const cfg = PRIORITY_CONFIG[priority];
            return (
              <div key={entry.id} className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs", cfg.bg, cfg.border)}>
                <div className={cn("w-2 h-2 rounded-full shrink-0", cfg.dot)} />
                <span className="font-medium text-slate-700 dark:text-slate-300">{patient?.displayName}</span>
                <span className={cn("ml-auto font-semibold", cfg.text)}>{cfg.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
