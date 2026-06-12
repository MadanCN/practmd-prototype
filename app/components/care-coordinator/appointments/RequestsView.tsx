"use client";

import { useState } from "react";
import { Check, X, CalendarClock, Clock, Video, Phone, MapPin, ChevronDown, AlertCircle } from "lucide-react";
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

type ActionState = Record<string, "confirming" | "rescheduling" | "rejecting" | "done" | null>;

export default function RequestsView({ onReschedule }: { onReschedule?: () => void }) {
  const requests = getRequestedAppointments();
  const [actions, setActions] = useState<ActionState>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  function setAction(id: string, a: ActionState[string]) {
    setActions(prev => ({ ...prev, [id]: a }));
  }

  const pending = requests.filter(r => !actions[r.id] || actions[r.id] === null);
  const processed = requests.filter(r => actions[r.id] === "done");

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950">
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
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {pending.length === 0 && processed.length === 0 && (
          <div className="text-center py-16">
            <CalendarClock className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No pending requests</p>
          </div>
        )}

        {/* Pending */}
        {pending.map(appt => {
          const patient = CC_PATIENTS.find(p => p.id === appt.patientId);
          const provider = PROVIDERS.find(p => p.id === appt.providerId);
          const ModeIcon = MODE_ICON[appt.mode];
          const isReserved = appt.appointmentType === "reserved" && appt.reservedSlots && appt.reservedSlots.length > 0;
          const isExpanded = expanded === appt.id;
          const currentAction = actions[appt.id];

          if (currentAction === "done") return null;

          return (
            <div key={appt.id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden transition-all hover:shadow-md">
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
                </div>

                {/* Insurance */}
                <div className="hidden sm:block text-right text-xs text-slate-400 shrink-0">
                  <p>{patient?.insuranceProvider}</p>
                </div>
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-end gap-2 px-4 pb-4">
                {currentAction === "confirming" ? (
                  <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-2 text-sm text-emerald-700 dark:text-emerald-400">
                    <Check className="w-4 h-4" />
                    Confirm this appointment?
                    <button onClick={() => setAction(appt.id, "done")} className="ml-2 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700">Yes</button>
                    <button onClick={() => setAction(appt.id, null)} className="px-2.5 py-1 rounded-lg text-emerald-600 hover:bg-emerald-100 text-xs">Cancel</button>
                  </div>
                ) : currentAction === "rejecting" ? (
                  <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2 text-sm text-red-700 dark:text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    Reject this request?
                    <button onClick={() => setAction(appt.id, "done")} className="ml-2 px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700">Reject</button>
                    <button onClick={() => setAction(appt.id, null)} className="px-2.5 py-1 rounded-lg text-red-600 hover:bg-red-100 text-xs">Cancel</button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => setAction(appt.id, "rejecting")}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </button>
                    <button onClick={onReschedule}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <CalendarClock className="w-3.5 h-3.5" />
                      Reschedule
                    </button>
                    <button onClick={() => setAction(appt.id, "confirming")}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors">
                      <Check className="w-3.5 h-3.5" />
                      Confirm
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* Processed */}
        {processed.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Processed this session</p>
            {processed.map(appt => {
              const patient = CC_PATIENTS.find(p => p.id === appt.patientId);
              return (
                <div key={appt.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 opacity-60 mb-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <p className="text-sm text-slate-700 dark:text-slate-300">{patient?.displayName} — {appt.visitType}</p>
                  <span className="ml-auto text-xs text-slate-400">Processed</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
