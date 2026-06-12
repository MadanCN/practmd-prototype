"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import AppointmentDetailDrawer from "@/components/care-coordinator/appointments/AppointmentDetailDrawer";
import { CC_APPOINTMENTS, type CcAppointment } from "@/data/cc-appointments";
import { CC_PATIENTS } from "@/data/cc-patients";
import { PROVIDERS } from "@/data/providers";
import { ChevronLeft, ChevronRight, Video, Phone, Check, Eye, EyeOff, List, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

const CURRENT_PROVIDER_ID = "p1";
const SLOT_H = 56;
const START_H = 7;
const END_H = 20;
const TOTAL_H = (END_H - START_H) * 2 * SLOT_H;

const VISIT_TYPE_COLOR: Record<string, string> = {
  "Initial Consultation":    "#0ea5e9",
  "Follow-Up":               "#10b981",
  "Medication Check":        "#8b5cf6",
  "Therapy Session":         "#f59e0b",
  "Group Session":           "#ef4444",
  "Telehealth Consultation": "#06b6d4",
};
function visitColor(vt: string) { return VISIT_TYPE_COLOR[vt] ?? "#64748b"; }

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  confirmed:   { label: "Confirmed",  cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  arrived:     { label: "Arrived",    cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  "in-session":{ label: "In Session", cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  waitlisted:  { label: "Waitlist",   cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  requested:   { label: "Requested",  cls: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400" },
  cancelled:   { label: "Cancelled",  cls: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
  completed:   { label: "Completed",  cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  "no-show":   { label: "No Show",    cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function timeToY(t: string) {
  const [h, m] = t.split(":").map(Number);
  return ((h - START_H) * 60 + m) / 30 * SLOT_H;
}
function durationPx(s: string, e: string) {
  const [sh, sm] = s.split(":").map(Number);
  const [eh, em] = e.split(":").map(Number);
  return ((eh * 60 + em) - (sh * 60 + sm)) / 30 * SLOT_H;
}
function weekDays(d: Date): Date[] {
  const day = d.getDay();
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => { const x = new Date(mon); x.setDate(mon.getDate() + i); return x; });
}
function dateStr(d: Date) { return d.toISOString().split("T")[0]; }
function isSameDay(a: Date, b: Date) { return a.toDateString() === b.toDateString(); }

type ViewMode = "week" | "list";

export default function ProviderAppointmentsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [anchor, setAnchor] = useState(new Date());
  const [selectedAppt, setSelectedAppt] = useState<CcAppointment | null>(null);
  const [appointments, setAppointments] = useState(CC_APPOINTMENTS);
  const [showCancelled, setShowCancelled] = useState(false);

  const provider = PROVIDERS.find(p => p.id === CURRENT_PROVIDER_ID)!;
  const today = new Date();
  const days = useMemo(() => weekDays(anchor), [anchor]);

  const myAppts = useMemo(() =>
    appointments.filter(a => {
      if (a.providerId !== CURRENT_PROVIDER_ID) return false;
      if (!showCancelled && a.status === "cancelled") return false;
      return true;
    }),
    [appointments, showCancelled]
  );

  function handleUpdateAppt(id: string, changes: Partial<CcAppointment>) {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...changes } : a));
    if (selectedAppt?.id === id) setSelectedAppt(prev => prev ? { ...prev, ...changes } : null);
  }

  function prevWeek() { const d = new Date(anchor); d.setDate(d.getDate() - 7); setAnchor(d); }
  function nextWeek() { const d = new Date(anchor); d.setDate(d.getDate() + 7); setAnchor(d); }
  function goToday() { setAnchor(new Date()); }

  const weekLabel = (() => {
    const start = days[0];
    const end = days[6];
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  })();

  return (
    <ProviderLayout>
      <div className="flex flex-col h-[calc(100vh-60px)]">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
          {/* Nav */}
          <button onClick={prevWeek} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={nextWeek} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 min-w-[200px]">{weekLabel}</span>
          <button onClick={goToday} className="px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            Today
          </button>

          <div className="ml-auto flex items-center gap-2">
            {/* Cancelled toggle */}
            <button onClick={() => setShowCancelled(v => !v)}
              className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all",
                showCancelled ? "bg-slate-700 text-white border-slate-700" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500")}>
              {showCancelled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              Cancelled
            </button>

            {/* View toggle */}
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              {(["week", "list"] as ViewMode[]).map(v => (
                <button key={v} onClick={() => setViewMode(v)}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
                    viewMode === v ? "bg-violet-600 text-white" : "bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800")}>
                  {v === "week" ? <CalendarDays className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
                  {v === "week" ? "Week" : "List"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* View content */}
        {viewMode === "week" ? (
          <WeekView days={days} appointments={myAppts} today={today} onSelect={setSelectedAppt} />
        ) : (
          <ListView appointments={myAppts} today={today} onSelect={setSelectedAppt} />
        )}
      </div>

      {/* Detail drawer */}
      {selectedAppt && (
        <AppointmentDetailDrawer
          appointment={selectedAppt}
          allAppointments={appointments}
          onClose={() => setSelectedAppt(null)}
          onUpdate={handleUpdateAppt}
        />
      )}
    </ProviderLayout>
  );
}

// ── Week view ─────────────────────────────────────────────────────────────────
function WeekView({ days, appointments, today, onSelect }: {
  days: Date[];
  appointments: CcAppointment[];
  today: Date;
  onSelect: (a: CcAppointment) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = SLOT_H * (9 - START_H) * 2;
  }, []);

  const hours = Array.from({ length: END_H - START_H }, (_, i) => START_H + i);

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto">
      {/* Day headers */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex">
        <div className="w-16 shrink-0" />
        {days.map(day => {
          const isToday = isSameDay(day, today);
          const dayApptCount = appointments.filter(a => a.date === dateStr(day) && !["cancelled"].includes(a.status)).length;
          return (
            <div key={day.toISOString()} className={cn("flex-1 min-w-[130px] text-center py-2 border-l border-slate-100 dark:border-slate-800",
              isToday && "bg-violet-50/50 dark:bg-violet-950/20")}>
              <p className={cn("text-[10px] font-medium uppercase tracking-wide", isToday ? "text-violet-600 dark:text-violet-400" : "text-slate-400")}>
                {day.toLocaleDateString("en-US", { weekday: "short" })}
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <p className={cn("text-base font-bold",
                  isToday ? "text-violet-600 dark:text-violet-400" : "text-slate-700 dark:text-slate-300")}>
                  {day.getDate()}
                </p>
                {dayApptCount > 0 && (
                  <span className="text-[9px] bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 px-1 rounded-full font-medium">
                    {dayApptCount}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div className="flex" style={{ height: TOTAL_H }}>
        {/* Time labels */}
        <div className="w-16 shrink-0 relative">
          {hours.map(h => (
            <div key={h} className="absolute w-full flex items-start justify-end pr-2.5" style={{ top: (h - START_H) * SLOT_H * 2, height: SLOT_H * 2 }}>
              <span className="text-[10px] text-slate-400 leading-none -mt-1.5">
                {h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map(day => {
          const ds = dateStr(day);
          const isToday = isSameDay(day, today);
          const dayAppts = appointments.filter(a => a.date === ds);
          return (
            <div key={ds} className={cn("flex-1 min-w-[130px] relative border-l border-slate-100 dark:border-slate-800",
              isToday && "bg-violet-50/20 dark:bg-violet-950/10")}>
              {/* Hour lines */}
              {hours.map(h => (
                <div key={h} className="absolute w-full border-t border-slate-100 dark:border-slate-800/80" style={{ top: (h - START_H) * SLOT_H * 2 }} />
              ))}
              {/* Half-hour lines */}
              {hours.map(h => (
                <div key={h + 0.5} className="absolute w-full border-t border-slate-50 dark:border-slate-800/40" style={{ top: (h - START_H) * SLOT_H * 2 + SLOT_H }} />
              ))}

              {/* Appointment cards */}
              {dayAppts.map(appt => {
                const patient = CC_PATIENTS.find(p => p.id === appt.patientId);
                const vColor = visitColor(appt.visitType);
                const h = durationPx(appt.startTime, appt.endTime);
                const compact = h < 44;
                const isCancelled = appt.status === "cancelled";
                const isWL = appt.status === "waitlisted";
                const ModeIcon = appt.mode === "telehealth" ? Video : appt.mode === "phone" ? Phone : Check;
                return (
                  <div key={appt.id} onClick={() => onSelect(appt)}
                    className={cn("absolute left-1 right-1 rounded-md overflow-hidden cursor-pointer hover:z-10 hover:shadow-md transition-all",
                      isWL ? "border border-dashed" : "border-l-2 border border-t border-r border-b",
                      isCancelled && "opacity-40 grayscale")}
                    style={{
                      top: timeToY(appt.startTime) + 1,
                      height: Math.max(h - 2, 18),
                      backgroundColor: vColor + "18",
                      borderColor: vColor,
                      borderLeftColor: vColor,
                    }}>
                    <div className="px-1.5 py-1 h-full flex flex-col overflow-hidden">
                      <p className="text-[10px] font-semibold truncate leading-tight" style={{ color: vColor }}>
                        {patient?.displayName ?? "—"}
                      </p>
                      {!compact && (
                        <p className="text-[9px] text-slate-500 truncate">{appt.visitType}</p>
                      )}
                      {!compact && (
                        <div className="flex items-center gap-1 mt-auto">
                          <ModeIcon className="w-2 h-2 text-slate-400" />
                          <span className="text-[9px] text-slate-400">{fmt12(appt.startTime)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── List view ─────────────────────────────────────────────────────────────────
function ListView({ appointments, today, onSelect }: {
  appointments: CcAppointment[];
  today: Date;
  onSelect: (a: CcAppointment) => void;
}) {
  const sorted = [...appointments].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  const grouped: Record<string, CcAppointment[]> = {};
  for (const a of sorted) {
    if (!grouped[a.date]) grouped[a.date] = [];
    grouped[a.date].push(a);
  }

  function fmt12(t: string) {
    const [h, m] = t.split(":").map(Number);
    return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  }

  function fmtDate(iso: string) {
    const d = new Date(iso + "T12:00:00");
    const isToday = iso === today.toISOString().split("T")[0];
    return isToday ? `Today — ${d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}` :
      d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }

  return (
    <div className="flex-1 overflow-auto p-5">
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-sm text-slate-400">No appointments to show.</div>
      ) : (
        <div className="space-y-5 max-w-3xl">
          {Object.entries(grouped).map(([date, appts]) => {
            const isToday = date === today.toISOString().split("T")[0];
            return (
              <div key={date}>
                <h3 className={cn("text-xs font-semibold uppercase tracking-wide mb-2",
                  isToday ? "text-violet-600 dark:text-violet-400" : "text-slate-500 dark:text-slate-400")}>
                  {fmtDate(date)}
                </h3>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                  {appts.map(appt => {
                    const patient = CC_PATIENTS.find(p => p.id === appt.patientId);
                    const vColor = visitColor(appt.visitType);
                    const ModeIcon = appt.mode === "telehealth" ? Video : appt.mode === "phone" ? Phone : Check;
                    const st = STATUS_LABEL[appt.status] ?? { label: appt.status, cls: "" };
                    return (
                      <div key={appt.id} onClick={() => onSelect(appt)}
                        className={cn("flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors",
                          appt.status === "cancelled" && "opacity-50")}>
                        <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: vColor }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{patient?.displayName ?? "—"}</p>
                          <p className="text-xs text-slate-500 truncate">{appt.visitType} · {patient?.insuranceProvider ?? "Self-pay"}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <ModeIcon className="w-3.5 h-3.5" />
                            <span>{fmt12(appt.startTime)} – {fmt12(appt.endTime)}</span>
                          </div>
                          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", st.cls)}>
                            {st.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
