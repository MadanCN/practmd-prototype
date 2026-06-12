"use client";

import { useState, useMemo } from "react";
import {
  ChevronRight, ChevronLeft, Check, Video, MapPin, Phone, Clock,
  User, Shield, FileText, AlertCircle, CheckCircle2, Star, Loader2,
  CalendarDays, Zap, Heart, Brain, Pill, MessageSquare,
} from "lucide-react";
import { PROVIDERS } from "@/data/providers";
import { PATIENT_INSURANCES, PATIENT_HEALTH_PROFILE } from "@/data/patient-portal";
import { getBookedSlots } from "@/data/cc-appointments";
import { DAYS } from "@/data/clinics";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
function addMinutes(time: string, mins: number) {
  const [h, m] = time.split(":").map(Number);
  const t = h * 60 + m + mins;
  return `${Math.floor(t / 60).toString().padStart(2, "0")}:${(t % 60).toString().padStart(2, "0")}`;
}
function getDayName(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" }) as typeof DAYS[number];
}
function generateSlots(provider: (typeof PROVIDERS)[0], date: string, duration: number): string[] {
  const wh = provider.workingHours.find(w => w.day === getDayName(date));
  if (!wh || !wh.isOpen) return [];
  const slots: string[] = [];
  let cur = wh.openTime;
  while (cur < wh.closeTime) {
    const next = addMinutes(cur, duration);
    if (next > wh.closeTime) break;
    if (!(wh.breakStart && cur >= wh.breakStart && cur < wh.breakEnd!)) {
      slots.push(cur);
    }
    cur = next;
  }
  return slots;
}
function getNextAvailable(provider: (typeof PROVIDERS)[0], duration: number): string | null {
  for (let i = 1; i <= 14; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    const iso = d.toISOString().split("T")[0];
    const slots = generateSlots(provider, iso, duration);
    const booked = getBookedSlots(provider.id, iso);
    const free = slots.filter(s => !booked.includes(s));
    if (free.length > 0) return iso;
  }
  return null;
}

// ── Step config ───────────────────────────────────────────────────────────────

type VisitReason = {
  id: string; label: string; icon: React.ElementType;
  visitType: string; duration: number; description: string;
};

const VISIT_REASONS: VisitReason[] = [
  { id: "initial", label: "New Patient Evaluation", icon: Brain, visitType: "Initial Consultation", duration: 60, description: "Comprehensive psychiatric assessment for new patients" },
  { id: "followup", label: "Follow-Up Visit", icon: Heart, visitType: "Follow-Up", duration: 30, description: "Check-in on treatment progress and adjustments" },
  { id: "medication", label: "Medication Check", icon: Pill, visitType: "Medication Check", duration: 30, description: "Review of current medications and side effects" },
  { id: "therapy", label: "Therapy Session", icon: MessageSquare, visitType: "Therapy Session", duration: 60, description: "Individual therapy — CBT, DBT, and more" },
  { id: "crisis", label: "Crisis / Urgent", icon: Zap, visitType: "Initial Consultation", duration: 60, description: "Urgent mental health support — prioritized scheduling" },
];

type AppointmentMode = "in-person" | "telehealth" | "phone";

const MODES: { id: AppointmentMode; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "in-person", label: "In Person", icon: MapPin, desc: "Visit our clinic for a face-to-face appointment" },
  { id: "telehealth", label: "Telehealth", icon: Video, desc: "Video call from the comfort of your home" },
  { id: "phone", label: "Phone Call", icon: Phone, desc: "A phone consultation with your provider" },
];

// ── Component ─────────────────────────────────────────────────────────────────

type Step = "reason" | "mode" | "provider" | "datetime" | "insurance" | "notes" | "confirm" | "booked";

const STEPS: { id: Step; label: string }[] = [
  { id: "reason", label: "Visit Type" },
  { id: "mode", label: "Appointment Mode" },
  { id: "provider", label: "Choose Provider" },
  { id: "datetime", label: "Date & Time" },
  { id: "insurance", label: "Insurance" },
  { id: "notes", label: "Reason & Notes" },
  { id: "confirm", label: "Confirm" },
];

const STEP_ORDER: Step[] = ["reason", "mode", "provider", "datetime", "insurance", "notes", "confirm", "booked"];

export default function SchedulePage() {
  const [step, setStep] = useState<Step>("reason");
  const [selectedReason, setSelectedReason] = useState<VisitReason | null>(null);
  const [selectedMode, setSelectedMode] = useState<AppointmentMode | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [insurance] = useState(PATIENT_INSURANCES[0]);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [notes, setNotes] = useState("");
  const [accommodation, setAccommodation] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const selectedProvider = PROVIDERS.find(p => p.id === selectedProviderId);

  const availableProviders = useMemo(() => {
    return PROVIDERS.filter(p => {
      if (!p.isActive) return false;
      if (selectedMode === "telehealth" && !p.telehealthEnabled) return false;
      if (selectedReason && !p.visitTypes.includes(selectedReason.visitType)) return false;
      return true;
    });
  }, [selectedMode, selectedReason]);

  const effectiveProvider = selectedProvider
    ?? (selectedProviderId === "any" && availableProviders.length > 0 ? availableProviders[0] : undefined);

  // Slots for selected provider + date
  const allSlots = useMemo(() => {
    if (!effectiveProvider || !selectedDate || !selectedReason) return [];
    return generateSlots(effectiveProvider, selectedDate, selectedReason.duration);
  }, [effectiveProvider, selectedDate, selectedReason]);

  const bookedSlots = useMemo(() => {
    if (!effectiveProvider || !selectedDate) return [];
    return getBookedSlots(effectiveProvider.id, selectedDate);
  }, [effectiveProvider, selectedDate]);

  const currentIndex = STEP_ORDER.indexOf(step);

  function next() {
    const nextStep = STEP_ORDER[currentIndex + 1];
    if (nextStep) setStep(nextStep);
  }
  function back() {
    const prevStep = STEP_ORDER[currentIndex - 1];
    if (prevStep) setStep(prevStep);
  }

  function handleBook() {
    setBookingLoading(true);
    setTimeout(() => { setBookingLoading(false); setStep("booked"); }, 2000);
  }

  const canContinue: Record<Step, boolean> = {
    reason: !!selectedReason,
    mode: !!selectedMode,
    provider: !!selectedProviderId,
    datetime: !!(selectedDate && selectedSlot),
    insurance: true,
    notes: chiefComplaint.trim().length > 3,
    confirm: consentChecked,
    booked: true,
  };

  // ── Render helpers ──────────────────────────────────────────────────────────

  const INPUT = "w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500";

  // Calendar dates (next 14 days)
  const calDates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i + 1);
    return d.toISOString().split("T")[0];
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      {step !== "booked" && (
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Book an Appointment</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Follow the steps to schedule your visit</p>
        </div>
      )}

      {/* Progress bar */}
      {step !== "booked" && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, i) => {
              const si = STEP_ORDER.indexOf(s.id);
              const ci = STEP_ORDER.indexOf(step);
              return (
                <div key={s.id} className={cn("h-1.5 rounded-full flex-1 transition-colors",
                  si < ci ? "bg-emerald-500" : si === ci ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700")} />
              );
            })}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Step {currentIndex + 1} of {STEPS.length} — {STEPS.find(s => s.id === step)?.label}
          </p>
        </div>
      )}

      {/* ── STEP: Visit Reason ── */}
      {step === "reason" && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">What brings you in today?</h2>
          <div className="grid grid-cols-1 gap-3">
            {VISIT_REASONS.map(reason => {
              const Icon = reason.icon;
              const selected = selectedReason?.id === reason.id;
              return (
                <button key={reason.id} onClick={() => setSelectedReason(reason)}
                  className={cn("text-left p-4 rounded-2xl border-2 transition-all",
                    selected
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white dark:bg-slate-900/40")}>
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      selected ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400")}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{reason.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{reason.description}</p>
                    </div>
                    {selected && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-3 mt-2 ml-[52px]">
                    <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3" />{reason.duration} min</span>
                    <span className="text-xs text-slate-400">{reason.visitType}</span>
                    {reason.id === "crisis" && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-100 text-red-600">Priority</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP: Mode ── */}
      {step === "mode" && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">How would you like to meet?</h2>
          <div className="grid grid-cols-1 gap-3">
            {MODES.map(mode => {
              const Icon = mode.icon;
              const sel = selectedMode === mode.id;
              return (
                <button key={mode.id} onClick={() => setSelectedMode(mode.id)}
                  className={cn("text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4",
                    sel
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-emerald-300 bg-white dark:bg-slate-900/40")}>
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    sel ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{mode.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{mode.desc}</p>
                  </div>
                  {sel && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                </button>
              );
            })}
          </div>
          {selectedReason && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Booking a <strong>{selectedReason.visitType}</strong> ({selectedReason.duration} min)
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── STEP: Provider ── */}
      {step === "provider" && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Choose your provider</h2>
          {availableProviders.length === 0 && (
            <p className="text-sm text-slate-500 p-4 rounded-xl bg-slate-50 dark:bg-slate-800">No providers match your current filters. Try a different mode or visit type.</p>
          )}
          <div className="space-y-3">
            {/* No preference option */}
            <button onClick={() => setSelectedProviderId("any")}
              className={cn("w-full text-left p-4 rounded-2xl border-2 transition-all",
                selectedProviderId === "any"
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                  : "border-dashed border-slate-300 dark:border-slate-600 hover:border-emerald-300 bg-white dark:bg-slate-900/40")}>
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                  selectedProviderId === "any" ? "bg-emerald-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500")}>?</div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Preference</p>
                  <p className="text-xs text-slate-500">Book with the next available provider</p>
                </div>
                {selectedProviderId === "any" && <CheckCircle2 className="w-5 h-5 text-emerald-600 ml-auto" />}
              </div>
            </button>

            {availableProviders.map(p => {
              const sel = selectedProviderId === p.id;
              const nextAvail = getNextAvailable(p, selectedReason?.duration ?? 30);
              const preferred = p.id === PATIENT_HEALTH_PROFILE.preferredProviderId;
              return (
                <button key={p.id} onClick={() => setSelectedProviderId(p.id)}
                  className={cn("w-full text-left p-4 rounded-2xl border-2 transition-all",
                    sel
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-emerald-300 bg-white dark:bg-slate-900/40")}>
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ backgroundColor: p.color }}>
                      {p.firstName[0]}{p.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{p.displayName}</p>
                        {preferred && (
                          <span className="flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                            <Star className="w-2.5 h-2.5" /> Your Provider
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{p.providerType} · {p.credentials}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {p.specializations.slice(0, 3).map(s => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{s}</span>
                        ))}
                      </div>
                      {nextAvail && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" /> Next available: {fmtDate(nextAvail)}
                        </p>
                      )}
                    </div>
                    {sel && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-1" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP: Date & Time ── */}
      {step === "datetime" && effectiveProvider && (
        <div className="space-y-5">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Pick a date and time</h2>

          {/* Calendar grid */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Available Dates</p>
            <div className="grid grid-cols-7 gap-1.5">
              {calDates.map(iso => {
                const slots = generateSlots(effectiveProvider, iso, selectedReason?.duration ?? 30);
                const booked = getBookedSlots(effectiveProvider.id, iso);
                const available = slots.filter(s => !booked.includes(s)).length;
                const sel = selectedDate === iso;
                const d = new Date(iso + "T12:00:00");
                return (
                  <button key={iso} onClick={() => { if (available > 0) { setSelectedDate(iso); setSelectedSlot(""); } }}
                    disabled={available === 0}
                    className={cn("flex flex-col items-center p-2 rounded-xl text-center transition-all border",
                      sel ? "bg-emerald-600 border-emerald-600 text-white" :
                      available > 0 ? "border-slate-200 dark:border-slate-700 hover:border-emerald-400 bg-white dark:bg-slate-900/40 text-slate-700 dark:text-slate-300" :
                      "border-transparent bg-slate-50 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50"
                    )}>
                    <span className={cn("text-[10px] font-medium", sel ? "text-emerald-100" : "text-slate-400 dark:text-slate-500")}>
                      {d.toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                    <span className="text-sm font-bold">{d.getDate()}</span>
                    {available > 0 && !sel && (
                      <span className="text-[9px] text-emerald-500">{available}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time slots */}
          {selectedDate && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Available times — {fmtDate(selectedDate)}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {allSlots.map(slot => {
                  const isBooked = bookedSlots.includes(slot);
                  const sel = selectedSlot === slot;
                  return (
                    <button key={slot} disabled={isBooked} onClick={() => !isBooked && setSelectedSlot(slot)}
                      className={cn("py-2.5 rounded-xl text-xs font-medium border transition-all",
                        isBooked && "opacity-40 cursor-not-allowed border-transparent bg-slate-100 dark:bg-slate-800 text-slate-400",
                        sel && "bg-emerald-600 border-emerald-600 text-white shadow-sm",
                        !isBooked && !sel && "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 bg-white dark:bg-slate-900/40"
                      )}>
                      {fmt12(slot)}
                    </button>
                  );
                })}
              </div>
              {allSlots.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No available slots on this day. Please select another date.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── STEP: Insurance ── */}
      {step === "insurance" && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Insurance Verification</h2>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900/40 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{insurance.provider} — {insurance.planName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Member ID: {insurance.memberId} · Group: {insurance.groupNumber}</p>
              </div>
              <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">Active</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Co-pay", val: `$${insurance.copay}` },
                { label: "Deductible", val: `$${insurance.deductibleMet} / $${insurance.deductible}` },
                { label: "Out-of-Pocket", val: `$${insurance.outOfPocketMet} / $${insurance.outOfPocketMax}` },
                { label: "Plan Type", val: insurance.planType },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{item.val}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Coverage Verified</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Your {insurance.provider} plan covers this visit type. Estimated co-pay: ${insurance.copay}.</p>
              </div>
            </div>
          </div>

          <button className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" /> Add Different Insurance
          </button>
        </div>
      )}

      {/* ── STEP: Notes ── */}
      {step === "notes" && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Tell us more</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Chief Complaint / Reason for Visit <span className="text-red-500">*</span>
            </label>
            <textarea rows={3} value={chiefComplaint} onChange={e => setChiefComplaint(e.target.value)}
              placeholder="Briefly describe what you'd like to discuss at this appointment…"
              className={cn(INPUT, "resize-none")} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Symptoms / Additional Context</label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Any symptoms, duration, previous treatments tried…"
              className={cn(INPUT, "resize-none")} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Special Accommodations</label>
            <input type="text" value={accommodation} onChange={e => setAccommodation(e.target.value)}
              placeholder="e.g., interpreter needed, mobility assistance, quiet room…"
              className={INPUT} />
          </div>
          {selectedReason?.id === "crisis" && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">
                If you are in immediate danger, please call <strong>988</strong> (Suicide & Crisis Lifeline) or <strong>911</strong>.
                This booking flow is for non-emergency urgent care.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── STEP: Confirm ── */}
      {step === "confirm" && effectiveProvider && selectedReason && selectedDate && selectedSlot && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Review & Confirm</h2>

          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/10 p-5 space-y-3">
            {[
              { label: "Visit Type", val: selectedReason.visitType },
              { label: "Provider", val: `${effectiveProvider.displayName}, ${effectiveProvider.credentials}` },
              { label: "Date", val: fmtDate(selectedDate) },
              { label: "Time", val: `${fmt12(selectedSlot)} (${selectedReason.duration} min)` },
              { label: "Mode", val: selectedMode === "telehealth" ? "Telehealth — Video Call" : selectedMode === "in-person" ? "In Person — Penfield Psychiatry" : "Phone Call" },
              { label: "Insurance", val: `${insurance.provider} (${insurance.memberId})` },
              { label: "Est. Co-pay", val: `$${insurance.copay}` },
              { label: "Reason", val: chiefComplaint },
            ].map(row => (
              <div key={row.label} className="flex gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400 w-28 shrink-0 pt-0.5">{row.label}</span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200 flex-1">{row.val}</span>
              </div>
            ))}
          </div>

          <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <input type="checkbox" checked={consentChecked} onChange={e => setConsentChecked(e.target.checked)}
              className="accent-emerald-600 w-4 h-4 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-700 dark:text-slate-300">
              I confirm this appointment and consent to treatment. I have read and agree to the{" "}
              <span className="font-semibold underline text-emerald-700 dark:text-emerald-400 cursor-pointer">Cancellation Policy</span>
              {selectedMode === "telehealth" && (
                <> and the{" "}
                <span className="font-semibold underline text-emerald-700 dark:text-emerald-400 cursor-pointer">Telehealth Consent</span>
                </>
              )}
              .{selectedMode === "telehealth" && " By joining this session, I consent to video-based care delivery."}
            </p>
          </label>
        </div>
      )}

      {/* ── BOOKED SUCCESS ── */}
      {step === "booked" && effectiveProvider && selectedReason && selectedDate && selectedSlot && (
        <div className="text-center space-y-6 py-8">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">You're all set!</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Your appointment has been confirmed</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/10 p-5 text-left space-y-3 max-w-sm mx-auto">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{selectedReason.visitType}</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">{effectiveProvider.displayName}</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">{fmtDate(selectedDate)} at {fmt12(selectedSlot)}</p>
            <p className="text-sm text-slate-500">{selectedMode === "telehealth" ? "📹 Telehealth — link will be sent before the visit" : "📍 " + "Penfield Psychiatry, 500 Penfield Road"}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Link href="/patient/visits"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors">
              <CalendarDays className="w-4 h-4" /> View My Appointments
            </Link>
            <Link href="/patient/home"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
              Back to Home
            </Link>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      {step !== "booked" && (
        <div className="flex items-center gap-3 pt-2">
          {currentIndex > 0 && (
            <button onClick={back}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          {step !== "confirm" ? (
            <button onClick={next} disabled={!canContinue[step]}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-40 transition-colors ml-auto">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleBook} disabled={!canContinue.confirm || bookingLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-40 transition-colors ml-auto">
              {bookingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {bookingLoading ? "Booking…" : "Confirm Appointment"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
