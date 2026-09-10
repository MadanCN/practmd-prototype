"use client";

import { useState, useMemo } from "react";
import { X, Search, UserPlus, Check, X as XIcon, ChevronDown, ChevronRight, AlertCircle, Phone, Mail, Shield, Clock, AlertTriangle } from "lucide-react";
import { CC_PATIENTS, type CcPatient } from "@/data/cc-patients";
import { PROVIDERS, type Provider } from "@/data/providers";
import { getBookedSlots, getLastVisitForPatient, type CcAppointment, type AppointmentMode, type RecurrenceType, type ScheduleType, type AppointmentType } from "@/data/cc-appointments";
import { DAYS } from "@/data/clinics";
import { cn } from "@/lib/utils";

export interface PrefilledSlot {
  date?: string;
  startTime?: string;
  providerId?: string;
}

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  prefilled?: PrefilledSlot | null;
  onNewAppointment?: (appt: CcAppointment) => void;
}

interface RecurrenceConfig {
  type: RecurrenceType;
  every: number;
  daysOfWeek: string[];
  endDate: string;
  occurrences: number;
  endMode: "date" | "occurrences";
}

interface FormState {
  // Step 1
  patient: CcPatient | null;
  patientSearch: string;
  // Step 2
  visitType: string;
  providerId: string;
  mode: AppointmentMode;
  recurrence: RecurrenceConfig;
  // Step 3
  scheduleType: ScheduleType;
  appointmentType: AppointmentType;
  waitlistPriority: "crisis" | "urgent" | "routine";
  date: string;
  selectedSlots: string[];
  // Step 4
  forms: string[];
  notes: string;
}

const VISIT_TYPES = ["Initial Consultation", "Follow-Up", "Medication Check", "Therapy Session", "Group Session", "Telehealth Consultation"];
const FORMS_LIBRARY = ["PHQ-9", "GAD-7", "New Patient Intake", "Medication Review", "ADHD Screening", "PTSD Checklist", "Session Notes", "Consent Form"];
const SLOT_INTERVAL = 30;

function fmt12(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${((h % 12) || 12)}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function calcAge(dob: string) {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function generateSlots(provider: Provider | undefined, date: string): string[] {
  if (!provider) return [];
  const dayName = new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" }) as typeof DAYS[number];
  const wh = provider.workingHours.find(w => w.day === dayName);
  if (!wh || !wh.isOpen) return [];
  const slots: string[] = [];
  let cur = wh.openTime;
  const end = wh.closeTime;
  while (cur < end) {
    const next = addMinutes(cur, SLOT_INTERVAL);
    if (next > end) break;
    slots.push(cur);
    cur = next;
  }
  return slots;
}

const INPUT = "w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500";
const LABEL = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";

const defaultRecurrence: RecurrenceConfig = { type: "none", every: 1, daysOfWeek: [], endDate: "", occurrences: 8, endMode: "occurrences" };

const INSURANCE_STATUS_STYLES = {
  active: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  inactive: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  pending: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
};

export default function NewAppointmentDrawer({ open, onClose, prefilled, onNewAppointment }: DrawerProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({
    patient: null, patientSearch: "",
    visitType: "", providerId: prefilled?.providerId ?? "", mode: "in-person",
    recurrence: defaultRecurrence,
    scheduleType: "appointment", appointmentType: "fixed", waitlistPriority: "routine",
    date: prefilled?.date ?? "", selectedSlots: [],
    forms: [], notes: "",
  });
  const [formSearch, setFormSearch] = useState("");

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  // Step 1: patient search results
  const patientResults = useMemo(() => {
    const q = form.patientSearch.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return CC_PATIENTS.filter(p =>
      p.displayName.toLowerCase().includes(q) ||
      p.mrn.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [form.patientSearch]);

  // Derive last visit for selected patient
  const lastVisit = useMemo(() => form.patient ? getLastVisitForPatient(form.patient.id) : null, [form.patient]);

  // Step 3: slots
  const provider = PROVIDERS.find(p => p.id === form.providerId);
  const allSlots = useMemo(() => generateSlots(provider, form.date), [provider, form.date]);
  const bookedSlots = useMemo(() => (form.providerId && form.date ? getBookedSlots(form.providerId, form.date) : []), [form.providerId, form.date]);

  const maxSelect = form.appointmentType === "reserved" ? 3 : 1;

  function toggleSlot(slot: string) {
    if (bookedSlots.includes(slot)) return;
    if (form.selectedSlots.includes(slot)) {
      set("selectedSlots", form.selectedSlots.filter(s => s !== slot));
    } else {
      if (form.selectedSlots.length >= maxSelect) {
        // For fixed: replace selection; for reserved: ignore if at max
        if (form.appointmentType === "fixed") {
          set("selectedSlots", [slot]);
        }
        // reserved: at max, do nothing
      } else {
        set("selectedSlots", [...form.selectedSlots, slot]);
      }
    }
  }

  // Step validation
  const canStep1 = !!form.patient;
  const canStep2 = !!(form.visitType && form.providerId);
  const canStep3 = !!(form.date && form.selectedSlots.length >= 1 && (
    form.scheduleType === "waitlist" ||
    (form.appointmentType === "fixed" && form.selectedSlots.length === 1) ||
    (form.appointmentType === "reserved" && form.selectedSlots.length >= 1 && form.selectedSlots.length <= 3)
  ));

  function nextStep() { setStep(s => Math.min(s + 1, 4)); }
  function prevStep() { setStep(s => Math.max(s - 1, 1)); }
  const canProceed = step === 1 ? canStep1 : step === 2 ? canStep2 : step === 3 ? canStep3 : true;

  function handleConfirmAppointment() {
    if (!form.patient || !form.providerId || !form.date || form.selectedSlots.length === 0) return;
    if (onNewAppointment) {
      const slot = form.selectedSlots[0];
      const duration = 60; // default duration
      const newAppt: CcAppointment = {
        id: `new-${Date.now()}`,
        patientId: form.patient.id,
        providerId: form.providerId,
        clinicId: "penfield-psychiatry",
        visitType: form.visitType || "Follow-Up",
        mode: form.mode,
        date: form.date,
        startTime: slot,
        endTime: addMinutes(slot, duration),
        duration,
        status: form.scheduleType === "waitlist" ? "waitlisted" : "confirmed",
        scheduleType: form.scheduleType,
        appointmentType: form.appointmentType,
        forms: form.forms.length > 0 ? form.forms : undefined,
        notes: form.notes || undefined,
        recurrence: form.recurrence.type !== "none" ? form.recurrence : undefined,
        waitlistPriority: form.scheduleType === "waitlist" ? form.waitlistPriority : undefined,
        waitlistPosition: form.scheduleType === "waitlist" ? 99 : undefined,
        reservedSlots: form.appointmentType === "reserved" ? form.selectedSlots.map(s => ({ date: form.date, startTime: s, endTime: addMinutes(s, duration) })) : undefined,
      };
      onNewAppointment(newAppt);
    }
    handleClose();
  }

  function handleClose() {
    setStep(1);
    setForm({ patient: null, patientSearch: "", visitType: "", providerId: prefilled?.providerId ?? "", mode: "in-person", recurrence: defaultRecurrence, scheduleType: "appointment", appointmentType: "fixed", waitlistPriority: "routine", date: prefilled?.date ?? "", selectedSlots: [], forms: [], notes: "" });
    onClose();
  }

  const STEP_LABELS = ["Patient", "Details", "Schedule", "Summary"];

  return (
    <>
      {/* Backdrop */}
      {open && <div className="fixed inset-0 bg-black/30 z-40" onClick={handleClose} />}

      {/* Drawer */}
      <div className={cn(
        "fixed top-0 right-0 h-full w-[480px] bg-white dark:bg-slate-900 z-50 shadow-2xl flex flex-col transition-transform duration-300",
        open ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">New Appointment</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Step {step} of 4 — {STEP_LABELS[step - 1]}</p>
            </div>
            <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Step bar */}
          <div className="flex gap-1.5">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex-1">
                <div className={cn("h-1 rounded-full", i + 1 <= step ? "bg-teal-500" : "bg-slate-200 dark:bg-slate-700")} />
                <p className={cn("text-[10px] mt-1 font-medium", i + 1 === step ? "text-teal-600 dark:text-teal-400" : "text-slate-400")}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* ── STEP 1: Patient ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={LABEL}>Search Patient</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input className={cn(INPUT, "pl-9")} placeholder="Search by name, MRN, or email…"
                    value={form.patientSearch} onChange={e => set("patientSearch", e.target.value)} />
                </div>
              </div>

              {/* Selected patient — rich card */}
              {form.patient && (
                <div className="rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/60 dark:bg-teal-950/20 overflow-hidden">
                  {/* Name row */}
                  <div className="flex items-start gap-3 px-4 pt-4 pb-3">
                    <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                      {form.patient.firstName[0]}{form.patient.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{form.patient.displayName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {form.patient.mrn} · {form.patient.gender} · {calcAge(form.patient.dob)} yrs (DOB {fmtDate(form.patient.dob)})
                      </p>
                    </div>
                    <button onClick={() => set("patient", null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-0.5">
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Details grid */}
                  <div className="border-t border-teal-100 dark:border-teal-900 divide-y divide-teal-100 dark:divide-teal-900">
                    {/* Insurance */}
                    <div className="flex items-center gap-3 px-4 py-2.5">
                      <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Insurance</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {form.patient.insuranceProvider ?? "—"}
                          </span>
                          {form.patient.insuranceMemberId && (
                            <span className="text-xs text-slate-400">#{form.patient.insuranceMemberId}</span>
                          )}
                          {form.patient.insuranceStatus && (
                            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide", INSURANCE_STATUS_STYLES[form.patient.insuranceStatus])}>
                              {form.patient.insuranceStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Last visit */}
                    <div className="flex items-center gap-3 px-4 py-2.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div className="flex-1">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Last Visit</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {lastVisit ? (
                            <>
                              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{fmtDate(lastVisit.date)}</span>
                              <span className="text-xs text-slate-500">·</span>
                              <span className="text-xs text-slate-600 dark:text-slate-400">{lastVisit.visitType}</span>
                            </>
                          ) : (
                            <span className="text-sm text-slate-400 italic">No prior visits</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact row */}
                    <div className="flex items-center gap-4 px-4 py-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Phone className="w-3 h-3" />
                        {form.patient.phone}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                        <Mail className="w-3 h-3 shrink-0" />
                        <span className="truncate">{form.patient.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Search results */}
              {!form.patient && patientResults.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {patientResults.map(p => (
                    <button key={p.id} onClick={() => { set("patient", p); set("patientSearch", ""); }}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors">
                      <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center text-xs font-bold text-teal-700 dark:text-teal-300 shrink-0">
                        {p.firstName[0]}{p.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{p.displayName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{p.mrn} · {p.email}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                    </button>
                  ))}
                </div>
              )}

              {!form.patient && form.patientSearch.trim().length >= 2 && patientResults.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No patients found matching &quot;{form.patientSearch}&quot;</p>
              )}

              {/* Register new */}
              <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-sm text-slate-500 hover:border-teal-400 hover:text-teal-600 transition-colors">
                <UserPlus className="w-4 h-4" />
                Register a new patient
              </button>
            </div>
          )}

          {/* ── STEP 2: Details ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className={LABEL}>Visit Type <span className="text-red-500">*</span></label>
                <select className={INPUT} value={form.visitType} onChange={e => set("visitType", e.target.value)}>
                  <option value="">Select visit type</option>
                  {VISIT_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className={LABEL}>Provider <span className="text-red-500">*</span></label>
                <select className={INPUT} value={form.providerId} onChange={e => set("providerId", e.target.value)}>
                  <option value="">Select provider</option>
                  {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.displayName} · {p.providerType}</option>)}
                </select>
              </div>

              <div>
                <label className={LABEL}>Mode</label>
                <div className="flex gap-2">
                  {(["in-person", "telehealth", "phone"] as AppointmentMode[]).map(m => (
                    <button key={m} onClick={() => set("mode", m)}
                      className={cn("flex-1 py-2 rounded-lg border text-xs font-medium transition-colors capitalize",
                        form.mode === m ? "bg-teal-600 border-teal-600 text-white" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-teal-400")}>
                      {m === "in-person" ? "In-Person" : m === "telehealth" ? "Telehealth" : "Phone"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={LABEL}>Recurrence</label>
                <div className="flex gap-2 flex-wrap">
                  {(["none", "daily", "weekly", "monthly"] as RecurrenceType[]).map(r => (
                    <button key={r} onClick={() => set("recurrence", { ...form.recurrence, type: r })}
                      className={cn("px-3 py-1.5 rounded-lg border text-xs font-medium capitalize transition-colors",
                        form.recurrence.type === r ? "bg-teal-600 border-teal-600 text-white" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-teal-400")}>
                      {r === "none" ? "No Repeat" : r}
                    </button>
                  ))}
                </div>

                {form.recurrence.type !== "none" && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Every</span>
                      <input type="number" min={1} max={12} className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-center bg-white dark:bg-slate-900"
                        value={form.recurrence.every} onChange={e => set("recurrence", { ...form.recurrence, every: parseInt(e.target.value) || 1 })} />
                      <span className="text-sm text-slate-600 dark:text-slate-400">{form.recurrence.type === "daily" ? "day(s)" : form.recurrence.type === "weekly" ? "week(s)" : "month(s)"}</span>
                    </div>

                    {form.recurrence.type === "weekly" && (
                      <div>
                        <p className="text-xs text-slate-500 mb-2">On these days:</p>
                        <div className="flex gap-1 flex-wrap">
                          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                            <button key={day} onClick={() => {
                              const days = form.recurrence.daysOfWeek.includes(day)
                                ? form.recurrence.daysOfWeek.filter(d => d !== day)
                                : [...form.recurrence.daysOfWeek, day];
                              set("recurrence", { ...form.recurrence, daysOfWeek: days });
                            }} className={cn("w-10 h-8 rounded-lg text-xs font-medium transition-colors",
                              form.recurrence.daysOfWeek.includes(day) ? "bg-teal-600 text-white" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400")}>
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex gap-3 text-sm">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" checked={form.recurrence.endMode === "occurrences"} onChange={() => set("recurrence", { ...form.recurrence, endMode: "occurrences" })} className="accent-teal-600" />
                          <span className="text-slate-700 dark:text-slate-300">After</span>
                          <input type="number" min={1} max={52} className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-center bg-white dark:bg-slate-900"
                            value={form.recurrence.occurrences} onChange={e => set("recurrence", { ...form.recurrence, occurrences: parseInt(e.target.value) || 1 })} />
                          <span className="text-slate-600 dark:text-slate-400">sessions</span>
                        </label>
                      </div>
                      <div className="flex gap-2 items-center mt-2 text-sm">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" checked={form.recurrence.endMode === "date"} onChange={() => set("recurrence", { ...form.recurrence, endMode: "date" })} className="accent-teal-600" />
                          <span className="text-slate-700 dark:text-slate-300">Until</span>
                          <input type="date" className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                            value={form.recurrence.endDate} onChange={e => set("recurrence", { ...form.recurrence, endDate: e.target.value })} />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 3: Scheduling ── */}
          {step === 3 && (
            <div className="space-y-5">
              {/* Schedule type */}
              <div>
                <label className={LABEL}>Schedule Type</label>
                <div className="flex gap-2">
                  {(["appointment", "waitlist"] as ScheduleType[]).map(t => (
                    <button key={t} onClick={() => {
                      set("scheduleType", t);
                      if (t === "waitlist") set("appointmentType", "fixed");
                    }}
                      className={cn("flex-1 py-2 rounded-lg border text-sm font-medium capitalize transition-colors",
                        form.scheduleType === t ? "bg-teal-600 border-teal-600 text-white" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-teal-400")}>
                      {t === "appointment" ? "Appointment" : "Waitlist"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Waitlist priority (only for waitlist schedule type) */}
              {form.scheduleType === "waitlist" && (
                <div>
                  <label className={LABEL}>Waitlist Priority <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    {([
                      { value: "crisis", label: "Crisis", desc: "Immediate clinical need", color: "bg-red-600 border-red-600" },
                      { value: "urgent", label: "Urgent", desc: "High priority", color: "bg-amber-500 border-amber-500" },
                      { value: "routine", label: "Routine", desc: "Standard queue", color: "bg-slate-500 border-slate-500" },
                    ] as const).map(opt => (
                      <button key={opt.value} type="button"
                        onClick={() => set("waitlistPriority", opt.value)}
                        className={cn("flex-1 py-2.5 px-3 rounded-lg border-2 text-xs font-semibold transition-all text-center",
                          form.waitlistPriority === opt.value
                            ? `${opt.color} text-white`
                            : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600")}>
                        {opt.label}
                        <span className="block text-[10px] font-normal mt-0.5 opacity-80">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Waitlist entries are ranked Crisis → Urgent → Routine, then by position within each tier.
                  </div>
                </div>
              )}

              {/* Appointment type (not for waitlist) */}
              {form.scheduleType === "appointment" && (
                <div>
                  <label className={LABEL}>Appointment Type</label>
                  <div className="flex gap-2">
                    {(["fixed", "reserved"] as AppointmentType[]).map(t => (
                      <button key={t} onClick={() => { set("appointmentType", t); set("selectedSlots", []); }}
                        className={cn("flex-1 py-2 rounded-lg border text-sm font-medium transition-colors",
                          form.appointmentType === t ? "bg-teal-600 border-teal-600 text-white" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-teal-400")}>
                        {t === "fixed" ? "Fixed" : "Reserved"}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                    {form.appointmentType === "fixed" ? "Select one slot — confirmed immediately." : "Select up to 3 slots to send to patient for confirmation."}
                  </p>
                </div>
              )}

              {/* Date */}
              <div>
                <label className={LABEL}>Date</label>
                <input type="date" className={INPUT} value={form.date}
                  onChange={e => { set("date", e.target.value); set("selectedSlots", []); }} />
              </div>

              {/* Slot grid */}
              {form.date && form.providerId && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={cn(LABEL, "mb-0")}>Select Time Slot{form.appointmentType === "reserved" ? "s" : ""}</label>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded border border-slate-300 bg-white dark:bg-slate-800 inline-block" />
                        Available
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-teal-500 inline-block" />
                        Selected
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700 inline-block opacity-50" />
                        Booked
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    {form.appointmentType === "fixed"
                      ? "Click a slot to select it (only one can be selected)."
                      : "Click to select up to 3 slots for the patient to choose from."}
                  </p>

                  {allSlots.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-6">Provider is not scheduled on this day.</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {allSlots.map(slot => {
                        const isBooked = bookedSlots.includes(slot);
                        const isSelected = form.selectedSlots.includes(slot);
                        return (
                          <button key={slot} disabled={isBooked}
                            onClick={() => toggleSlot(slot)}
                            className={cn(
                              "py-2 px-1 rounded-lg text-xs font-medium transition-all border",
                              isBooked && "bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent cursor-not-allowed opacity-50",
                              isSelected && "bg-teal-500 border-teal-500 text-white shadow-sm",
                              !isBooked && !isSelected && "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/30"
                            )}>
                            {fmt12(slot)}
                            {isBooked && <span className="block text-[10px] font-normal">Booked</span>}
                            {isSelected && <span className="block text-[10px] font-normal opacity-80">Selected</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Validation hints */}
                  {form.scheduleType === "appointment" && form.appointmentType === "fixed" && form.selectedSlots.length === 0 && form.date && allSlots.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Select one slot to confirm the appointment.
                    </div>
                  )}
                  {form.scheduleType === "appointment" && form.appointmentType === "reserved" && form.selectedSlots.length === 0 && form.date && allSlots.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Select 1–3 slots to offer the patient.
                    </div>
                  )}
                  {form.scheduleType === "appointment" && form.appointmentType === "reserved" && form.selectedSlots.length > 0 && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400">
                      <Check className="w-3.5 h-3.5" />
                      {form.selectedSlots.length} slot{form.selectedSlots.length > 1 ? "s" : ""} selected
                      {form.selectedSlots.length < 3 ? ` (up to ${3 - form.selectedSlots.length} more)` : " (maximum reached)"}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── STEP 4: Summary ── */}
          {step === 4 && (
            <div className="space-y-5">
              {/* Summary card */}
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
                {[
                  { label: "Patient", value: form.patient ? `${form.patient.displayName} (${form.patient.mrn})` : "—" },
                  { label: "Provider", value: provider?.displayName ?? "—" },
                  { label: "Visit Type", value: form.visitType || "—" },
                  { label: "Mode", value: form.mode === "in-person" ? "In-Person" : form.mode === "telehealth" ? "Telehealth" : "Phone" },
                  { label: "Date", value: form.date ? new Date(form.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "—" },
                  {
                    label: form.appointmentType === "reserved" ? "Offered Slots" : "Time",
                    value: form.selectedSlots.length > 0 ? form.selectedSlots.map(s => fmt12(s)).join(", ") : "—"
                  },
                  { label: "Schedule Type", value: form.scheduleType === "waitlist" ? "Waitlist" : `Appointment (${form.appointmentType})` },
                  ...(form.scheduleType === "waitlist" ? [{ label: "WL Priority", value: form.waitlistPriority.charAt(0).toUpperCase() + form.waitlistPriority.slice(1) }] : []),
                  ...(form.recurrence.type !== "none" ? [{ label: "Recurrence", value: `${form.recurrence.type.charAt(0).toUpperCase() + form.recurrence.type.slice(1)}, every ${form.recurrence.every} ${form.recurrence.type}(s)` }] : []),
                ].map(row => (
                  <div key={row.label} className="flex items-start gap-3 px-4 py-2.5">
                    <span className="text-xs text-slate-500 dark:text-slate-400 w-28 shrink-0 pt-0.5">{row.label}</span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 flex-1">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Auto-assign forms */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={cn(LABEL, "mb-0")}>Auto-Assign Forms</label>
                  <span className="text-xs text-slate-500">{form.forms.length} selected</span>
                </div>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Search forms…" value={formSearch} onChange={e => setFormSearch(e.target.value)} />
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {FORMS_LIBRARY.filter(f => f.toLowerCase().includes(formSearch.toLowerCase())).map(f => (
                    <label key={f} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                      <input type="checkbox" className="accent-teal-600 w-4 h-4"
                        checked={form.forms.includes(f)} onChange={() => set("forms", form.forms.includes(f) ? form.forms.filter(x => x !== f) : [...form.forms, f])} />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{f}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Internal notes */}
              <div>
                <label className={LABEL}>Internal Notes</label>
                <textarea rows={3} className={cn(INPUT, "resize-none")} placeholder="Notes visible only to clinic staff…"
                  value={form.notes} onChange={e => set("notes", e.target.value)} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between gap-3">
            {step > 1 ? (
              <button onClick={prevStep} className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
                ← Back
              </button>
            ) : <div />}

            {step < 4 ? (
              <button onClick={nextStep} disabled={!canProceed}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
                Continue →
              </button>
            ) : (
              <button onClick={handleConfirmAppointment}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors">
                <Check className="w-4 h-4" />
                Confirm Appointment
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
