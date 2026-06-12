"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft, ChevronRight, Check, Video, MapPin, Phone, Clock,
  Search, User, CalendarDays, CheckCircle2, Loader2,
} from "lucide-react";
import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import { PROVIDERS } from "@/data/providers";
import { CC_PATIENTS } from "@/data/cc-patients";
import { getBookedSlots } from "@/data/cc-appointments";
import { DAYS } from "@/data/clinics";
import { cn } from "@/lib/utils";

// ── Constants ─────────────────────────────────────────────────────────────────

const CURRENT_PROVIDER_ID = "p1";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}
function fmtDateShort(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
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
function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

// ── Visit type config ─────────────────────────────────────────────────────────

const VISIT_TYPE_DURATION: Record<string, number> = {
  "Initial Consultation": 60,
  "Follow-Up": 30,
  "Medication Check": 30,
  "Therapy Session": 60,
  "Group Session": 90,
  "Telehealth Consultation": 30,
};

// ── Mode config ───────────────────────────────────────────────────────────────

type AppointmentMode = "in-person" | "telehealth" | "phone";

const MODES: { id: AppointmentMode; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "in-person", label: "In Person", icon: MapPin, desc: "Patient visits the clinic" },
  { id: "telehealth", label: "Telehealth", icon: Video, desc: "Video call appointment" },
  { id: "phone", label: "Phone", icon: Phone, desc: "Phone consultation" },
];

// ── Steps ─────────────────────────────────────────────────────────────────────

type Step = "patient" | "visittype" | "mode" | "datetime" | "notes" | "confirm" | "booked";

const STEP_ORDER: Step[] = ["patient", "visittype", "mode", "datetime", "notes", "confirm", "booked"];

const STEP_LABELS: Record<Step, string> = {
  patient: "Select Patient",
  visittype: "Visit Type",
  mode: "Mode",
  datetime: "Date & Time",
  notes: "Notes",
  confirm: "Confirm",
  booked: "Booked",
};

const VISIBLE_STEPS: Step[] = ["patient", "visittype", "mode", "datetime", "notes", "confirm"];

// ── Calendar helpers ──────────────────────────────────────────────────────────

function buildCalendar(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = (first.getDay() + 6) % 7; // Mon=0
  const days: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= last.getDate(); i++) days.push(i);
  return days;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ProviderNewAppointmentPage() {
  const provider = PROVIDERS.find(p => p.id === CURRENT_PROVIDER_ID)!;

  const [step, setStep] = useState<Step>("patient");
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedVisitType, setSelectedVisitType] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<AppointmentMode | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  const selectedPatient = CC_PATIENTS.find(p => p.id === selectedPatientId) ?? null;
  const duration = selectedVisitType ? (VISIT_TYPE_DURATION[selectedVisitType] ?? 60) : 60;

  // Filtered patients
  const filteredPatients = useMemo(() => {
    const q = patientSearch.toLowerCase();
    if (!q) return CC_PATIENTS;
    return CC_PATIENTS.filter(p =>
      p.displayName.toLowerCase().includes(q) ||
      p.mrn.toLowerCase().includes(q) ||
      p.dob.includes(q)
    );
  }, [patientSearch]);

  // Calendar days
  const calDays = useMemo(() => buildCalendar(calYear, calMonth), [calYear, calMonth]);

  // Available slots for selected date
  const availableSlots = useMemo(() => {
    if (!selectedDate) return [];
    const all = generateSlots(provider, selectedDate, duration);
    const booked = getBookedSlots(provider.id, selectedDate);
    return all.filter(s => !booked.includes(s));
  }, [selectedDate, duration, provider]);

  function stepIndex(s: Step) { return STEP_ORDER.indexOf(s); }
  function goNext() {
    const idx = stepIndex(step);
    if (idx < STEP_ORDER.length - 1) setStep(STEP_ORDER[idx + 1]);
  }
  function goBack() {
    const idx = stepIndex(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  }

  function handleBook() {
    setBooking(true);
    setTimeout(() => {
      setBooking(false);
      setStep("booked");
    }, 1200);
  }

  function isDateAvailable(day: number) {
    const iso = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const todayIso = today.toISOString().split("T")[0];
    if (iso <= todayIso) return false;
    const slots = generateSlots(provider, iso, duration);
    const booked = getBookedSlots(provider.id, iso);
    return slots.some(s => !booked.includes(s));
  }

  const canProceed = (() => {
    if (step === "patient") return !!selectedPatientId;
    if (step === "visittype") return !!selectedVisitType;
    if (step === "mode") return !!selectedMode;
    if (step === "datetime") return !!selectedDate && !!selectedTime;
    return true;
  })();

  // ── Booked state ─────────────────────────────────────────────────────────────
  if (step === "booked") {
    return (
      <ProviderLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">Appointment Booked</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {selectedPatient?.displayName} — {selectedVisitType} on {selectedDate ? fmtDateShort(selectedDate) : ""} at {selectedTime ? fmt12(selectedTime) : ""}
          </p>
          <button
            onClick={() => {
              setStep("patient");
              setSelectedPatientId(null);
              setSelectedVisitType(null);
              setSelectedMode(null);
              setSelectedDate(null);
              setSelectedTime(null);
              setNotes("");
              setPatientSearch("");
            }}
            className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors"
          >
            Book Another Appointment
          </button>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout>
      <div className="p-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">New Appointment</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Book an appointment for a patient</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto">
          {VISIBLE_STEPS.map((s, i) => {
            const done = stepIndex(step) > stepIndex(s);
            const active = step === s;
            return (
              <div key={s} className="flex items-center gap-1 shrink-0">
                <div className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold border-2 transition-all",
                  done ? "bg-violet-600 border-violet-600 text-white" :
                  active ? "border-violet-600 text-violet-600 bg-white dark:bg-slate-900" :
                  "border-slate-300 dark:border-slate-700 text-slate-400"
                )}>
                  {done ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                <span className={cn("text-xs hidden sm:block", active ? "text-violet-600 font-semibold" : done ? "text-slate-400" : "text-slate-400")}>
                  {STEP_LABELS[s]}
                </span>
                {i < VISIBLE_STEPS.length - 1 && (
                  <div className={cn("w-6 h-0.5 mx-1", done ? "bg-violet-600" : "bg-slate-200 dark:bg-slate-700")} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="space-y-4">

          {/* Step 1: Select Patient */}
          {step === "patient" && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Select Patient</h2>
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  value={patientSearch}
                  onChange={e => setPatientSearch(e.target.value)}
                  placeholder="Search by name, MRN, or date of birth…"
                  className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 outline-none"
                />
              </div>
              <div className="space-y-2 max-h-[420px] overflow-y-auto">
                {filteredPatients.length === 0 ? (
                  <div className="text-center py-8 text-sm text-slate-400">No patients found.</div>
                ) : filteredPatients.map(patient => {
                  const selected = selectedPatientId === patient.id;
                  return (
                    <button
                      key={patient.id}
                      onClick={() => setSelectedPatientId(patient.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                        selected
                          ? "border-violet-600 bg-violet-50 dark:bg-violet-950/20"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-violet-300 hover:bg-violet-50/40 dark:hover:bg-violet-950/10"
                      )}
                    >
                      <div className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                        selected ? "bg-violet-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      )}>
                        {patient.firstName[0]}{patient.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm font-semibold", selected ? "text-violet-800 dark:text-violet-300" : "text-slate-800 dark:text-slate-200")}>
                          {patient.displayName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {patient.mrn} · DOB {patient.dob} · Age {calcAge(patient.dob)}
                        </p>
                      </div>
                      {selected && <Check className="w-4 h-4 text-violet-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Visit Type */}
          {step === "visittype" && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Visit Type</h2>
              {selectedPatient && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-600 dark:text-slate-400">
                  <User className="w-4 h-4 shrink-0" />
                  Booking for: <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedPatient.displayName}</span>
                </div>
              )}
              <div className="space-y-2">
                {provider.visitTypes.map(vt => {
                  const dur = VISIT_TYPE_DURATION[vt] ?? 60;
                  const selected = selectedVisitType === vt;
                  return (
                    <button
                      key={vt}
                      onClick={() => setSelectedVisitType(vt)}
                      className={cn(
                        "w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all",
                        selected
                          ? "border-violet-600 bg-violet-50 dark:bg-violet-950/20"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-violet-300"
                      )}
                    >
                      <div className={cn(
                        "flex-1",
                        selected ? "text-violet-800 dark:text-violet-300" : "text-slate-800 dark:text-slate-200"
                      )}>
                        <p className="text-sm font-semibold">{vt}</p>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {dur} minutes
                        </p>
                      </div>
                      {selected && <Check className="w-4 h-4 text-violet-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Mode */}
          {step === "mode" && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Appointment Mode</h2>
              <div className="space-y-2">
                {MODES.map(m => {
                  const ModeIcon = m.icon;
                  const selected = selectedMode === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMode(m.id)}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all",
                        selected
                          ? "border-violet-600 bg-violet-50 dark:bg-violet-950/20"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-violet-300"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        selected ? "bg-violet-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      )}>
                        <ModeIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className={cn("text-sm font-semibold", selected ? "text-violet-800 dark:text-violet-300" : "text-slate-800 dark:text-slate-200")}>
                          {m.label}
                        </p>
                        <p className="text-xs text-slate-400">{m.desc}</p>
                      </div>
                      {selected && <Check className="w-4 h-4 text-violet-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Date & Time */}
          {step === "datetime" && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Date &amp; Time</h2>

              {/* Calendar */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                {/* Month nav */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => {
                      if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
                      else setCalMonth(m => m - 1);
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {new Date(calYear, calMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </span>
                  <button
                    onClick={() => {
                      if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
                      else setCalMonth(m => m + 1);
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1">
                  {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (
                    <div key={d} className="text-center text-[10px] font-semibold text-slate-400 py-1">{d}</div>
                  ))}
                </div>

                {/* Days */}
                <div className="grid grid-cols-7 gap-1">
                  {calDays.map((day, idx) => {
                    if (day === null) return <div key={`empty-${idx}`} />;
                    const iso = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const available = isDateAvailable(day);
                    const isSelected = selectedDate === iso;
                    const isPast = iso <= today.toISOString().split("T")[0];
                    return (
                      <button
                        key={day}
                        onClick={() => { if (available) { setSelectedDate(iso); setSelectedTime(null); } }}
                        disabled={!available}
                        className={cn(
                          "aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all",
                          isSelected ? "bg-violet-600 text-white" :
                          available ? "hover:bg-violet-50 dark:hover:bg-violet-950/20 text-slate-700 dark:text-slate-300 hover:text-violet-700" :
                          isPast ? "text-slate-300 dark:text-slate-700 cursor-default" :
                          "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                        )}
                      >
                        {day}
                        {available && !isSelected && (
                          <span className="sr-only">Available</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              {selectedDate && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Available slots — {fmtDate(selectedDate)}
                  </p>
                  {availableSlots.length === 0 ? (
                    <p className="text-sm text-slate-400 py-3 text-center">No available slots on this date.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableSlots.map(slot => (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={cn(
                            "px-4 py-2 rounded-xl border text-sm font-medium transition-all",
                            selectedTime === slot
                              ? "bg-violet-600 border-violet-600 text-white"
                              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/20"
                          )}
                        >
                          {fmt12(slot)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Notes */}
          {step === "notes" && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Chief Complaint / Notes</h2>
              <p className="text-sm text-slate-400">Optional — add any notes or chief complaint for this appointment.</p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Patient reports increased anxiety, requesting medication review…"
                rows={5}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 outline-none focus:border-violet-400 dark:focus:border-violet-600 resize-none"
              />
            </div>
          )}

          {/* Step 6: Confirm */}
          {step === "confirm" && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Confirm Appointment</h2>

              {/* Provider card (readonly) */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800">
                <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0">SM</div>
                <div>
                  <p className="text-sm font-semibold text-violet-800 dark:text-violet-300">Dr. Sarah Mitchell</p>
                  <p className="text-xs text-violet-600 dark:text-violet-400">Psychiatrist · Provider (You)</p>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                {[
                  { label: "Patient", value: selectedPatient?.displayName ?? "—", sub: selectedPatient ? `${selectedPatient.mrn} · DOB ${selectedPatient.dob}` : "" },
                  { label: "Visit Type", value: selectedVisitType ?? "—", sub: `${duration} minutes` },
                  { label: "Mode", value: selectedMode ? MODES.find(m => m.id === selectedMode)?.label ?? "—" : "—", sub: "" },
                  { label: "Date", value: selectedDate ? fmtDate(selectedDate) : "—", sub: "" },
                  { label: "Time", value: selectedTime ? fmt12(selectedTime) : "—", sub: selectedTime ? `Ends at ${fmt12(addMinutes(selectedTime, duration))}` : "" },
                  ...(notes ? [{ label: "Notes", value: notes, sub: "" }] : []),
                ].map(row => (
                  <div key={row.label} className="flex items-start gap-4 px-4 py-3">
                    <span className="text-xs text-slate-400 w-20 shrink-0 pt-0.5">{row.label}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{row.value}</p>
                      {row.sub && <p className="text-xs text-slate-400 mt-0.5">{row.sub}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={goBack}
            disabled={step === "patient"}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {step === "confirm" ? (
            <button
              onClick={handleBook}
              disabled={booking}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-70 text-white text-sm font-semibold transition-colors"
            >
              {booking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
              {booking ? "Booking…" : "Book Appointment"}
            </button>
          ) : (
            <button
              onClick={goNext}
              disabled={!canProceed}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </ProviderLayout>
  );
}
