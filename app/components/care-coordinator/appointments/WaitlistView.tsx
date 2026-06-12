"use client";

import { useState } from "react";
import { GripVertical, Clock, UserCheck, CalendarPlus, MoreHorizontal, Phone, Video, MapPin } from "lucide-react";
import { getWaitlistedAppointments } from "@/data/cc-appointments";
import { CC_PATIENTS } from "@/data/cc-patients";
import { PROVIDERS } from "@/data/providers";
import { cn } from "@/lib/utils";

function fmt12(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

const MODE_ICON = { telehealth: Video, phone: Phone, "in-person": MapPin };

export default function WaitlistView({ onSchedule }: { onSchedule?: () => void }) {
  const waitlist = getWaitlistedAppointments();
  const [openActions, setOpenActions] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Waitlist</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{waitlist.length} patients waiting · Drag to reprioritize</p>
          </div>
          <button onClick={onSchedule} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors">
            <CalendarPlus className="w-3.5 h-3.5" />
            Schedule from Waitlist
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
        {[
          { label: "Total Waiting", value: waitlist.length, color: "slate" },
          { label: "Avg Wait Time", value: "4.2 days", color: "amber" },
          { label: "Scheduled Today", value: "2", color: "teal" },
        ].map(s => (
          <div key={s.label} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Waitlist items */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {waitlist.length === 0 && (
          <div className="text-center py-16">
            <Clock className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No patients on the waitlist</p>
          </div>
        )}

        {waitlist.map((appt, idx) => {
          const patient = CC_PATIENTS.find(p => p.id === appt.patientId);
          const provider = PROVIDERS.find(p => p.id === appt.providerId);
          const ModeIcon = MODE_ICON[appt.mode];

          return (
            <div key={appt.id}
              className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-teal-300 dark:hover:border-teal-700 transition-all hover:shadow-sm group">
              {/* Drag handle + position */}
              <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-700 cursor-grab active:cursor-grabbing group-hover:text-slate-400 transition-colors" />
                <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
              </div>

              {/* Patient avatar */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                style={{ backgroundColor: provider?.color ?? "#94a3b8" }}>
                {patient?.firstName[0]}{patient?.lastName[0]}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{patient?.displayName}</p>
                  <span className="text-xs text-slate-500">{patient?.mrn}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: provider?.color }} />
                    {provider?.displayName}
                  </span>
                  <span>{appt.visitType}</span>
                  <span className="flex items-center gap-1"><ModeIcon className="w-3 h-3" />{appt.mode === "in-person" ? "In-Person" : appt.mode}</span>
                </div>
                {appt.notes && (
                  <p className="mt-1.5 text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-800 rounded-lg px-2.5 py-1.5">
                    &quot;{appt.notes}&quot;
                  </p>
                )}
              </div>

              {/* Insurance */}
              {patient?.insuranceProvider && (
                <div className="hidden sm:block text-right shrink-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{patient.insuranceProvider}</p>
                  <p className="text-[10px] text-slate-400">{patient.insuranceMemberId}</p>
                </div>
              )}

              {/* Actions */}
              <div className="relative shrink-0">
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={onSchedule}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors">
                    <CalendarPlus className="w-3.5 h-3.5" />
                    Schedule
                  </button>
                  <button onClick={() => setOpenActions(o => o === appt.id ? null : appt.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                {openActions === appt.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpenActions(null)} />
                    <div className="absolute right-0 top-8 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden w-40">
                      {["Move to top", "Contact patient", "Remove from list"].map(a => (
                        <button key={a} onClick={() => setOpenActions(null)}
                          className={cn("w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                            a === "Remove from list" ? "text-red-500" : "text-slate-700 dark:text-slate-300")}>
                          {a}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
