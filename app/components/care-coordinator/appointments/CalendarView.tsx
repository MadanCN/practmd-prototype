"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, Check, Video, Phone, Clock, Users, Eye, EyeOff, CalendarDays } from "lucide-react";
import { CC_APPOINTMENTS, type CcAppointment } from "@/data/cc-appointments";
import { CC_PATIENTS } from "@/data/cc-patients";
import { PROVIDERS, type Provider } from "@/data/providers";
import NewAppointmentDrawer, { type PrefilledSlot } from "./NewAppointmentDrawer";
import AppointmentDetailDrawer from "./AppointmentDetailDrawer";
import { VISIT_TYPES, visitColor } from "@/lib/visit-types";
import { cn } from "@/lib/utils";

// ── Calendar constants ───────────────────────────────────────────────────────
const SLOT_H = 56;        // px per 30-min slot
const START_H = 7;        // 7 AM
const END_H = 20;         // 8 PM
const TOTAL_SLOTS = (END_H - START_H) * 2;
const TOTAL_H = TOTAL_SLOTS * SLOT_H;
const TIME_COL = 64;      // px
const COL_W = 220;        // px per provider column

type ViewMode = "day" | "week" | "month";

// ── Utilities ────────────────────────────────────────────────────────────────
function fmt12(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function fmtHour(h: number) {
  const ampm = h >= 12 ? "PM" : "AM";
  return `${(h % 12) || 12} ${ampm}`;
}

function timeToY(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return ((h - START_H) * 60 + m) / 30 * SLOT_H;
}

function durationPx(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return ((eh * 60 + em) - (sh * 60 + sm)) / 30 * SLOT_H;
}

function slotTime(slotIdx: number): string {
  const totalMins = START_H * 60 + slotIdx * 30;
  return `${Math.floor(totalMins / 60).toString().padStart(2, "0")}:${(totalMins % 60).toString().padStart(2, "0")}`;
}

function dateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

function weekDays(d: Date): Date[] {
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => { const x = new Date(monday); x.setDate(monday.getDate() + i); return x; });
}

function monthDays(d: Date): (Date | null)[] {
  const year = d.getFullYear();
  const month = d.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = (first.getDay() + 6) % 7; // Monday start
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let i = 1; i <= last.getDate(); i++) cells.push(new Date(year, month, i));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

const MODE_ICON: Record<string, React.ElementType> = { telehealth: Video, phone: Phone, "in-person": Check };
// visit-type colours come from the shared @/lib/visit-types module (imported above)

// ── Provider selector pill ───────────────────────────────────────────────────
function ProviderPill({ provider, selected, onToggle }: { provider: Provider; selected: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
        selected ? "text-white border-transparent" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400")}
      style={selected ? { backgroundColor: provider.color, borderColor: provider.color } : undefined}>
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: provider.color }} />
      {provider.displayName.replace("Dr. ", "").split(" ").pop()}
    </button>
  );
}

// ── Overlap lane-packing (matches the provider calendar) ─────────────────────
function toMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
type PlacedAppt = { appt: CcAppointment; leftPct: number; widthPct: number };
function packColumn(appts: CcAppointment[]): PlacedAppt[] {
  const sorted = [...appts].sort((a, b) => toMin(a.startTime) - toMin(b.startTime) || toMin(a.endTime) - toMin(b.endTime));
  const out: PlacedAppt[] = [];
  let cluster: CcAppointment[] = [];
  let clusterEnd = -1;
  const flush = () => {
    if (!cluster.length) return;
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
    for (const a of cluster) out.push({ appt: a, leftPct: ((colOf.get(a.id) ?? 0) / cols) * 100, widthPct: (1 / cols) * 100 });
    cluster = []; clusterEnd = -1;
  };
  for (const a of sorted) {
    if (cluster.length && toMin(a.startTime) >= clusterEnd) flush();
    cluster.push(a);
    clusterEnd = Math.max(clusterEnd, toMin(a.endTime));
  }
  flush();
  return out;
}

// ── Appointment card (provider day view) ────────────────────────────────────
function ApptCard({ appt, provider, onClick, leftPct = 0, widthPct = 100 }: { appt: CcAppointment; provider: Provider; onClick?: () => void; leftPct?: number; widthPct?: number }) {
  const patient = CC_PATIENTS.find(p => p.id === appt.patientId);
  const ModeIcon = MODE_ICON[appt.mode] ?? Check;
  const isWaitlist = appt.status === "waitlisted";
  const isRequested = appt.status === "requested";
  const isCancelled = appt.status === "cancelled";
  const h = durationPx(appt.startTime, appt.endTime);
  const compact = h < 50;

  const vColor = visitColor(appt.visitType);

  return (
    <div
      onClick={onClick}
      className={cn(
        "absolute rounded-lg overflow-hidden cursor-pointer group transition-all hover:z-20 hover:shadow-lg",
        (isWaitlist || isRequested) ? "border border-dashed" : "border-l-[3px] border border-t border-r border-b",
        isCancelled && "opacity-40 grayscale"
      )}
      style={{
        top: timeToY(appt.startTime) + 2,
        height: Math.max(h - 4, 20),
        left: `calc(${leftPct}% + 5px)`,
        width: `calc(${widthPct}% - 8px)`,
        backgroundColor: vColor + (isWaitlist || isRequested ? "15" : "18"),
        borderColor: vColor,
        borderLeftColor: vColor,
      }}>
      <div className="px-2 py-1.5 h-full flex flex-col justify-start overflow-hidden">
        <p className="text-xs font-semibold truncate leading-tight" style={{ color: vColor }}>
          {patient?.displayName ?? "Unknown"}
        </p>
        {!compact && (
          <>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate mt-0.5">{appt.visitType}</p>
            <div className="flex items-center gap-1 mt-auto">
              <ModeIcon className="w-2.5 h-2.5 text-slate-500" />
              {/* Provider dot so provider is still identifiable */}
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: provider.color }} />
              <span className="text-[10px] text-slate-500">{fmt12(appt.startTime)}</span>
              {isWaitlist && <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 px-1 rounded">WL</span>}
              {isRequested && <span className="ml-1 text-[10px] bg-blue-100 text-blue-700 px-1 rounded">Req</span>}
              {isCancelled && <span className="ml-1 text-[10px] bg-red-100 text-red-700 px-1 rounded">Cancelled</span>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Provider Day View ────────────────────────────────────────────────────────
function ProviderDayView({ date, providers, appointments, showWaitlisted, showRequested, showCancelled, onSlotClick, onApptClick }: {
  date: Date;
  providers: Provider[];
  appointments: CcAppointment[];
  showWaitlisted: boolean;
  showRequested: boolean;
  showCancelled: boolean;
  onSlotClick: (slot: PrefilledSlot) => void;
  onApptClick: (appt: CcAppointment) => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const dateStr_ = dateStr(date);
  const isToday = isSameDay(date, new Date());

  // Current time
  const now = new Date();
  const nowY = isToday ? timeToY(`${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`) : -1;

  // Scroll to current time or 8am on mount
  useEffect(() => {
    if (bodyRef.current) {
      const scrollTo = isToday ? Math.max(0, nowY - 120) : (1 * 2 * SLOT_H); // 8am
      bodyRef.current.scrollTop = scrollTo;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function syncHeaderScroll() {
    if (headerRef.current && bodyRef.current) {
      headerRef.current.scrollLeft = bodyRef.current.scrollLeft;
    }
  }

  const hours = Array.from({ length: END_H - START_H + 1 }, (_, i) => START_H + i);
  const slots = Array.from({ length: TOTAL_SLOTS }, (_, i) => i);
  const minWidth = TIME_COL + providers.length * COL_W + 60;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Provider header (syncs horizontal scroll) */}
      <div ref={headerRef} className="overflow-x-hidden flex-shrink-0 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
        style={{ minWidth }}>
        <div className="flex" style={{ minWidth }}>
          <div className="flex-shrink-0" style={{ width: TIME_COL }} />
          {providers.map(p => (
            <div key={p.id} className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-l border-slate-200 dark:border-slate-700" style={{ width: COL_W }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ backgroundColor: p.color }}>
                {p.firstName[0]}{p.lastName[0]}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{p.displayName}</p>
                <p className="text-xs text-slate-500 truncate">{p.providerType}</p>
              </div>
            </div>
          ))}
          {/* Add provider col */}
          <div className="flex-shrink-0 flex items-center justify-center border-l border-slate-200 dark:border-slate-700 w-[60px]">
            <span className="text-xs text-slate-400">+</span>
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div ref={bodyRef} className="flex-1 overflow-auto" onScroll={syncHeaderScroll} style={{ minWidth }}>
        <div className="flex relative" style={{ height: TOTAL_H, minWidth }}>
          {/* Time gutter (sticky left) */}
          <div className="sticky left-0 z-10 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex-shrink-0" style={{ width: TIME_COL }}>
            {hours.map(h => (
              <div key={h} className="absolute right-3 text-xs text-slate-400 font-medium -translate-y-2.5"
                style={{ top: (h - START_H) * 2 * SLOT_H }}>
                {fmtHour(h)}
              </div>
            ))}
          </div>

          {/* Horizontal grid lines (behind everything) */}
          <div className="absolute inset-0 pointer-events-none" style={{ left: TIME_COL }}>
            {slots.map(i => (
              <div key={i} className={cn("absolute w-full", i % 2 === 0 ? "border-t border-slate-200 dark:border-slate-800" : "border-t border-slate-100 dark:border-slate-800/50 border-dashed")}
                style={{ top: i * SLOT_H }} />
            ))}
          </div>

          {/* Provider columns */}
          {providers.map(p => {
            const appts = appointments.filter(a => {
              if (a.providerId !== p.id || a.date !== dateStr_) return false;
              if (a.status === "waitlisted" && !showWaitlisted) return false;
              if (a.status === "requested" && !showRequested) return false;
              if (a.status === "cancelled" && !showCancelled) return false;
              return true;
            });
            return (
              <div key={p.id} className="relative border-l border-slate-200 dark:border-slate-700 flex-shrink-0" style={{ width: COL_W }}>
                {/* Click zones */}
                {slots.map(i => (
                  <div key={i} className="absolute w-full hover:bg-blue-50/40 dark:hover:bg-blue-950/10 cursor-pointer transition-colors group"
                    style={{ top: i * SLOT_H, height: SLOT_H }}
                    onClick={() => onSlotClick({ providerId: p.id, date: dateStr_, startTime: slotTime(i) })}>
                    <span className="hidden group-hover:flex absolute inset-0 items-center justify-center">
                      <Plus className="w-3.5 h-3.5 text-blue-400/60" />
                    </span>
                  </div>
                ))}
                {/* Appointments — lane-packed so overlaps sit side by side */}
                {packColumn(appts).map(({ appt: a, leftPct, widthPct }) => (
                  <ApptCard key={a.id} appt={a} provider={p} onClick={() => onApptClick(a)} leftPct={leftPct} widthPct={widthPct} />
                ))}
              </div>
            );
          })}

          {/* Current time indicator */}
          {isToday && nowY >= 0 && (
            <div className="absolute z-20 flex items-center pointer-events-none" style={{ top: nowY, left: TIME_COL, right: 0 }}>
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0 -translate-x-1/2" />
              <div className="flex-1 h-0.5 bg-red-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Week View ────────────────────────────────────────────────────────────────
function WeekView({ date, selectedProviderIds, appointments, showWaitlisted, showRequested, showCancelled, onDayClick }: { date: Date; selectedProviderIds: string[]; appointments: CcAppointment[]; showWaitlisted: boolean; showRequested: boolean; showCancelled: boolean; onDayClick: (d: Date) => void }) {
  const days = weekDays(date);
  const today = new Date();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Day headers */}
      <div className="grid border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex-shrink-0" style={{ gridTemplateColumns: `${TIME_COL}px repeat(7, 1fr)` }}>
        <div />
        {days.map(d => (
          <div key={d.toISOString()} className={cn("py-2.5 px-2 text-center border-l border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800",
            isSameDay(d, today) && "bg-brand-50 dark:bg-brand-950/20")}>
            <p className="text-xs text-slate-500 uppercase tracking-wider">{d.toLocaleDateString("en-US", { weekday: "short" })}</p>
            <p className={cn("text-base font-bold mt-0.5", isSameDay(d, today) ? "text-brand-600 dark:text-brand-400" : "text-slate-800 dark:text-slate-200")}>
              {d.getDate()}
            </p>
          </div>
        ))}
      </div>
      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative" style={{ height: TOTAL_H }}>
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: TOTAL_SLOTS }, (_, i) => (
              <div key={i} className={cn("absolute w-full", i % 2 === 0 ? "border-t border-slate-200 dark:border-slate-800" : "border-t border-slate-100 dark:border-slate-800/50 border-dashed")}
                style={{ top: i * SLOT_H }} />
            ))}
          </div>
          <div className="grid h-full" style={{ gridTemplateColumns: `${TIME_COL}px repeat(7, 1fr)` }}>
            {/* Time col */}
            <div className="relative border-r border-slate-200 dark:border-slate-700">
              {Array.from({ length: END_H - START_H + 1 }, (_, i) => START_H + i).map(h => (
                <div key={h} className="absolute right-3 text-xs text-slate-400 font-medium -translate-y-2.5"
                  style={{ top: (h - START_H) * 2 * SLOT_H }}>
                  {fmtHour(h)}
                </div>
              ))}
            </div>
            {/* Day cols */}
            {days.map(d => {
              const ds = dateStr(d);
              const dayAppts = appointments.filter(a => {
                if (a.date !== ds || !selectedProviderIds.includes(a.providerId)) return false;
                if (a.status === "waitlisted" && !showWaitlisted) return false;
                if (a.status === "requested" && !showRequested) return false;
                if (a.status === "cancelled" && !showCancelled) return false;
                return true;
              });
              return (
                <div key={ds} className={cn("relative border-l border-slate-200 dark:border-slate-700", isSameDay(d, today) && "bg-brand-50/30 dark:bg-brand-950/10")}>
                  {dayAppts.map(a => {
                    const prov = PROVIDERS.find(p => p.id === a.providerId);
                    const patient = CC_PATIENTS.find(p => p.id === a.patientId);
                    if (!prov) return null;
                    const vc = visitColor(a.visitType);
                    return (
                      <div key={a.id} className="absolute left-0.5 right-0.5 rounded px-1.5 py-1 overflow-hidden border-l-2 cursor-pointer hover:brightness-95 transition-all"
                        style={{ top: timeToY(a.startTime) + 1, height: Math.max(durationPx(a.startTime, a.endTime) - 2, 18), backgroundColor: vc + "20", borderColor: vc }}>
                        <p className="text-[10px] font-semibold truncate" style={{ color: vc }}>{patient?.displayName}</p>
                        <p className="text-[10px] text-slate-500 truncate">{a.visitType}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Month View ───────────────────────────────────────────────────────────────
function MonthView({ date, selectedProviderIds, appointments, showWaitlisted, showRequested, showCancelled, onDayClick }: { date: Date; selectedProviderIds: string[]; appointments: CcAppointment[]; showWaitlisted: boolean; showRequested: boolean; showCancelled: boolean; onDayClick: (d: Date) => void }) {
  const today = new Date();
  const cells = monthDays(date);
  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="flex flex-col h-full overflow-auto p-4">
      {/* Day of week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map(l => (
          <div key={l} className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-2">{l}</div>
        ))}
      </div>
      {/* Cells */}
      <div className="grid grid-cols-7 flex-1 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const ds = dateStr(d);
          const dayAppts = appointments.filter(a => {
            if (a.date !== ds || !selectedProviderIds.includes(a.providerId)) return false;
            if (a.status === "waitlisted" && !showWaitlisted) return false;
            if (a.status === "requested" && !showRequested) return false;
            if (a.status === "cancelled" && !showCancelled) return false;
            return true;
          });
          const isToday_ = isSameDay(d, today);
          const isCurrentMonth = d.getMonth() === date.getMonth();
          return (
            <div key={ds} onClick={() => onDayClick(d)}
              className={cn("min-h-[90px] p-1.5 rounded-xl border cursor-pointer hover:shadow-md transition-all",
                isToday_ ? "border-brand-400 bg-brand-50/50 dark:bg-brand-950/20" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900",
                !isCurrentMonth && "opacity-40")}>
              <p className={cn("text-xs font-bold mb-1", isToday_ ? "text-brand-600 dark:text-brand-400" : "text-slate-700 dark:text-slate-300")}>{d.getDate()}</p>
              <div className="space-y-0.5">
                {dayAppts.slice(0, 3).map(a => {
                  const prov = PROVIDERS.find(p => p.id === a.providerId);
                  return (
                    <div key={a.id} className="text-[10px] truncate rounded px-1 py-0.5 font-medium"
                      style={{ backgroundColor: visitColor(a.visitType) + "25", color: visitColor(a.visitType) }}>
                      {fmt12(a.startTime)} {CC_PATIENTS.find(p => p.id === a.patientId)?.lastName}
                    </div>
                  );
                })}
                {dayAppts.length > 3 && <p className="text-[10px] text-slate-500 pl-1">+{dayAppts.length - 3} more</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main CalendarView ────────────────────────────────────────────────────────
export default function CalendarView() {
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProviderIds, setSelectedProviderIds] = useState<string[]>(["p1", "p2", "p3"]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [prefilled, setPrefilled] = useState<PrefilledSlot | null>(null);
  const [showProviderPicker, setShowProviderPicker] = useState(false);
  const [appointments, setAppointments] = useState<CcAppointment[]>(CC_APPOINTMENTS);
  const [selectedAppt, setSelectedAppt] = useState<CcAppointment | null>(null);
  const [showWaitlisted, setShowWaitlisted] = useState(true);
  const [showRequested, setShowRequested] = useState(true);
  const [showCancelled, setShowCancelled] = useState(false);

  const selectedProviders = PROVIDERS.filter(p => selectedProviderIds.includes(p.id));

  function updateAppointment(id: string, updates: Partial<CcAppointment>) {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    setSelectedAppt(prev => prev?.id === id ? { ...prev, ...updates } : prev);
  }

  function openDetailDrawer(appt: CcAppointment) {
    setSelectedAppt(appt);
    setDrawerOpen(false); // close new-appt drawer if open
  }

  function closeDetailDrawer() { setSelectedAppt(null); }

  function handleNewAppointment(appt: CcAppointment) {
    setAppointments(prev => [...prev, appt]);
  }

  function navigate(dir: -1 | 1) {
    const d = new Date(currentDate);
    if (viewMode === "day") d.setDate(d.getDate() + dir);
    else if (viewMode === "week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  }

  function openDrawer(slot?: PrefilledSlot) {
    setPrefilled(slot ?? null);
    setDrawerOpen(true);
  }

  // Date label for toolbar
  const dateLabel = useMemo(() => {
    if (viewMode === "day") {
      return currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    }
    if (viewMode === "week") {
      const days = weekDays(currentDate);
      const s = days[0].toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const e = days[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      return `${s} – ${e}`;
    }
    return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [viewMode, currentDate]);

  // Stats for today
  const todayStr = dateStr(currentDate);
  const todayAppts = appointments.filter(a => a.date === todayStr && ["confirmed", "arrived", "in-session"].includes(a.status) && selectedProviderIds.includes(a.providerId));
  const waitlistCount = appointments.filter(a => a.status === "waitlisted").length;
  const requestCount = appointments.filter(a => a.status === "requested").length;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-slate-950">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex-wrap">
        {/* Date navigation */}
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 h-8 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Today
          </button>
          <button onClick={() => navigate(1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          {/* Jump to date */}
          <label className="relative flex items-center">
            <span className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer transition-colors" title="Jump to date">
              <CalendarDays className="w-4 h-4" />
            </span>
            <input type="date" value={dateStr(currentDate)}
              onChange={(e) => { if (e.target.value) setCurrentDate(new Date(e.target.value + "T12:00:00")); }}
              className="absolute inset-0 opacity-0 cursor-pointer" />
          </label>
        </div>

        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex-1">{dateLabel}</h2>

        {/* Stats + visibility toggles */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <Clock className="w-3 h-3" />{todayAppts.length} appts
          </span>
          <button onClick={() => setShowWaitlisted(v => !v)}
            className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-all",
              showWaitlisted
                ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700")}>
            {showWaitlisted ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {waitlistCount} waitlisted
          </button>
          <button onClick={() => setShowRequested(v => !v)}
            className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-all",
              showRequested
                ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700")}>
            {showRequested ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {requestCount} requests
          </button>
          <button onClick={() => setShowCancelled(v => !v)}
            className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-all",
              showCancelled
                ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700")}>
            {showCancelled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Cancelled
          </button>
        </div>

        {/* Provider filter (day view only) */}
        {viewMode === "day" && (
          <div className="relative">
            <button onClick={() => setShowProviderPicker(p => !p)}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Users className="w-3.5 h-3.5" />
              Providers ({selectedProviderIds.length})
            </button>
            {showProviderPicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowProviderPicker(false)} />
                <div className="absolute right-0 top-10 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-3 w-56 space-y-1">
                  {PROVIDERS.map(p => (
                    <label key={p.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                      <input type="checkbox" className="accent-brand-600 w-4 h-4"
                        checked={selectedProviderIds.includes(p.id)}
                        onChange={() => setSelectedProviderIds(ids => ids.includes(p.id) ? ids.filter(i => i !== p.id) : [...ids, p.id])} />
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{p.displayName}</span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* View toggle */}
        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          {(["day", "week", "month"] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setViewMode(v)}
              className={cn("px-3 h-8 text-xs font-medium transition-colors capitalize",
                viewMode === v ? "bg-brand-600 text-white" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800")}>
              {v}
            </button>
          ))}
        </div>

        {/* New appointment */}
        <button onClick={() => openDrawer()} className="flex items-center gap-1.5 px-3 h-8 rounded-lg practmd-gradient text-white text-xs font-semibold transition-colors">
          <Plus className="w-3.5 h-3.5" />
          New Appointment
        </button>
      </div>

      {/* Provider pills (day view) */}
      {viewMode === "day" && selectedProviders.length > 0 && (
        <div className="flex items-center gap-2 px-5 py-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex-wrap">
          {selectedProviders.map(p => (
            <ProviderPill key={p.id} provider={p} selected={true}
              onToggle={() => setSelectedProviderIds(ids => ids.filter(i => i !== p.id))} />
          ))}
          {PROVIDERS.filter(p => !selectedProviderIds.includes(p.id)).map(p => (
            <ProviderPill key={p.id} provider={p} selected={false}
              onToggle={() => setSelectedProviderIds(ids => [...ids, p.id])} />
          ))}
        </div>
      )}

      {/* Visit-type legend */}
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 px-5 py-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        {VISIT_TYPES.map(v => (
          <span key={v.id} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: v.color }} />{v.label}
          </span>
        ))}
      </div>

      {/* ── Calendar body ── */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "day" && (
          <ProviderDayView
            date={currentDate}
            providers={selectedProviders.length > 0 ? selectedProviders : PROVIDERS.slice(0, 3)}
            appointments={appointments}
            showWaitlisted={showWaitlisted}
            showRequested={showRequested}
            showCancelled={showCancelled}
            onSlotClick={openDrawer}
            onApptClick={openDetailDrawer}
          />
        )}
        {viewMode === "week" && (
          <WeekView
            date={currentDate}
            selectedProviderIds={selectedProviderIds}
            appointments={appointments}
            showWaitlisted={showWaitlisted}
            showRequested={showRequested}
            showCancelled={showCancelled}
            onDayClick={d => { setCurrentDate(d); setViewMode("day"); }}
          />
        )}
        {viewMode === "month" && (
          <MonthView
            date={currentDate}
            selectedProviderIds={selectedProviderIds}
            appointments={appointments}
            showWaitlisted={showWaitlisted}
            showRequested={showRequested}
            showCancelled={showCancelled}
            onDayClick={d => { setCurrentDate(d); setViewMode("day"); }}
          />
        )}
      </div>

      {/* New Appointment Drawer */}
      <NewAppointmentDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} prefilled={prefilled} onNewAppointment={handleNewAppointment} />

      {/* Appointment Detail Drawer */}
      <AppointmentDetailDrawer
        appointment={selectedAppt}
        allAppointments={appointments}
        onClose={closeDetailDrawer}
        onUpdate={updateAppointment}
      />
    </div>
  );
}
