"use client";

import { useState } from "react";
import { Check, X, CalendarClock, Clock, Video, Phone, MapPin, ChevronDown, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { getRequestedAppointments } from "@/data/cc-appointments";
import { CC_PATIENTS } from "@/data/cc-patients";
import { PROVIDERS } from "@/data/providers";
import { cn } from "@/lib/utils";

function fmt12(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function fmtDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const MODE_ICON = { telehealth: Video, phone: Phone, "in-person": MapPin };

const REJECTION_REASONS = [
  "No availability",
  "Provider unavailable",
  "Visit type not available",
  "Please call to reschedule",
  "Other",
];

type FinalStatus = "confirmed" | "rejected";

interface RequestOutcome {
  status: FinalStatus;
  note?: string;
  rejectionReason?: string;
  timestamp: string;
}

type FilterTab = "all" | "pending" | "confirmed" | "rejected";

export default function RequestsView({ onReschedule }: { onReschedule?: () => void }) {
  const requests = getRequestedAppointments();

  // Per-request UI panel state: null = default buttons, "confirming" = confirm panel, "rejecting" = reject panel
  const [panels, setPanels] = useState<Record<string, "confirming" | "rejecting" | null>>({});
  // Final outcomes after confirm / reject
  const [outcomes, setOutcomes] = useState<Record<string, RequestOutcome>>({});
  // Per-request confirm note
  const [confirmNotes, setConfirmNotes] = useState<Record<string, string>>({});
  // Per-request rejection form
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});
  // Toast
  const [toast, setToast] = useState<{ id: string; message: string; type: "success" | "error" } | null>(null);
  // Expanded slots
  const [expanded, setExpanded] = useState<string | null>(null);
  // Filter
  const [filter, setFilter] = useState<FilterTab>("all");

  function setPanel(id: string, p: "confirming" | "rejecting" | null) {
    setPanels(prev => ({ ...prev, [id]: p }));
  }

  function showToast(message: string, type: "success" | "error" = "success") {
    const id = Math.random().toString(36).slice(2);
    setToast({ id, message, type });
    setTimeout(() => setToast(null), 4000);
  }

  function confirmAppointment(apptId: string, patientName: string) {
    const note = confirmNotes[apptId] ?? "";
    setOutcomes(prev => ({ ...prev, [apptId]: { status: "confirmed", note, timestamp: new Date().toISOString() } }));
    setPanels(prev => ({ ...prev, [apptId]: null }));
    showToast(`Appointment confirmed for ${patientName}. Confirmation sent.`, "success");
  }

  function rejectAppointment(apptId: string, patientName: string) {
    const reason = rejectReasons[apptId] ?? REJECTION_REASONS[0];
    const note = rejectNotes[apptId] ?? "";
    setOutcomes(prev => ({ ...prev, [apptId]: { status: "rejected", rejectionReason: reason, note, timestamp: new Date().toISOString() } }));
    setPanels(prev => ({ ...prev, [apptId]: null }));
    showToast(`Request from ${patientName} has been rejected.`, "error");
  }

  function undoOutcome(apptId: string) {
    setOutcomes(prev => {
      const next = { ...prev };
      delete next[apptId];
      return next;
    });
  }

  // Categorise requests
  const categorised = requests.map(r => ({
    ...r,
    outcome: outcomes[r.id] ?? null,
  }));

  const pending = categorised.filter(r => !r.outcome);
  const confirmed = categorised.filter(r => r.outcome?.status === "confirmed");
  const rejected = categorised.filter(r => r.outcome?.status === "rejected");

  function getFiltered() {
    if (filter === "pending") return pending;
    if (filter === "confirmed") return confirmed;
    if (filter === "rejected") return rejected;
    return categorised;
  }

  const filtered = getFiltered();

  const FILTER_TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: categorised.length },
    { key: "pending", label: "Pending", count: pending.length },
    { key: "confirmed", label: "Confirmed", count: confirmed.length },
    { key: "rejected", label: "Rejected", count: rejected.length },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950">
      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed top-4 right-4 z-[70] flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium animate-in slide-in-from-right-4 fade-in duration-200",
          toast.type === "success"
            ? "bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
            : "bg-white dark:bg-slate-900 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
        )}>
          {toast.type === "success"
            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
            : <XCircle className="w-4 h-4 shrink-0" />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Scheduling Requests</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Self-scheduling requests from the patient portal requiring review</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 text-xs font-semibold border border-blue-200 dark:border-blue-800">
            {pending.length} pending
          </span>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-1 mt-3">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                filter === tab.key
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                  filter === tab.key
                    ? "bg-white/20 dark:bg-black/20 text-white dark:text-slate-900"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <CalendarClock className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">
              {filter === "all" ? "No requests" : `No ${filter} requests`}
            </p>
          </div>
        )}

        {filtered.map(appt => {
          const patient = CC_PATIENTS.find(p => p.id === appt.patientId);
          const provider = PROVIDERS.find(p => p.id === appt.providerId);
          const ModeIcon = MODE_ICON[appt.mode];
          const isReserved = appt.appointmentType === "reserved" && appt.reservedSlots && appt.reservedSlots.length > 0;
          const isExpanded = expanded === appt.id;
          const currentPanel = panels[appt.id] ?? null;
          const outcome = appt.outcome;

          return (
            <div key={appt.id} className={cn(
              "rounded-2xl border bg-white dark:bg-slate-900 overflow-hidden transition-all hover:shadow-md",
              outcome?.status === "confirmed"
                ? "border-emerald-200 dark:border-emerald-800"
                : outcome?.status === "rejected"
                ? "border-red-200 dark:border-red-800 opacity-70"
                : "border-slate-200 dark:border-slate-700"
            )}>
              {/* Card header */}
              <div className="flex items-start gap-4 p-4">
                {/* Patient avatar */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ backgroundColor: provider?.color ?? "#94a3b8" }}>
                  {patient?.firstName[0]}{patient?.lastName[0]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{patient?.displayName}</p>
                    <span className="text-xs text-slate-500">{patient?.mrn}</span>
                    {appt.requestedAt && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />{timeAgo(appt.requestedAt)}
                      </span>
                    )}
                    {/* Status badge */}
                    {outcome?.status === "confirmed" && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3 h-3" /> Confirmed
                      </span>
                    )}
                    {outcome?.status === "rejected" && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-[10px] font-semibold border border-red-200 dark:border-red-800">
                        <XCircle className="w-3 h-3" /> Rejected
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: provider?.color }} />
                      {provider?.displayName}
                    </span>
                    <span>{appt.visitType}</span>
                    <span className="flex items-center gap-1"><ModeIcon className="w-3 h-3" />{appt.mode === "in-person" ? "In-Person" : appt.mode}</span>
                  </div>

                  {/* Slot info */}
                  {isReserved ? (
                    <div className="mt-2">
                      <button onClick={() => setExpanded(e => e === appt.id ? null : appt.id)}
                        className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
                        {appt.reservedSlots!.length} slot options for patient to choose
                        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isExpanded && "rotate-180")} />
                      </button>
                      {isExpanded && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {appt.reservedSlots!.map((s, i) => (
                            <div key={i} className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-400 font-medium">
                              {fmtDate(s.date)} · {fmt12(s.startTime)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5">
                      Requested: <span className="font-medium">{fmtDate(appt.date)}</span> at <span className="font-medium">{fmt12(appt.startTime)}</span>
                    </p>
                  )}

                  {appt.notes && (
                    <p className="mt-2 text-xs italic text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-lg px-2.5 py-1.5">
                      &quot;{appt.notes}&quot;
                    </p>
                  )}

                  {/* Outcome note / reason */}
                  {outcome?.rejectionReason && (
                    <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                      Reason: {outcome.rejectionReason}
                      {outcome.note && ` — "${outcome.note}"`}
                    </p>
                  )}
                  {outcome?.status === "confirmed" && outcome.note && (
                    <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 italic">
                      Note to patient: &quot;{outcome.note}&quot;
                    </p>
                  )}
                </div>

                {/* Insurance */}
                <div className="hidden sm:block text-right text-xs text-slate-400 shrink-0">
                  <p>{patient?.insuranceProvider}</p>
                </div>
              </div>

              {/* Action bar — only for pending */}
              {!outcome && (
                <div className="px-4 pb-4">
                  {/* Confirm panel */}
                  {currentPanel === "confirming" && (
                    <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-3">
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                        <Check className="w-4 h-4" /> Confirm Appointment
                      </p>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Optional note to patient
                        </label>
                        <textarea
                          rows={2}
                          placeholder="e.g., Please arrive 10 minutes early"
                          value={confirmNotes[appt.id] ?? ""}
                          onChange={e => setConfirmNotes(prev => ({ ...prev, [appt.id]: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-slate-400"
                        />
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setPanel(appt.id, null)}
                          className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                          Cancel
                        </button>
                        <button
                          onClick={() => confirmAppointment(appt.id, patient?.displayName ?? "Patient")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors">
                          <Check className="w-3.5 h-3.5" /> Confirm Appointment
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reject panel */}
                  {currentPanel === "rejecting" && (
                    <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-4 space-y-3">
                      <p className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Reject Request
                      </p>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Rejection reason
                        </label>
                        <select
                          value={rejectReasons[appt.id] ?? REJECTION_REASONS[0]}
                          onChange={e => setRejectReasons(prev => ({ ...prev, [appt.id]: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-red-200 dark:border-red-700 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                        >
                          {REJECTION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                          Optional note
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Additional details for the patient…"
                          value={rejectNotes[appt.id] ?? ""}
                          onChange={e => setRejectNotes(prev => ({ ...prev, [appt.id]: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-red-200 dark:border-red-700 text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-red-400 placeholder:text-slate-400"
                        />
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setPanel(appt.id, null)}
                          className="px-3 py-1.5 rounded-lg text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                          Cancel
                        </button>
                        <button
                          onClick={() => rejectAppointment(appt.id, patient?.displayName ?? "Patient")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors">
                          <X className="w-3.5 h-3.5" /> Reject Request
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Default action buttons */}
                  {currentPanel === null && (
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setPanel(appt.id, "rejecting")}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                      <button onClick={onReschedule}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <CalendarClock className="w-3.5 h-3.5" />
                        Reschedule
                      </button>
                      <button onClick={() => setPanel(appt.id, "confirming")}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors">
                        <Check className="w-3.5 h-3.5" />
                        Confirm
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Processed footer with Undo */}
              {outcome && (
                <div className={cn(
                  "flex items-center justify-between px-4 py-3 border-t text-xs",
                  outcome.status === "confirmed"
                    ? "border-emerald-100 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400"
                    : "border-red-100 dark:border-red-900 bg-red-50/50 dark:bg-red-950/10 text-red-600 dark:text-red-400"
                )}>
                  <span>
                    {outcome.status === "confirmed" ? "Confirmed" : `Rejected · ${outcome.rejectionReason ?? ""}`}
                    {" · "}{timeAgo(outcome.timestamp)}
                  </span>
                  <button
                    onClick={() => undoOutcome(appt.id)}
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline text-[11px] transition-colors">
                    Undo
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
