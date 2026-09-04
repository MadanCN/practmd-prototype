"use client";

import { useMemo, useState } from "react";
import { Search, Video, Phone, MapPin, CalendarDays, ChevronRight, Plus } from "lucide-react";
import { CC_APPOINTMENTS, type CcAppointment, type AppointmentMode } from "@/data/cc-appointments";
import { CC_PATIENTS } from "@/data/cc-patients";
import { PROVIDERS } from "@/data/providers";
import { VISIT_TYPES, visitColor } from "@/lib/visit-types";
import { cn } from "@/lib/utils";
import AppointmentDetailDrawer from "./AppointmentDetailDrawer";
import NewAppointmentDrawer, { type PrefilledSlot } from "./NewAppointmentDrawer";

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
const selCls = "px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300";

export default function ListView() {
  const [appointments, setAppointments] = useState<CcAppointment[]>(CC_APPOINTMENTS);
  const [selected, setSelected] = useState<CcAppointment | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<RangeFilter>("All");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modeFilter, setModeFilter] = useState<AppointmentMode | "all">("all");
  const [visitFilter, setVisitFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");

  const todayIso = new Date().toISOString().split("T")[0];
  const in7 = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split("T")[0]; })();

  const rows = useMemo(() => {
    return appointments
      .filter((a) => a.status !== "waitlisted" && a.status !== "requested")
      .filter((a) => providerFilter === "all" ? true : a.providerId === providerFilter)
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
        const prov = PROVIDERS.find((x) => x.id === a.providerId);
        const q = query.toLowerCase();
        return (p?.displayName.toLowerCase().includes(q) ?? false)
          || (prov?.displayName.toLowerCase().includes(q) ?? false)
          || a.visitType.toLowerCase().includes(q);
      })
      // newest appointment first, always
      .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));
  }, [appointments, providerFilter, range, statusFilter, modeFilter, visitFilter, query, todayIso, in7]);

  function updateAppt(id: string, changes: Partial<CcAppointment>) {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, ...changes } : a)));
    setSelected((prev) => (prev?.id === id ? { ...prev, ...changes } : prev));
  }

  const thisYear = new Date().getFullYear();
  function fmtDate(iso: string) {
    if (iso === todayIso) return "Today";
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString("en-US", d.getFullYear() === thisYear
      ? { weekday: "short", month: "short", day: "numeric" }
      : { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Appointments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {rows.length} appointment{rows.length !== 1 ? "s" : ""} · all providers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search patient, provider, visit type…"
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <button onClick={() => setNewOpen(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg practmd-gradient text-white text-sm font-semibold shrink-0">
            <Plus className="w-4 h-4" /> New
          </button>
        </div>
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          {RANGE_OPTIONS.map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={cn("px-3 py-1.5 text-xs font-medium transition-colors", range === r ? "bg-brand-600 text-white" : "bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800")}>
              {r}
            </button>
          ))}
        </div>
        <select value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)} className={selCls}>
          <option value="all">All providers</option>
          {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={cn(selCls, "capitalize")}>
          <option value="all">All statuses</option>
          {Object.keys(STATUS_LABEL).filter((s) => !["waitlisted", "requested"].includes(s)).map((s) => <option key={s} value={s}>{STATUS_LABEL[s].label}</option>)}
        </select>
        <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value as AppointmentMode | "all")} className={cn(selCls, "capitalize")}>
          {MODE_FILTERS.map((m) => <option key={m} value={m}>{m === "all" ? "All modes" : m}</option>)}
        </select>
        <select value={visitFilter} onChange={(e) => setVisitFilter(e.target.value)} className={selCls}>
          <option value="all">All visit types</option>
          {VISIT_TYPES.map((v) => <option key={v.id} value={v.label}>{v.label}</option>)}
        </select>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CalendarDays className="w-8 h-8 text-slate-300 mb-3" />
          <p className="text-sm text-slate-400">No appointments match these filters.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Time</th>
                <th className="px-4 py-2.5">Patient</th>
                <th className="px-4 py-2.5">Provider</th>
                <th className="px-4 py-2.5">Visit type</th>
                <th className="px-4 py-2.5">Mode</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {rows.map((a) => {
                const p = CC_PATIENTS.find((x) => x.id === a.patientId);
                const prov = PROVIDERS.find((x) => x.id === a.providerId);
                const st = STATUS_LABEL[a.status] ?? { label: a.status, cls: "" };
                const ModeIcon = a.mode === "telehealth" ? Video : a.mode === "phone" ? Phone : MapPin;
                const isToday = a.date === todayIso;
                return (
                  <tr key={a.id} onClick={() => setSelected(a)} className={cn("cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors", a.status === "cancelled" && "opacity-50")}>
                    <td className={cn("px-4 py-3 whitespace-nowrap font-medium", isToday ? "text-brand-600 dark:text-brand-400" : "text-slate-500 dark:text-slate-400")}>{fmtDate(a.date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">{fmt12(a.startTime)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{p?.displayName ?? "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: prov?.color }} />{prov?.displayName ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: visitColor(a.visitType) }} />{a.visitType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400"><span className="inline-flex items-center gap-1.5 capitalize"><ModeIcon className="w-3.5 h-3.5" />{a.mode}</span></td>
                    <td className="px-4 py-3"><span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", st.cls)}>{st.label}</span></td>
                    <td className="px-4 py-3 text-right"><ChevronRight className="w-4 h-4 text-slate-300 inline" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AppointmentDetailDrawer appointment={selected} allAppointments={appointments} onClose={() => setSelected(null)} onUpdate={updateAppt} />
      <NewAppointmentDrawer open={newOpen} onClose={() => setNewOpen(false)} prefilled={null as PrefilledSlot | null}
        onNewAppointment={(appt) => setAppointments((prev) => [...prev, appt])} />
    </div>
  );
}
