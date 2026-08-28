"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import { ProviderApptDetail } from "@/components/provider/appointments/ProviderApptDetail";
import { CC_APPOINTMENTS, type CcAppointment } from "@/data/cc-appointments";
import { CC_PATIENTS } from "@/data/cc-patients";
import { ChevronLeft, ChevronRight, Video, Phone, Check, Eye, EyeOff, List, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEncounterStore, getEffectiveAppointment } from "@/lib/encounter-store";
import { VISIT_TYPES, visitColor } from "@/lib/visit-types";

const CURRENT_PROVIDER_ID = "p1";
const SLOT_H = 56;
const START_H = 7;
const END_H = 20;
const TOTAL_H = (END_H - START_H) * 2 * SLOT_H;

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function minutesToY(min: number) {
  return ((min - START_H * 60) / 30) * SLOT_H;
}
function timeToY(t: string) {
  const [h, m] = t.split(":").map(Number);
  return minutesToY(h * 60 + m);
}
function durationPx(s: string, e: string) {
  const [sh, sm] = s.split(":").map(Number);
  const [eh, em] = e.split(":").map(Number);
  return (((eh * 60 + em) - (sh * 60 + sm)) / 30) * SLOT_H;
}
function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function weekDays(d: Date): Date[] {
  const day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => { const x = new Date(mon); x.setDate(mon.getDate() + i); return x; });
}
function dateStr(d: Date) { return d.toISOString().split("T")[0]; }
function isSameDay(a: Date, b: Date) { return a.toDateString() === b.toDateString(); }

/** Column-pack a day's appointments so overlapping ones sit side by side
 *  instead of stacking on top of each other. */
type Placed = { appt: CcAppointment; leftPct: number; widthPct: number };
function packDay(appts: CcAppointment[]): Placed[] {
  const sorted = [...appts].sort((a, b) => toMin(a.startTime) - toMin(b.startTime) || toMin(a.endTime) - toMin(b.endTime));
  const out: Placed[] = [];
  let cluster: CcAppointment[] = [];
  let clusterEnd = -1;

  const flush = () => {
    if (cluster.length === 0) return;
    const colEnds: number[] = [];
    const colOf = new Map<string, number>();
    for (const a of cluster) {
      const s = toMin(a.startTime);
      let col = colEnds.findIndex((end) => end <= s);
      if (col === -1) { col = colEnds.length; colEnds.push(0); }
      colEnds[col] = toMin(a.endTime);
      colOf.set(a.id, col);
    }
    const cols = colEnds.length;
    for (const a of cluster) {
      const col = colOf.get(a.id) ?? 0;
      out.push({ appt: a, leftPct: (col / cols) * 100, widthPct: (1 / cols) * 100 });
    }
    cluster = [];
    clusterEnd = -1;
  };

  for (const a of sorted) {
    const s = toMin(a.startTime);
    if (cluster.length > 0 && s >= clusterEnd) flush();
    cluster.push(a);
    clusterEnd = Math.max(clusterEnd, toMin(a.endTime));
  }
  flush();
  return out;
}

type ModeFilter = "all" | "in-person" | "telehealth" | "phone";
const STATUS_FILTERS = ["all", "confirmed", "arrived", "in-session", "completed", "requested", "waitlisted", "no-show"] as const;

export default function ProviderAppointmentsPage() {
  useEncounterStore();
  const [anchor, setAnchor] = useState(new Date());
  const [selectedApptId, setSelectedApptId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("appt");
  });
  const [showCancelled, setShowCancelled] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visitFilter, setVisitFilter] = useState<Set<string>>(new Set());
  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");

  const [nowMin, setNowMin] = useState(() => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); });
  useEffect(() => {
    const t = setInterval(() => { const n = new Date(); setNowMin(n.getHours() * 60 + n.getMinutes()); }, 60000);
    return () => clearInterval(t);
  }, []);

  const today = new Date();
  const days = useMemo(() => weekDays(anchor), [anchor]);

  const myAppts = useMemo(() => {
    return CC_APPOINTMENTS
      .filter((a) => a.providerId === CURRENT_PROVIDER_ID)
      .map(getEffectiveAppointment)
      .filter((a) => {
        if (!showCancelled && a.status === "cancelled") return false;
        if (statusFilter !== "all" && a.status !== statusFilter) return false;
        if (modeFilter !== "all" && a.mode !== modeFilter) return false;
        if (visitFilter.size > 0 && !visitFilter.has(a.visitType)) return false;
        return true;
      });
  }, [showCancelled, statusFilter, modeFilter, visitFilter]);

  const selectedRaw = selectedApptId ? CC_APPOINTMENTS.find((a) => a.id === selectedApptId) ?? null : null;

  function prevWeek() { const d = new Date(anchor); d.setDate(d.getDate() - 7); setAnchor(d); }
  function nextWeek() { const d = new Date(anchor); d.setDate(d.getDate() + 7); setAnchor(d); }
  function goToday() { setAnchor(new Date()); }

  function openAppt(id: string) {
    setSelectedApptId(id);
    if (typeof window !== "undefined") window.history.replaceState(null, "", "/provider/appointments");
  }
  function closeAppt() { setSelectedApptId(null); }

  function toggleVisit(label: string) {
    setVisitFilter((prev) => {
      const n = new Set(prev);
      if (n.has(label)) n.delete(label); else n.add(label);
      return n;
    });
  }

  const weekLabel = `${days[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${days[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <ProviderLayout>
      <div className="flex flex-col h-[calc(100vh-60px)]">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 flex-wrap" data-tour="cal-toolbar">
          <button onClick={prevWeek} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={nextWeek} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><ChevronRight className="w-4 h-4" /></button>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 min-w-[190px]">{weekLabel}</span>
          <button onClick={goToday} className="px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700">Today</button>

          <div className="ml-auto flex items-center gap-2" data-tour="cal-filters">
            <button onClick={() => setFiltersOpen((o) => !o)}
              className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all",
                filtersOpen || visitFilter.size || modeFilter !== "all" || statusFilter !== "all"
                  ? "bg-brand-600 text-white border-brand-600" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500")}>
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
            </button>
            <button onClick={() => setShowCancelled((v) => !v)}
              className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all",
                showCancelled ? "bg-slate-700 text-white border-slate-700" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500")}>
              {showCancelled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />} Cancelled
            </button>
            <Link href="/provider/appointments/list" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800">
              <List className="w-3.5 h-3.5" /> List
            </Link>
          </div>
        </div>

        {/* Filter panel */}
        {filtersOpen && (
          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 shrink-0 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mode</span>
              <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value as ModeFilter)} className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                <option value="all">All</option><option value="in-person">In person</option><option value="telehealth">Telehealth</option><option value="phone">Phone</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_FILTERS)[number])} className="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 capitalize">
                {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s === "all" ? "All" : s.replace("-", " ")}</option>)}
              </select>
            </div>
            {(visitFilter.size > 0 || modeFilter !== "all" || statusFilter !== "all") && (
              <button onClick={() => { setVisitFilter(new Set()); setModeFilter("all"); setStatusFilter("all"); }} className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline">Clear all</button>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="px-5 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0 flex flex-wrap items-center gap-3" data-tour="cal-legend">
          {VISIT_TYPES.map((v) => {
            const active = visitFilter.size === 0 || visitFilter.has(v.label);
            return (
              <button key={v.id} onClick={() => toggleVisit(v.label)}
                className={cn("flex items-center gap-1.5 text-[11px] font-medium transition-opacity", active ? "opacity-100" : "opacity-30")}>
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: v.color }} />
                {v.label}
              </button>
            );
          })}
        </div>

        <WeekView days={days} appointments={myAppts} today={today} nowMin={nowMin} onSelect={openAppt} />
      </div>

      {selectedRaw && <ProviderApptDetail appt={selectedRaw} mode="drawer" onClose={closeAppt} />}
    </ProviderLayout>
  );
}

function WeekView({ days, appointments, today, nowMin, onSelect }: {
  days: Date[];
  appointments: CcAppointment[];
  today: Date;
  nowMin: number;
  onSelect: (id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = SLOT_H * (8 - START_H) * 2;
  }, []);

  const hours = Array.from({ length: END_H - START_H }, (_, i) => START_H + i);
  const nowY = minutesToY(nowMin);
  const nowInRange = nowMin >= START_H * 60 && nowMin <= END_H * 60;

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto" data-tour="cal-grid">
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex">
        <div className="w-16 shrink-0" />
        {days.map((day) => {
          const isToday = isSameDay(day, today);
          const count = appointments.filter((a) => a.date === dateStr(day) && a.status !== "cancelled").length;
          return (
            <div key={day.toISOString()} className={cn("flex-1 min-w-[130px] text-center py-2 border-l border-slate-100 dark:border-slate-800", isToday && "bg-brand-50/50 dark:bg-brand-950/20")}>
              <p className={cn("text-[10px] font-medium uppercase tracking-wide", isToday ? "text-brand-600 dark:text-brand-400" : "text-slate-400")}>{day.toLocaleDateString("en-US", { weekday: "short" })}</p>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <p className={cn("text-base font-bold", isToday ? "text-brand-600 dark:text-brand-400" : "text-slate-700 dark:text-slate-300")}>{day.getDate()}</p>
                {count > 0 && <span className="text-[9px] bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 px-1 rounded-full font-medium">{count}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex" style={{ height: TOTAL_H }}>
        <div className="w-16 shrink-0 relative">
          {hours.map((h) => (
            <div key={h} className="absolute w-full flex items-start justify-end pr-2.5" style={{ top: (h - START_H) * SLOT_H * 2, height: SLOT_H * 2 }}>
              <span className="text-[10px] text-slate-400 leading-none -mt-1.5">{h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`}</span>
            </div>
          ))}
        </div>

        {days.map((day) => {
          const ds = dateStr(day);
          const isToday = isSameDay(day, today);
          const placed = packDay(appointments.filter((a) => a.date === ds));
          return (
            <div key={ds} className={cn("flex-1 min-w-[130px] relative border-l border-slate-100 dark:border-slate-800", isToday && "bg-brand-50/20 dark:bg-brand-950/10")}>
              {hours.map((h) => (
                <div key={h} className="absolute w-full border-t border-slate-100 dark:border-slate-800/80" style={{ top: (h - START_H) * SLOT_H * 2 }} />
              ))}
              {hours.map((h) => (
                <div key={h + 0.5} className="absolute w-full border-t border-slate-50 dark:border-slate-800/40" style={{ top: (h - START_H) * SLOT_H * 2 + SLOT_H }} />
              ))}

              {/* now line */}
              {isToday && nowInRange && (
                <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: nowY }}>
                  <div className="relative">
                    <div className="absolute -left-1 -top-[3px] w-1.5 h-1.5 rounded-full bg-red-500" />
                    <div className="border-t border-red-500" />
                  </div>
                </div>
              )}

              {placed.map(({ appt, leftPct, widthPct }) => {
                const patient = CC_PATIENTS.find((p) => p.id === appt.patientId);
                const color = visitColor(appt.visitType);
                const h = durationPx(appt.startTime, appt.endTime);
                const compact = h < 40;
                const isCancelled = appt.status === "cancelled";
                const ModeIcon = appt.mode === "telehealth" ? Video : appt.mode === "phone" ? Phone : Check;
                return (
                  <button key={appt.id} onClick={() => onSelect(appt.id)}
                    className={cn("absolute rounded-md overflow-hidden text-left border border-l-[3px] hover:z-30 hover:shadow-lg transition-shadow", isCancelled && "opacity-40 grayscale")}
                    style={{
                      top: timeToY(appt.startTime) + 1,
                      height: Math.max(h - 2, 16),
                      left: `calc(${leftPct}% + 2px)`,
                      width: `calc(${widthPct}% - 4px)`,
                      backgroundColor: color + "1e",
                      borderColor: color,
                    }}>
                    <div className="px-1.5 py-1 h-full flex flex-col overflow-hidden">
                      <p className="text-[10px] font-semibold truncate leading-tight" style={{ color }}>{patient?.displayName ?? "—"}</p>
                      {!compact && <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">{appt.visitType}</p>}
                      {!compact && (
                        <div className="flex items-center gap-1 mt-auto">
                          <ModeIcon className="w-2 h-2 text-slate-400" />
                          <span className="text-[9px] text-slate-400">{fmt12(appt.startTime)}</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
