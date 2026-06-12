"use client";

import { useState, useMemo } from "react";
import { X, ShieldCheck, ShieldAlert, LogIn, Calendar, XCircle, UserX, Clock, CheckCircle2, Loader2, AlertTriangle, Video, Phone, MapPin, FileText, Stethoscope, ChevronRight, Activity, CreditCard, Bell, RefreshCw, PlusCircle, Copy, ExternalLink, Send } from "lucide-react";
import { type CcAppointment, getWaitlistMatchesForProvider, getLastVisitForPatient } from "@/data/cc-appointments";
import { CC_PATIENTS, type CcPatient } from "@/data/cc-patients";
import { PROVIDERS, type Provider } from "@/data/providers";
import { CLINIC_CONFIG } from "@/data/cc-masters";
import CancelModal from "./CancelModal";
import CheckInModal from "./CheckInModal";
import RescheduleModal from "./RescheduleModal";
import NoShowModal from "./NoShowModal";
import { cn } from "@/lib/utils";

// ── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  confirmed:   { label: "Confirmed",  bg: "bg-teal-100 dark:bg-teal-900/40",   text: "text-teal-800 dark:text-teal-300",   dot: "bg-teal-500" },
  arrived:     { label: "Arrived",    bg: "bg-blue-100 dark:bg-blue-900/40",   text: "text-blue-800 dark:text-blue-300",   dot: "bg-blue-500" },
  "in-session":{ label: "In Session", bg: "bg-violet-100 dark:bg-violet-900/40", text: "text-violet-800 dark:text-violet-300", dot: "bg-violet-500" },
  completed:   { label: "Completed",  bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-800 dark:text-emerald-300", dot: "bg-emerald-500" },
  cancelled:   { label: "Cancelled",  bg: "bg-red-100 dark:bg-red-900/40",     text: "text-red-800 dark:text-red-300",     dot: "bg-red-500" },
  "no-show":   { label: "No Show",    bg: "bg-slate-100 dark:bg-slate-800",    text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-400" },
  waitlisted:  { label: "Waitlisted", bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-800 dark:text-amber-300", dot: "bg-amber-500" },
  requested:   { label: "Requested",  bg: "bg-sky-100 dark:bg-sky-900/40",     text: "text-sky-800 dark:text-sky-300",     dot: "bg-sky-500" },
};

// ── Encounter lifecycle stages ───────────────────────────────────────────────

const ENCOUNTER_STAGES = [
  { id: "scheduled",      label: "Scheduled",      statuses: ["confirmed", "waitlisted", "requested"] },
  { id: "arrived",        label: "Arrived",         statuses: ["arrived"] },
  { id: "in-session",     label: "In Session",      statuses: ["in-session"] },
  { id: "documentation",  label: "Documentation",   statuses: [] },
  { id: "complete",       label: "Complete",        statuses: ["completed"] },
];

function getEncounterStageIndex(status: string): number {
  if (["confirmed", "waitlisted", "requested"].includes(status)) return 0;
  if (status === "arrived") return 1;
  if (status === "in-session") return 2;
  if (status === "completed") return 4;
  return -1; // cancelled, no-show
}

// ── Time window helpers ──────────────────────────────────────────────────────

function checkInWindowStatus(appt: CcAppointment): { enabled: boolean; reason: string } {
  const today = new Date().toISOString().split("T")[0];
  if (appt.date !== today) {
    return { enabled: false, reason: appt.date < today ? "Past appointment" : "Appointment not today" };
  }
  const now = new Date();
  const [h, m] = appt.startTime.split(":").map(Number);
  const apptStart = new Date(); apptStart.setHours(h, m, 0, 0);
  const minsToStart = (apptStart.getTime() - now.getTime()) / 60000;
  if (minsToStart > CLINIC_CONFIG.checkInBufferMins) {
    return { enabled: false, reason: `Opens ${CLINIC_CONFIG.checkInBufferMins} min before appointment` };
  }
  if (minsToStart < -120) {
    return { enabled: false, reason: "Check-in window has passed" };
  }
  return { enabled: true, reason: "" };
}

function noShowWindowOpen(appt: CcAppointment): boolean {
  const today = new Date().toISOString().split("T")[0];
  if (appt.date < today) return true;
  if (appt.date > today) return false;
  const now = new Date();
  const [h, m] = appt.startTime.split(":").map(Number);
  const apptStart = new Date(); apptStart.setHours(h, m, 0, 0);
  return (now.getTime() - apptStart.getTime()) / 60000 >= CLINIC_CONFIG.noShowWindowMins;
}

// ── Utilities ────────────────────────────────────────────────────────────────

function fmt12(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function fmtDateShort(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const INSURANCE_STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  inactive: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  pending: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
};

// ── Activity Timeline ────────────────────────────────────────────────────────

const ACTIVITY_ICON: Record<string, React.ElementType> = {
  "created":        PlusCircle,
  "status-change":  RefreshCw,
  "rescheduled":    Calendar,
  "eligibility":    ShieldCheck,
  "fee-charged":    CreditCard,
  "form-assigned":  FileText,
  "offer-sent":     Bell,
  "notification":   Bell,
  "note":           FileText,
};

const ACTIVITY_COLORS: Record<string, string> = {
  "created":        "bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400",
  "status-change":  "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
  "rescheduled":    "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",
  "eligibility":    "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
  "fee-charged":    "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400",
  "form-assigned":  "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
  "offer-sent":     "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400",
  "notification":   "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400",
  "note":           "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
};

const ACTOR_BADGE: Record<string, string> = {
  "Care Coordinator": "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400",
  "Patient":          "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  "System":           "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
  "Provider":         "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400",
};

function deriveActivityLog(appt: CcAppointment): { id: string; type: string; timestamp: string; description: string; actor: string; meta?: string }[] {
  if (appt.activityLog && appt.activityLog.length > 0) return appt.activityLog;
  // Derive synthetic log from appointment state
  const log: { id: string; type: string; timestamp: string; description: string; actor: string; meta?: string }[] = [];
  const base = new Date(`${appt.date}T${appt.startTime}:00`);
  const created = new Date(base.getTime() - 7 * 24 * 3600 * 1000).toISOString();
  log.push({ id: "al1", type: "created", timestamp: created, description: `Appointment created — ${appt.visitType} (${appt.mode})`, actor: "Care Coordinator" });
  if (appt.forms && appt.forms.length > 0) {
    log.push({ id: "al2", type: "form-assigned", timestamp: new Date(new Date(created).getTime() + 60000).toISOString(), description: `Forms assigned: ${appt.forms.join(", ")}`, actor: "Care Coordinator" });
  }
  if (appt.rescheduledFrom) {
    log.push({ id: "al3", type: "rescheduled", timestamp: new Date(base.getTime() - 2 * 24 * 3600 * 1000).toISOString(), description: `Rescheduled from ${appt.rescheduledFrom.date} at ${appt.rescheduledFrom.startTime}`, actor: "Care Coordinator" });
  }
  if (["arrived", "in-session", "completed"].includes(appt.status)) {
    log.push({ id: "al4", type: "status-change", timestamp: new Date(base.getTime() - 5 * 60000).toISOString(), description: "Patient checked in — identity verified", actor: "Care Coordinator" });
    log.push({ id: "al5", type: "eligibility", timestamp: new Date(base.getTime() - 4 * 60000).toISOString(), description: "Insurance eligibility verified — Active", actor: "System" });
  }
  if (["in-session", "completed"].includes(appt.status)) {
    log.push({ id: "al6", type: "status-change", timestamp: base.toISOString(), description: "Session started — encounter opened", actor: "Provider" });
  }
  if (appt.status === "completed") {
    log.push({ id: "al7", type: "status-change", timestamp: new Date(base.getTime() + appt.duration * 60000).toISOString(), description: "Session completed — encounter sent to billing", actor: "Provider" });
  }
  if (appt.status === "cancelled") {
    log.push({ id: "al8", type: "status-change", timestamp: new Date(base.getTime() - 1 * 3600 * 1000).toISOString(), description: `Appointment cancelled${appt.cancellationReason ? ` — ${appt.cancellationReason}` : ""}`, actor: "Care Coordinator" });
    log.push({ id: "al9", type: "notification", timestamp: new Date(base.getTime() - 1 * 3600 * 1000 + 30000).toISOString(), description: "Cancellation notification sent to patient (Email + SMS)", actor: "System" });
  }
  if (appt.status === "no-show") {
    log.push({ id: "al10", type: "status-change", timestamp: new Date(base.getTime() + CLINIC_CONFIG.noShowWindowMins * 60000).toISOString(), description: "Marked as No Show", actor: "Care Coordinator" });
  }
  return log.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function fmtTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " · " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

// ── Telehealth Section ───────────────────────────────────────────────────────

function TelehealthSection({ appointment, patient }: { appointment: CcAppointment; patient: CcPatient }) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  const joinLink = `https://telehealth.practmd.com/join/${appointment.id}`;
  const isActive = ["arrived", "in-session"].includes(appointment.status);

  function copyLink() {
    navigator.clipboard?.writeText(joinLink).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }

  function sendLink() {
    setLinkSent(true);
    setTimeout(() => setLinkSent(false), 3000);
  }

  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Telehealth Session</p>
      <div className="rounded-xl border border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-950/20 overflow-hidden">
        {/* Link row */}
        <div className="px-4 py-3 flex items-center gap-3">
          <Video className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Join Link (Portal)</p>
            <p className="text-xs text-cyan-700 dark:text-cyan-400 truncate font-mono mt-0.5">{joinLink}</p>
          </div>
          <button onClick={copyLink}
            className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0",
              linkCopied ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-cyan-400")}>
            {linkCopied ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {linkCopied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Actions */}
        <div className="px-4 pb-3 flex gap-2 border-t border-cyan-100 dark:border-cyan-900 pt-3">
          <button onClick={sendLink}
            className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex-1 justify-center",
              linkSent ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                : "bg-cyan-600 hover:bg-cyan-700 text-white")}>
            {linkSent ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
            {linkSent ? `Sent to ${patient.firstName}` : "Send Link to Patient"}
          </button>
          <a href={joinLink} target="_blank" rel="noopener noreferrer"
            className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all",
              isActive
                ? "bg-violet-600 hover:bg-violet-700 text-white"
                : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-violet-400")}>
            <ExternalLink className="w-3.5 h-3.5" />
            {isActive ? "Join Session" : "Open Portal"}
          </a>
        </div>

        {/* Status indicator */}
        <div className="px-4 pb-3 flex items-center gap-2 text-xs">
          <span className={cn("w-2 h-2 rounded-full shrink-0", isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300 dark:bg-slate-600")} />
          <span className={isActive ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-slate-400"}>
            {isActive ? "Session active — patient can join now" : "Session link ready — will activate at appointment time"}
          </span>
        </div>
      </div>
    </div>
  );
}

function ActivityTimeline({ appointment }: { appointment: CcAppointment }) {
  const log = deriveActivityLog(appointment);
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-3.5 h-3.5 text-slate-400" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Activity Timeline</p>
        <span className="ml-auto text-xs text-slate-400">{log.length} events</span>
      </div>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-3">
          {log.map(entry => {
            const Icon = ACTIVITY_ICON[entry.type] ?? Activity;
            const iconCls = ACTIVITY_COLORS[entry.type] ?? "bg-slate-100 text-slate-500";
            const actorCls = ACTOR_BADGE[entry.actor] ?? ACTOR_BADGE["System"];
            return (
              <div key={entry.id} className="flex items-start gap-3 pl-0">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10", iconCls)}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-slate-700 dark:text-slate-300 flex-1">{entry.description}</p>
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0", actorCls)}>{entry.actor}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{fmtTimestamp(entry.timestamp)}</p>
                  {entry.meta && <p className="text-[10px] text-slate-500 italic mt-0.5">{entry.meta}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Props ────────────────────────────────────────────────────────────────────

interface Props {
  appointment: CcAppointment | null;
  allAppointments: CcAppointment[];
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<CcAppointment>) => void;
}

// ── Eligibility result type ───────────────────────────────────────────────────

interface EligResult { status: "idle" | "running" | "eligible" | "issue" | "expired"; message?: string; copay?: number; deductibleMet?: number; deductibleTotal?: number }

// ── Component ────────────────────────────────────────────────────────────────

export default function AppointmentDetailDrawer({ appointment, allAppointments, onClose, onUpdate }: Props) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [noShowOpen, setNoShowOpen] = useState(false);
  const [elig, setElig] = useState<EligResult>({ status: "idle" });

  const patient = appointment ? CC_PATIENTS.find(p => p.id === appointment.patientId) ?? null : null;
  const provider = appointment ? PROVIDERS.find(p => p.id === appointment.providerId) ?? null : null;
  const lastVisit = useMemo(() => patient ? getLastVisitForPatient(patient.id) : null, [patient]);
  const waitlistMatches = useMemo(() =>
    appointment ? getWaitlistMatchesForProvider(appointment.providerId, allAppointments) : [],
    [appointment, allAppointments]
  );
  const patientMap = useMemo(() => Object.fromEntries(CC_PATIENTS.map(p => [p.id, p])), []);

  const stageIdx = appointment ? getEncounterStageIndex(appointment.status) : -1;

  // Quick action availability
  const ciWindow = appointment ? checkInWindowStatus(appointment) : { enabled: false, reason: "" };
  const canCheckIn = ciWindow.enabled && appointment?.status === "confirmed";
  const canReschedule = appointment ? ["confirmed", "requested"].includes(appointment.status) : false;
  const canCancel = appointment ? ["confirmed", "waitlisted", "requested"].includes(appointment.status) : false;
  const canNoShow = appointment ? (["confirmed", "arrived"].includes(appointment.status) && noShowWindowOpen(appointment)) : false;
  const noShowLabel = appointment && !noShowWindowOpen(appointment)
    ? `Active after ${CLINIC_CONFIG.noShowWindowMins} min past start` : "";

  async function runEligibility() {
    if (!patient) return;
    setElig({ status: "running" });
    await new Promise(r => setTimeout(r, 1600));
    if (patient.insuranceStatus === "inactive") {
      setElig({ status: "issue", message: "Coverage inactive as of last verification" });
    } else if (patient.insuranceStatus === "pending") {
      setElig({ status: "expired", message: "Coverage pending renewal — prior auth may be required" });
    } else {
      setElig({ status: "eligible", copay: 30, deductibleMet: 850, deductibleTotal: 2000 });
    }
  }

  function handleCheckInConfirm() {
    if (!appointment) return;
    onUpdate(appointment.id, { status: "arrived" });
    setCheckInOpen(false);
  }

  function handleCancelConfirm(reason: string, notes: string, _notify: boolean) {
    if (!appointment) return;
    onUpdate(appointment.id, { status: "cancelled", cancellationReason: reason, notes: appointment.notes ? `${appointment.notes}\n[Cancelled: ${notes}]` : notes });
  }

  function handleRescheduleConfirm(newDate: string, newStart: string, newEnd: string, _reason: string, _notify: boolean) {
    if (!appointment) return;
    onUpdate(appointment.id, {
      status: "confirmed",
      date: newDate,
      startTime: newStart,
      endTime: newEnd,
      rescheduledFrom: { date: appointment.date, startTime: appointment.startTime, endTime: appointment.endTime },
    });
    setRescheduleOpen(false);
  }

  function handleNoShowConfirm(_chargeFee: boolean, _feeAmount: number, _paymentMethod: string) {
    if (!appointment) return;
    onUpdate(appointment.id, { status: "no-show" });
    setNoShowOpen(false);
  }

  function handleAdvanceStatus() {
    if (!appointment) return;
    const next: Record<string, CcAppointment["status"]> = {
      arrived: "in-session",
      "in-session": "completed",
    };
    if (next[appointment.status]) {
      onUpdate(appointment.id, { status: next[appointment.status] });
    }
  }

  const open = !!appointment;

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />}
      <div className={cn(
        "fixed top-0 right-0 h-full w-[540px] bg-white dark:bg-slate-900 z-50 shadow-2xl flex flex-col transition-transform duration-300",
        open ? "translate-x-0" : "translate-x-full"
      )}>
        {appointment && patient && provider && (
          <>
            {/* ── Header ── */}
            <div className="px-6 pt-5 pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ backgroundColor: provider.color }}>
                  {patient.firstName[0]}{patient.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{patient.displayName}</h2>
                    {(() => {
                      const sc = STATUS_CONFIG[appointment.status] ?? STATUS_CONFIG.confirmed;
                      return (
                        <span className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold", sc.bg, sc.text)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                          {sc.label}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {patient.mrn} · {provider.displayName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {fmtDate(appointment.date)} · {fmt12(appointment.startTime)}–{fmt12(appointment.endTime)} ({appointment.duration} min)
                  </p>
                </div>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* ── Quick Actions ── */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</p>
                <div className="grid grid-cols-2 gap-2">

                  {/* Check Eligibility */}
                  <button onClick={runEligibility} disabled={elig.status === "running"}
                    className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left",
                      elig.status === "eligible" ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400"
                      : elig.status === "issue" ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400"
                      : elig.status === "expired" ? "bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400"
                      : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/20")}>
                    {elig.status === "running" ? <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      : elig.status === "eligible" ? <ShieldCheck className="w-4 h-4 shrink-0" />
                      : elig.status === "issue" || elig.status === "expired" ? <ShieldAlert className="w-4 h-4 shrink-0" />
                      : <ShieldCheck className="w-4 h-4 shrink-0" />}
                    {elig.status === "idle" ? "Check Eligibility"
                      : elig.status === "running" ? "Checking…"
                      : elig.status === "eligible" ? "Eligible"
                      : elig.status === "issue" ? "Coverage Issue"
                      : "Coverage Expired"}
                  </button>

                  {/* Check In */}
                  <div className="relative group">
                    <button onClick={() => setCheckInOpen(true)}
                      disabled={!canCheckIn}
                      className={cn("w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all",
                        canCheckIn
                          ? "bg-teal-600 border-teal-600 text-white hover:bg-teal-700"
                          : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed",
                        appointment.status === "arrived" && "bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 cursor-default"
                      )}>
                      {appointment.status === "arrived" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <LogIn className="w-4 h-4 shrink-0" />}
                      {appointment.status === "arrived" ? "Checked In" : "Check In"}
                    </button>
                    {!canCheckIn && appointment.status === "confirmed" && ciWindow.reason && (
                      <div className="absolute bottom-full left-0 mb-1 w-52 bg-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {ciWindow.reason}
                      </div>
                    )}
                  </div>

                  {/* Reschedule */}
                  <button onClick={() => setRescheduleOpen(true)} disabled={!canReschedule}
                    className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all",
                      canReschedule
                        ? "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/20"
                        : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed")}>
                    <Calendar className="w-4 h-4 shrink-0" />
                    Reschedule
                  </button>

                  {/* Cancel */}
                  <button onClick={() => setCancelOpen(true)} disabled={!canCancel}
                    className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all",
                      canCancel
                        ? "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 dark:hover:text-red-400"
                        : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed")}>
                    <XCircle className="w-4 h-4 shrink-0" />
                    Cancel
                  </button>

                  {/* No Show */}
                  <div className="relative group col-span-2">
                    <button onClick={() => canNoShow && setNoShowOpen(true)}
                      disabled={!canNoShow}
                      className={cn("w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all",
                        canNoShow
                          ? "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:text-amber-700 dark:hover:text-amber-400"
                          : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed")}>
                      <UserX className="w-4 h-4 shrink-0" />
                      Mark No Show
                      {!canNoShow && noShowLabel && (
                        <span className="ml-auto text-xs font-normal text-slate-400">{noShowLabel}</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Eligibility inline result */}
              {(elig.status === "eligible" || elig.status === "issue" || elig.status === "expired") && (
                <div className={cn("p-3 rounded-xl border text-xs",
                  elig.status === "eligible" ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                  : elig.status === "issue" ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                  : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800")}>
                  {elig.status === "eligible" && (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <div><span className="text-slate-500">Plan</span> <span className="font-medium text-slate-800 dark:text-slate-200 ml-1">{patient.insuranceProvider}</span></div>
                      <div><span className="text-slate-500">Member</span> <span className="font-medium text-slate-800 dark:text-slate-200 ml-1">#{patient.insuranceMemberId}</span></div>
                      <div><span className="text-slate-500">Copay</span> <span className="font-semibold text-emerald-700 dark:text-emerald-400 ml-1">${elig.copay}</span></div>
                      <div><span className="text-slate-500">Deductible</span> <span className="font-medium text-slate-800 dark:text-slate-200 ml-1">${elig.deductibleMet} / ${elig.deductibleTotal} met</span></div>
                    </div>
                  )}
                  {(elig.status === "issue" || elig.status === "expired") && (
                    <div className="flex items-start gap-2">
                      <AlertTriangle className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", elig.status === "issue" ? "text-amber-600" : "text-red-600")} />
                      <p className={elig.status === "issue" ? "text-amber-700 dark:text-amber-400" : "text-red-700 dark:text-red-400"}>{elig.message}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Appointment Details ── */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Appointment Details</p>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                  {[
                    { icon: Stethoscope, label: "Visit Type", value: appointment.visitType },
                    { icon: appointment.mode === "telehealth" ? Video : appointment.mode === "phone" ? Phone : MapPin,
                      label: "Mode", value: appointment.mode === "in-person" ? "In-Person" : appointment.mode === "telehealth" ? "Telehealth" : "Phone" },
                    { icon: Clock, label: "Duration", value: `${appointment.duration} minutes` },
                  ].map(row => (
                    <div key={row.label} className="flex items-center gap-3 px-4 py-2.5">
                      <row.icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-500 w-24 shrink-0">{row.label}</span>
                      <span className="text-sm text-slate-800 dark:text-slate-200">{row.value}</span>
                    </div>
                  ))}
                  {appointment.forms && appointment.forms.length > 0 && (
                    <div className="flex items-start gap-3 px-4 py-2.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-500 w-24 shrink-0">Forms</span>
                      <div className="flex flex-wrap gap-1">
                        {appointment.forms.map(f => (
                          <span key={f} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">{f}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {appointment.notes && (
                    <div className="flex items-start gap-3 px-4 py-2.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-500 w-24 shrink-0">Notes</span>
                      <p className="text-sm text-slate-700 dark:text-slate-300 italic">{appointment.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Telehealth Session ── */}
              {appointment.mode === "telehealth" && (
                <TelehealthSection appointment={appointment} patient={patient} />
              )}

              {/* ── Insurance & Patient ── */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Patient & Insurance</p>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="flex items-center gap-3 px-4 py-2.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-xs text-slate-500 w-24 shrink-0">Insurance</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-slate-800 dark:text-slate-200">{patient.insuranceProvider ?? "—"}</span>
                      {patient.insuranceMemberId && <span className="text-xs text-slate-400">#{patient.insuranceMemberId}</span>}
                      {patient.insuranceStatus && (
                        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide", INSURANCE_STATUS_BADGE[patient.insuranceStatus])}>
                          {patient.insuranceStatus}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-xs text-slate-500 w-24 shrink-0">Last Visit</span>
                    <div>
                      {lastVisit ? (
                        <span className="text-sm text-slate-800 dark:text-slate-200">
                          {fmtDateShort(lastVisit.date)} · <span className="text-slate-500">{lastVisit.visitType}</span>
                        </span>
                      ) : <span className="text-sm text-slate-400 italic">No prior visits</span>}
                    </div>
                  </div>
                  {appointment.rescheduledFrom && (
                    <div className="flex items-center gap-3 px-4 py-2.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-500 w-24 shrink-0">Rescheduled</span>
                      <span className="text-xs text-amber-600 dark:text-amber-400">
                        From {fmtDateShort(appointment.rescheduledFrom.date)} at {fmt12(appointment.rescheduledFrom.startTime)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Encounter Lifecycle ── */}
              {!["cancelled", "no-show"].includes(appointment.status) && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Encounter Lifecycle</p>
                  <div className="relative">
                    {/* Track */}
                    <div className="flex items-center gap-0">
                      {ENCOUNTER_STAGES.map((stage, i) => {
                        const done = i < stageIdx;
                        const active = i === stageIdx;
                        const future = i > stageIdx;
                        return (
                          <div key={stage.id} className="flex items-center flex-1">
                            <div className="flex flex-col items-center flex-1">
                              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all",
                                done ? "bg-teal-500 border-teal-500 text-white"
                                : active ? "bg-white dark:bg-slate-900 border-teal-500 text-teal-600 dark:text-teal-400"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-300")}>
                                {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                              </div>
                              <p className={cn("text-[10px] mt-1.5 font-medium text-center leading-tight max-w-[56px]",
                                active ? "text-teal-600 dark:text-teal-400" : done ? "text-slate-600 dark:text-slate-400" : "text-slate-400 dark:text-slate-600")}>
                                {stage.label}
                              </p>
                            </div>
                            {i < ENCOUNTER_STAGES.length - 1 && (
                              <div className={cn("h-0.5 flex-1 mx-1 -mt-5", done || (i === stageIdx - 1) ? "bg-teal-400" : "bg-slate-200 dark:bg-slate-700")} />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Contextual note */}
                    <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      {appointment.status === "confirmed" && "Appointment confirmed. Patient check-in pending."}
                      {appointment.status === "arrived" && (
                        <div className="flex items-center justify-between">
                          <span className="text-blue-600 dark:text-blue-400">Patient arrived — provider notified. Waiting room.</span>
                          <button onClick={handleAdvanceStatus} className="text-violet-600 dark:text-violet-400 font-medium hover:underline">Start Session →</button>
                        </div>
                      )}
                      {appointment.status === "in-session" && (
                        <div className="flex items-center justify-between">
                          <span className="text-violet-600 dark:text-violet-400">Session in progress — encounter open.</span>
                          <button onClick={handleAdvanceStatus} className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">Complete →</button>
                        </div>
                      )}
                      {appointment.status === "completed" && <span className="text-emerald-600 dark:text-emerald-400">Session complete. Encounter sent to billing.</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* Terminal states */}
              {appointment.status === "cancelled" && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm font-semibold text-red-800 dark:text-red-300">Appointment Cancelled</p>
                  {appointment.cancellationReason && <p className="text-xs text-red-600 dark:text-red-400 mt-1">Reason: {appointment.cancellationReason}</p>}
                </div>
              )}
              {appointment.status === "no-show" && (
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Marked as No Show</p>
                  <p className="text-xs text-slate-500 mt-1">Appointment time passed without patient check-in.</p>
                </div>
              )}

              {/* ── Activity Timeline ── */}
              <ActivityTimeline appointment={appointment} />
            </div>
          </>
        )}
      </div>

      {/* Sub-modals */}
      {cancelOpen && appointment && patient && provider && (
        <CancelModal
          appointment={appointment}
          patient={patient}
          provider={provider}
          waitlistEntries={waitlistMatches}
          patientMap={patientMap}
          onConfirm={handleCancelConfirm}
          onClose={() => setCancelOpen(false)}
        />
      )}
      {checkInOpen && appointment && patient && provider && (
        <CheckInModal
          appointment={appointment}
          patient={patient}
          provider={provider}
          onConfirm={handleCheckInConfirm}
          onClose={() => setCheckInOpen(false)}
        />
      )}
      {rescheduleOpen && appointment && patient && provider && (
        <RescheduleModal
          appointment={appointment}
          patient={patient}
          provider={provider}
          allAppointments={allAppointments}
          onConfirm={handleRescheduleConfirm}
          onClose={() => setRescheduleOpen(false)}
        />
      )}
      {noShowOpen && appointment && patient && provider && (
        <NoShowModal
          appointment={appointment}
          patient={patient}
          provider={provider}
          onConfirm={handleNoShowConfirm}
          onClose={() => setNoShowOpen(false)}
        />
      )}
    </>
  );
}
