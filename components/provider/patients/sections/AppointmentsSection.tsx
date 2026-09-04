"use client";

import { useMemo, useState } from "react";
import { Video, Phone, MapPin, ChevronRight, CalendarX } from "lucide-react";
import { CC_APPOINTMENTS, type CcAppointment } from "@/data/cc-appointments";
import type { PatientProfile } from "@/data/provider-patients";
import { cn } from "@/lib/utils";
import { ProviderApptDetail } from "@/components/provider/appointments/ProviderApptDetail";
import { providerName, fmt12, fmtShortDate } from "./shared";

type Tab = "upcoming" | "past" | "pending";

const TABS: { id: Tab; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "past", label: "Past" },
  { id: "pending", label: "Pending / Waitlist" },
];

const UPCOMING = ["confirmed", "arrived", "in-session"];
const PAST = ["completed", "no-show", "cancelled"];
const PENDING = ["waitlisted", "requested"];

const MODE_ICON = { telehealth: Video, phone: Phone, "in-person": MapPin } as const;

const STATUS_CFG: Record<string, string> = {
  confirmed: "text-brand-700 dark:text-brand-400",
  arrived: "text-blue-600 dark:text-blue-400",
  "in-session": "text-brand-700 dark:text-brand-400",
  completed: "text-emerald-600 dark:text-emerald-400",
  "no-show": "text-slate-400",
  cancelled: "text-red-600 dark:text-red-400",
  waitlisted: "text-amber-600 dark:text-amber-400",
  requested: "text-sky-600 dark:text-sky-400",
};

export function AppointmentsSection({ patient }: { patient: PatientProfile }) {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [selected, setSelected] = useState<CcAppointment | null>(null);

  const mine = useMemo(
    () => CC_APPOINTMENTS.filter((a) => a.patientId === patient.id),
    [patient.id],
  );

  const today = new Date().toISOString().split("T")[0];
  const buckets = useMemo(() => {
    return {
      upcoming: mine
        .filter((a) => UPCOMING.includes(a.status) && a.date >= today)
        .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)),
      past: mine
        .filter((a) => PAST.includes(a.status) || (UPCOMING.includes(a.status) && a.date < today))
        .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime)),
      pending: mine
        .filter((a) => PENDING.includes(a.status))
        .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)),
    };
  }, [mine, today]);

  const rows = buckets[tab];

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-brand-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
            )}
          >
            {t.label}
            <span className={cn("text-xs", tab === t.id ? "text-white/80" : "text-slate-400")}>{buckets[t.id].length}</span>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <CalendarX className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-400">No {TABS.find((t) => t.id === tab)?.label.toLowerCase()} appointments.</p>
          </div>
        ) : rows.map((a) => {
          const ModeIcon = MODE_ICON[a.mode];
          return (
            <button
              key={a.id}
              onClick={() => setSelected(a)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="w-11 shrink-0 text-center">
                <p className="text-[11px] font-semibold uppercase text-slate-400">{new Date(a.date + "T12:00:00").toLocaleDateString("en-US", { month: "short" })}</p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-200 leading-none">{new Date(a.date + "T12:00:00").getDate()}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{a.visitType}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <ModeIcon className="w-3 h-3" /> {fmt12(a.startTime)} · {providerName(a.providerId)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={cn("text-xs font-semibold capitalize", STATUS_CFG[a.status])}>{a.status.replace("-", " ")}</p>
                <p className="text-[10px] text-slate-400">{fmtShortDate(a.date)}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
            </button>
          );
        })}
      </div>

      {selected && <ProviderApptDetail appt={selected} mode="drawer" onClose={() => setSelected(null)} />}
    </div>
  );
}
