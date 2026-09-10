"use client";

// The one appointment-detail surface for the Provider portal. Renders as a
// right-side Drawer (Calendar, Schedule List, Patient → Appointments) or as
// a full page (/provider/appointments/[id]). Card-sectioned, with a working
// action set wired through encounter-store so every surface agrees on
// status, and the encounter note attached once one exists.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, X, Pencil, XCircle, LogIn, Play, LogOut, ShieldCheck, Loader2,
  Video, Phone, MapPin, Clock, CalendarDays, FileText, CheckCircle2,
  UserX, NotebookPen, ArrowRight, CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Drawer from "@/components/ui/Drawer";
import { CC_PATIENTS } from "@/data/cc-patients";
import { CLINICS } from "@/data/clinics";
import { PROVIDERS } from "@/data/providers";
import { type CcAppointment, type AppointmentStatus } from "@/data/cc-appointments";
import {
  useEncounterStore, getEffectiveAppointment,
  getNoteIdForAppointment, checkInPatient, startSession, checkOutPatient,
  setApptStatus, pushNotification,
} from "@/lib/encounter-store";
import { useEncounterNotes, getNoteForAppointment } from "@/lib/encounter-notes-store";
import { visitTypeDef, VISIT_TYPES } from "@/lib/visit-types";

function fmt12(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function fmtLongDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
function minutesUntil(dateIso: string, timeStr: string) {
  const [h, m] = timeStr.split(":").map(Number);
  const start = new Date(dateIso + "T00:00:00");
  start.setHours(h, m, 0, 0);
  return (start.getTime() - Date.now()) / 60000;
}

const STATUS_CFG: Record<string, { label: string; cls: string; dot: string }> = {
  confirmed:   { label: "Confirmed",  cls: "bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300", dot: "bg-brand-500" },
  arrived:     { label: "Checked In", cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300", dot: "bg-blue-500" },
  "in-session":{ label: "In Session", cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300", dot: "bg-indigo-500" },
  completed:   { label: "Completed",  cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300", dot: "bg-emerald-500" },
  cancelled:   { label: "Cancelled",  cls: "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400", dot: "bg-slate-400" },
  "no-show":   { label: "No Show",    cls: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300", dot: "bg-rose-500" },
  waitlisted:  { label: "Waitlisted", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300", dot: "bg-amber-500" },
  requested:   { label: "Requested",  cls: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300", dot: "bg-sky-500" },
};

const STEPS = ["Scheduled", "Checked In", "In Session", "Note", "Signed"] as const;
function stepIndex(status: AppointmentStatus, noteStatus?: string): number {
  if (["confirmed", "requested", "waitlisted"].includes(status)) return 0;
  if (status === "arrived") return 1;
  if (status === "in-session") return 2;
  if (status === "completed") return noteStatus === "signed" ? 4 : 3;
  return -1;
}

// ── modals ──────────────────────────────────────────────────────────────────

const fieldCls = "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-brand-500";

const CANCEL_REASONS = ["Patient request", "Provider unavailable", "Clinical — reschedule needed", "Insurance / authorization", "No longer needed", "Other"];

function ModalShell({ title, subtitle, onClose, children, footer }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex gap-3">{footer}</div>
      </div>
    </div>
  );
}

function CancelApptModal({ appt, patientName, onClose, onConfirm }: { appt: CcAppointment; patientName: string; onClose: () => void; onConfirm: (reason: string, notes: string) => void }) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const within24 = minutesUntil(appt.date, appt.startTime) < 24 * 60 && minutesUntil(appt.date, appt.startTime) > -60;
  return (
    <ModalShell title="Cancel appointment" subtitle={`${patientName} · ${fmtLongDate(appt.date)} · ${fmt12(appt.startTime)}`} onClose={onClose}
      footer={<>
        <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">Keep appointment</button>
        <button onClick={() => reason && onConfirm(reason, notes)} disabled={!reason}
          className={cn("flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors", reason ? "bg-rose-600 hover:bg-rose-700" : "bg-rose-300 dark:bg-rose-900/40 cursor-not-allowed")}>
          Cancel appointment
        </button>
      </>}>
      {within24 && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Within 24 hours — this will be logged as a late cancellation.
        </div>
      )}
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Reason <span className="text-rose-500">*</span></label>
        <select value={reason} onChange={(e) => setReason(e.target.value)} className={fieldCls}>
          <option value="">Select a reason</option>
          {CANCEL_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Notes (optional)</label>
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={cn(fieldCls, "resize-none")} placeholder="Context for the front desk / care team…" />
      </div>
    </ModalShell>
  );
}

function EditApptModal({ appt, patientName, onClose, onConfirm }: { appt: CcAppointment; patientName: string; onClose: () => void; onConfirm: (patch: Partial<CcAppointment>) => void }) {
  const [date, setDate] = useState(appt.date);
  const [start, setStart] = useState(appt.startTime);
  const [visitType, setVisitType] = useState(appt.visitType);
  const [mode, setMode] = useState(appt.mode);

  function save() {
    const [h, m] = start.split(":").map(Number);
    const endMins = h * 60 + m + appt.duration;
    const endTime = `${String(Math.floor(endMins / 60)).padStart(2, "0")}:${String(endMins % 60).padStart(2, "0")}`;
    const patch: Partial<CcAppointment> = { date, startTime: start, endTime, visitType, mode };
    if (date !== appt.date || start !== appt.startTime) {
      patch.rescheduledFrom = { date: appt.date, startTime: appt.startTime, endTime: appt.endTime };
    }
    onConfirm(patch);
  }

  return (
    <ModalShell title="Edit appointment" subtitle={patientName} onClose={onClose}
      footer={<>
        <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
        <button onClick={save} className="flex-1 py-2.5 rounded-lg text-sm font-semibold practmd-gradient text-white">Save changes</button>
      </>}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Start time</label>
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={fieldCls} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Visit type</label>
        <select value={visitType} onChange={(e) => setVisitType(e.target.value)} className={fieldCls}>
          {VISIT_TYPES.map((v) => <option key={v.id} value={v.label}>{v.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Mode</label>
        <select value={mode} onChange={(e) => setMode(e.target.value as CcAppointment["mode"])} className={fieldCls}>
          <option value="in-person">In person</option>
          <option value="telehealth">Telehealth</option>
          <option value="phone">Phone</option>
        </select>
      </div>
      <p className="text-[11px] text-slate-400">Duration ({appt.duration} min) is kept; the end time shifts with the start.</p>
    </ModalShell>
  );
}

// ── small presentational helpers ────────────────────────────────────────────

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h3>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3 text-sm py-1">
      <span className="w-28 shrink-0 text-xs text-slate-400">{label}</span>
      <span className="flex-1 text-slate-700 dark:text-slate-200 break-words">{children}</span>
    </div>
  );
}

// ── main ────────────────────────────────────────────────────────────────────

export function ProviderApptDetail({ appt: rawAppt, mode, onClose }: { appt: CcAppointment; mode: "drawer" | "page"; onClose?: () => void }) {
  useEncounterStore();
  useEncounterNotes();
  const router = useRouter();

  const appt = getEffectiveAppointment(rawAppt);
  const patient = CC_PATIENTS.find((p) => p.id === appt.patientId);
  const provider = PROVIDERS.find((p) => p.id === appt.providerId);
  const clinic = CLINICS.find((c) => c.id === appt.clinicId);
  const noteId = getNoteIdForAppointment(appt.id);
  const noteDoc = getNoteForAppointment(appt.id);

  const [eligState, setEligState] = useState<"idle" | "checking" | "done">("idle");
  const [modal, setModal] = useState<"cancel" | "edit" | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const vt = visitTypeDef(appt.visitType);
  const st = STATUS_CFG[appt.status] ?? STATUS_CFG.confirmed;
  const ModeIcon = appt.mode === "telehealth" ? Video : appt.mode === "phone" ? Phone : MapPin;
  const step = stepIndex(appt.status, noteDoc?.status);

  const minsUntil = minutesUntil(appt.date, appt.startTime);
  const isToday = appt.date === new Date().toISOString().split("T")[0];
  const canCheckIn = appt.status === "confirmed" && isToday && minsUntil <= 30 && minsUntil >= -120;
  const checkInHint = appt.status === "confirmed" && !canCheckIn
    ? (!isToday ? "Check-in opens on the day of the appointment" : minsUntil > 30 ? "Check-in opens 30 minutes before the start" : "Check-in window has passed")
    : "";
  const canStartSession = appt.status === "arrived" || appt.status === "in-session";
  const canCheckOut = appt.status === "in-session";
  const canEdit = ["confirmed", "requested", "waitlisted"].includes(appt.status);
  const canCancel = ["confirmed", "requested", "waitlisted", "arrived"].includes(appt.status);
  const canNoShow = ["confirmed", "arrived"].includes(appt.status) && minsUntil < -10;

  function flash(m: string) { setToast(m); setTimeout(() => setToast(null), 2600); }

  function doCheckIn() {
    checkInPatient(rawAppt);
    flash(`${patient?.firstName ?? "Patient"} checked in — now in the waiting room.`);
  }
  function doStartSession() {
    const { noteId: nid } = startSession(rawAppt);
    router.push(`/provider/encounters/${nid}`);
  }
  function doCheckOut() {
    checkOutPatient(appt.id);
    flash("Checked out — the encounter note is now pending your signature.");
  }
  function doCancel(reason: string, notes: string) {
    setApptStatus(appt.id, "cancelled", { cancellationReason: reason, notes: notes || appt.notes });
    pushNotification({ kind: "generic", message: `Appointment cancelled — ${patient?.displayName ?? "patient"} (${reason})`, href: "/provider/appointments/list" });
    setModal(null);
    flash("Appointment cancelled.");
  }
  function doEdit(patch: Partial<CcAppointment>) {
    setApptStatus(appt.id, "confirmed", patch);
    pushNotification({ kind: "generic", message: `Appointment updated — ${patient?.displayName ?? "patient"}`, href: `/provider/appointments/list?appt=${appt.id}`, apptId: appt.id });
    setModal(null);
    flash("Appointment updated.");
  }
  function doNoShow() {
    setApptStatus(appt.id, "no-show");
    flash("Marked as no-show.");
  }

  const actions = (
    <div className="flex flex-wrap gap-2">
      {canCheckIn && (
        <button onClick={doCheckIn} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold practmd-gradient text-white">
          <LogIn className="w-4 h-4" /> Check in patient
        </button>
      )}
      {canStartSession && (
        <button onClick={doStartSession} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white">
          <Play className="w-4 h-4" /> {appt.status === "in-session" ? "Resume session" : "Start session"}
        </button>
      )}
      {canCheckOut && (
        <button onClick={doCheckOut} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
          <LogOut className="w-4 h-4" /> Check out
        </button>
      )}
      {canEdit && (
        <button onClick={() => setModal("edit")} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
      )}
      {canCancel && (
        <button onClick={() => setModal("cancel")} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30">
          <XCircle className="w-3.5 h-3.5" /> Cancel
        </button>
      )}
      {canNoShow && (
        <button onClick={doNoShow} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">
          <UserX className="w-3.5 h-3.5" /> No-show
        </button>
      )}
      {!canCheckIn && checkInHint && (
        <span className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5" /> {checkInHint}
        </span>
      )}
    </div>
  );

  if (!patient || !provider) {
    const body = <div className="p-6 text-sm text-slate-400">Appointment details unavailable.</div>;
    return mode === "page" ? body : (
      <Drawer open onClose={onClose ?? (() => {})} title="Appointment">{body}</Drawer>
    );
  }

  const body = (
    <div className="space-y-4">
      {/* status + stepper */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold", st.cls)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", st.dot)} /> {st.label}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: vt.color }} /> {appt.visitType}
          </span>
        </div>
        {step >= 0 && (
          <div className="flex items-center">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center border-2 text-[10px] font-bold",
                    i < step ? "bg-brand-500 border-brand-500 text-white" : i === step ? "border-brand-500 text-brand-600 dark:text-brand-400" : "border-slate-200 dark:border-slate-700 text-slate-300")}>
                    {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className={cn("text-[9px] mt-1 font-medium whitespace-nowrap", i === step ? "text-brand-600 dark:text-brand-400" : "text-slate-400")}>{label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={cn("h-0.5 flex-1 mx-1 -mt-4", i < step ? "bg-brand-400" : "bg-slate-200 dark:bg-slate-700")} />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* date/time hero */}
      <div className="rounded-xl practmd-gradient-vivid text-white p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Appointment</p>
        <p className="mt-1 text-lg font-bold">{fmtLongDate(appt.date)}</p>
        <p className="text-sm text-white/85">{fmt12(appt.startTime)} – {fmt12(appt.endTime)} · {appt.duration} min · <span className="capitalize">{appt.mode}</span></p>
        {appt.rescheduledFrom && (
          <p className="text-xs text-white/70 mt-1">Rescheduled from {fmtLongDate(appt.rescheduledFrom.date)} at {fmt12(appt.rescheduledFrom.startTime)}</p>
        )}
      </div>

      {mode === "page" && <div>{actions}</div>}

      {/* encounter note */}
      {noteId && (
        <Card title="Encounter note">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-100 dark:bg-brand-950/40 flex items-center justify-center shrink-0">
              <NotebookPen className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {noteDoc?.noteType ?? "SOAP"} note
                <span className={cn("ml-2 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded",
                  noteDoc?.status === "signed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : noteDoc?.status === "pending-cosign" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400")}>
                  {noteDoc?.status === "signed" ? "Signed" : noteDoc?.status === "pending-cosign" ? "Awaiting co-sign" : "Draft"}
                </span>
              </p>
              <p className="text-xs text-slate-400">{noteDoc?.status === "signed" ? "Complete" : "Needs documentation and signature"}</p>
            </div>
            <Link href={`/provider/encounters/${noteId}`} className="flex items-center gap-1 text-sm font-semibold text-brand-700 dark:text-brand-400 hover:underline shrink-0">
              Open note <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>
      )}

      {/* patient */}
      <Card title="Patient" action={
        <Link href={`/provider/patients/${patient.id}`} className="text-xs font-semibold text-brand-700 dark:text-brand-400 hover:underline">Open chart</Link>
      }>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-700 dark:text-brand-300 text-sm font-bold shrink-0">
            {patient.firstName[0]}{patient.lastName[0]}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{patient.displayName}</p>
            <p className="text-xs text-slate-400 font-mono">{patient.mrn}</p>
          </div>
        </div>
        <Row label="Phone">{patient.phone}</Row>
        <Row label="Email">{patient.email}</Row>
      </Card>

      {/* visit details */}
      <Card title="Visit details">
        <Row label="Clinic">{clinic?.name ?? "Penfield Psychiatry"}</Row>
        <Row label="Provider">{provider.displayName}</Row>
        <Row label="Visit type"><span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: vt.color }} />{appt.visitType}</span></Row>
        <Row label="Mode"><span className="inline-flex items-center gap-1.5 capitalize"><ModeIcon className="w-3.5 h-3.5 text-slate-400" />{appt.mode}</span></Row>
        <Row label="Resources">{appt.mode === "telehealth" ? "Secure video room" : "Room 4 · standard"}</Row>
      </Card>

      {/* insurance */}
      <Card title="Insurance & eligibility">
        <Row label="Plan">{patient.insuranceProvider ?? "Self-pay"}</Row>
        <Row label="Member ID">{patient.insuranceMemberId ?? "—"}</Row>
        <Row label="Status">
          {eligState === "done"
            ? <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium"><ShieldCheck className="w-3.5 h-3.5" /> Verified · Active · $30 copay</span>
            : <span className={cn("capitalize font-medium", patient.insuranceStatus === "inactive" ? "text-rose-600 dark:text-rose-400" : patient.insuranceStatus === "pending" ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>{patient.insuranceStatus ?? "unknown"}</span>}
        </Row>
        <button onClick={() => { setEligState("checking"); setTimeout(() => setEligState("done"), 1100); }} disabled={eligState !== "idle"}
          className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60">
          {eligState === "checking" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          {eligState === "checking" ? "Checking…" : eligState === "done" ? "Re-check eligibility" : "Check eligibility"}
        </button>
      </Card>

      {/* forms */}
      {appt.forms && appt.forms.length > 0 && (
        <Card title="Forms assigned">
          <ul className="space-y-1.5">
            {appt.forms.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {f}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* reason */}
      <Card title="Reason for visit">
        <p className="text-sm text-slate-700 dark:text-slate-300">{appt.notes || "No reason recorded for this visit."}</p>
      </Card>

      {/* terminal states */}
      {appt.status === "cancelled" && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 p-4">
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">Appointment cancelled</p>
          {appt.cancellationReason && <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">Reason: {appt.cancellationReason}</p>}
        </div>
      )}

      {appt.status === "completed" && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20 p-4 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
          <CreditCard className="w-4 h-4" />
          {noteDoc?.status === "signed" ? "Session complete — charge sent to billing." : "Session complete — encounter note pending signature."}
        </div>
      )}
    </div>
  );

  const modals = (
    <>
      {modal === "cancel" && <CancelApptModal appt={appt} patientName={patient.displayName} onClose={() => setModal(null)} onConfirm={doCancel} />}
      {modal === "edit" && <EditApptModal appt={appt} patientName={patient.displayName} onClose={() => setModal(null)} onConfirm={doEdit} />}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[90] px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium shadow-xl">
          {toast}
        </div>
      )}
    </>
  );

  if (mode === "page") {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Link href="/provider/appointments/list" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-3">
          <ChevronLeft className="w-4 h-4" /> Appointments
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-950/40 flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">{patient.displayName}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{appt.visitType} · {fmtLongDate(appt.date)}</p>
          </div>
        </div>
        {body}
        {modals}
      </div>
    );
  }

  return (
    <>
      <Drawer open onClose={onClose ?? (() => {})} title={appt.visitType} description={`${fmtLongDate(appt.date)} · ${fmt12(appt.startTime)}`} width="w-[460px]"
        footer={<div className="w-full">{actions}</div>}>
        {body}
      </Drawer>
      {modals}
    </>
  );
}
