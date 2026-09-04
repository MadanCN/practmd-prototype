"use client";

import { useMemo, useState } from "react";
import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import { ProviderApptDetail } from "@/components/provider/appointments/ProviderApptDetail";
import { CC_APPOINTMENTS, type AppointmentMode } from "@/data/cc-appointments";
import { CC_PATIENTS } from "@/data/cc-patients";
import { Search, Video, Phone, MapPin, CalendarDays, NotebookPen, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEncounterStore, getEffectiveAppointment, getNoteIdForAppointment } from "@/lib/encounter-store";
import { useEncounterNotes, getNoteForAppointment } from "@/lib/encounter-notes-store";
import { VISIT_TYPES, visitColor } from "@/lib/visit-types";

const CURRENT_PROVIDER_ID = "p1";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  confirmed: { label: "Confirmed", cls: "bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300" },
  arrived: { label: "Checked In", cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" },
  "in-session": { label: "In Session", cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300" },
  waitlisted: { label: "Waitlist", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300" },
  requested: { label: "Requested", cls: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300" },
  cancelled: { label: "Cancelled", cls: "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
  completed: { label: "Completed", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" },
  "no-show": { label: "No Show", cls: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" },
};

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

const RANGE_OPTIONS = ["Upcoming", "Next 7 days", "Past", "All"] as const;
type RangeFilter = (typeof RANGE_OPTIONS)[number];
const MODE_FILTERS: (AppointmentMode | "all")[] = ["all", "in-person", "telehealth", "phone"];

export default function ProviderAppointmentsListPage() {
  useEncounterStore();
  useEncounterNotes();
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("appt");
  });
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<RangeFilter>("Upcoming");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modeFilter, setModeFilter] = useState<AppointmentMode | "all">("all");
  const [visitFilter, setVisitFilter] = useState<string>("all");

  const todayIso = new Date().toISOString().split("T")[0];
  const in7 = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split("T")[0]; })();

  const appts = useMemo(() => {
    return CC_APPOINTMENTS
      .filter((a) => a.providerId === CURRENT_PROVIDER_ID)
      .map(getEffectiveAppointment)
      .filter((a) =>
        range === "Upcoming" ? a.date >= todayIso
        : range === "Next 7 days" ? a.date >= todayIso && a.date <= in7
        : range === "Past" ? a.date < todayIso
        : true)
      .filter((a) => (statusFilter === "all" ? true : a.status === statusFilter))
      .filter((a) => (modeFilter === "all" ? true : a.mode === modeFilter))
      .filter((a) => (visitFilter === "all" ? true : a.visitType === visitFilter))
      .filter((a) => {
        if (!query.trim()) return true;
        const p = CC_PATIENTS.find((x) => x.id === a.patientId);
        const q = query.toLowerCase();
        return (p?.displayName.toLowerCase().includes(q) ?? false) || a.visitType.toLowerCase().includes(q);
      })
      // Always newest appointment first — regardless of range.
      .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));
  }, [range, statusFilter, modeFilter, visitFilter, query, todayIso, in7]);

  const selectedRaw = selectedId ? CC_APPOINTMENTS.find((a) => a.id === selectedId) ?? null : null;

  const needNote = appts.filter((a) => a.status === "completed" && getNoteForAppointment(a.id)?.status !== "signed").length;
  const upcoming = appts.filter((a) => a.date >= todayIso && !["cancelled", "no-show"].includes(a.status)).length;
  const completed = appts.filter((a) => a.status === "completed").length;

  function openAppt(id: string) {
    setSelectedId(id);
    if (typeof window !== "undefined") window.history.replaceState(null, "", "/provider/appointments/list");
  }

  const thisYear = new Date().getFullYear();
  function fmtDate(iso: string) {
    if (iso === todayIso) return "Today";
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("en-US", d.getFullYear() === thisYear
      ? { weekday: "short", month: "short", day: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" });
  }

  const selCls = "px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300";

  return (
    <ProviderLayout>
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">My Appointments</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{appts.length} appointment{appts.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search patient or visit type…"
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>

        {/* summary strip */}
        <div className="grid grid-cols-3 gap-3 mb-5 max-w-lg" data-tour="list-summary">
          {[
            { label: "Upcoming", value: upcoming, cls: "text-brand-600 dark:text-brand-400" },
            { label: "Completed", value: completed, cls: "text-emerald-600 dark:text-emerald-400" },
            { label: "Need note", value: needNote, cls: needNote > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
              <p className={cn("text-xl font-bold", s.cls)}>{s.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>

        {/* filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4" data-tour="list-filters">
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden" data-tour="list-range">
            {RANGE_OPTIONS.map((r) => (
              <button key={r} onClick={() => setRange(r)}
                className={cn("px-3 py-1.5 text-xs font-medium transition-colors", range === r ? "bg-brand-600 text-white" : "bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800")}>
                {r}
              </button>
            ))}
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={cn(selCls, "capitalize")}>
            <option value="all">All statuses</option>
            {Object.keys(STATUS_LABEL).map((s) => <option key={s} value={s}>{STATUS_LABEL[s].label}</option>)}
          </select>
          <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value as AppointmentMode | "all")} className={cn(selCls, "capitalize")}>
            {MODE_FILTERS.map((m) => <option key={m} value={m}>{m === "all" ? "All modes" : m}</option>)}
          </select>
          <select value={visitFilter} onChange={(e) => setVisitFilter(e.target.value)} className={selCls}>
            <option value="all">All visit types</option>
            {VISIT_TYPES.map((v) => <option key={v.id} value={v.label}>{v.label}</option>)}
          </select>
        </div>

        {/* table — one list, newest appointment first */}
        {appts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="w-8 h-8 text-slate-300 mb-3" />
            <p className="text-sm text-slate-400">No appointments match these filters.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto" data-tour="list-table">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Time</th>
                  <th className="px-4 py-2.5">Patient</th>
                  <th className="px-4 py-2.5">Visit type</th>
                  <th className="px-4 py-2.5">Mode</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Note</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {appts.map((a) => {
                  const p = CC_PATIENTS.find((x) => x.id === a.patientId);
                  const st = STATUS_LABEL[a.status] ?? { label: a.status, cls: "" };
                  const ModeIcon = a.mode === "telehealth" ? Video : a.mode === "phone" ? Phone : MapPin;
                  const noteId = getNoteIdForAppointment(a.id);
                  const noteDoc = getNoteForAppointment(a.id);
                  const isToday = a.date === todayIso;
                  return (
                    <tr key={a.id} onClick={() => openAppt(a.id)} className={cn("cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors", a.status === "cancelled" && "opacity-50")}>
                      <td className={cn("px-4 py-3 whitespace-nowrap font-medium", isToday ? "text-brand-600 dark:text-brand-400" : "text-slate-500 dark:text-slate-400")}>{fmtDate(a.date)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">{fmt12(a.startTime)}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{p?.displayName ?? "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: visitColor(a.visitType) }} />{a.visitType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400"><span className="inline-flex items-center gap-1.5 capitalize"><ModeIcon className="w-3.5 h-3.5" />{a.mode}</span></td>
                      <td className="px-4 py-3"><span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", st.cls)}>{st.label}</span></td>
                      <td className="px-4 py-3">
                        {noteId ? (
                          <span className={cn("inline-flex items-center gap-1 text-xs font-medium",
                            noteDoc?.status === "signed" ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
                            <NotebookPen className="w-3.5 h-3.5" /> {noteDoc?.status === "signed" ? "Signed" : "Draft"}
                          </span>
                        ) : <span className="text-xs text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right"><ChevronRight className="w-4 h-4 text-slate-300 inline" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedRaw && <ProviderApptDetail appt={selectedRaw} mode="drawer" onClose={() => setSelectedId(null)} />}
    </ProviderLayout>
  );
}
