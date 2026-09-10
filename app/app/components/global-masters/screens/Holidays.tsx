"use client";

import { useState, useMemo } from "react";
import { CalendarX, Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

interface RecurringConfig {
  startDate?: string;
  endDate?: string;
  noEndDate?: boolean;
  // Weekly
  repeatOnDays?: string[];
  // Monthly
  monthlyType?: "dayOfMonth" | "dayOfWeek";
  dayOfMonth?: number;
  ordinal?: "1st" | "2nd" | "3rd" | "4th" | "last";
  weekday?: string;
  // Annually
  annuallyType?: "specificDate" | "dayOfWeek";
  month?: number;
  day?: number;
}

interface Holiday {
  id: string;
  name: string;
  date: string;
  recurringType: "none" | "daily" | "weekly" | "monthly" | "annually";
  recurringConfig: RecurringConfig;
  isActive: boolean;
}

const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const WEEKDAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ORDINALS = ["1st", "2nd", "3rd", "4th", "last"] as const;
const RECURRENCE_TYPES = ["none", "daily", "weekly", "monthly", "annually"] as const;

const SEED: Holiday[] = [
  {
    id: "1", name: "New Year's Day", date: "2025-01-01",
    recurringType: "annually",
    recurringConfig: { annuallyType: "specificDate", month: 1, day: 1, startDate: "2025-01-01" },
    isActive: true,
  },
  {
    id: "2", name: "Martin Luther King Jr. Day", date: "2025-01-20",
    recurringType: "annually",
    recurringConfig: { annuallyType: "dayOfWeek", ordinal: "3rd", weekday: "Monday", month: 1, startDate: "2025-01-20" },
    isActive: true,
  },
  {
    id: "3", name: "Memorial Day", date: "2025-05-26",
    recurringType: "annually",
    recurringConfig: { annuallyType: "dayOfWeek", ordinal: "last", weekday: "Monday", month: 5, startDate: "2025-05-26" },
    isActive: true,
  },
  {
    id: "4", name: "Independence Day", date: "2025-07-04",
    recurringType: "annually",
    recurringConfig: { annuallyType: "specificDate", month: 7, day: 4, startDate: "2025-07-04" },
    isActive: true,
  },
  {
    id: "5", name: "Labor Day", date: "2025-09-01",
    recurringType: "annually",
    recurringConfig: { annuallyType: "dayOfWeek", ordinal: "1st", weekday: "Monday", month: 9, startDate: "2025-09-01" },
    isActive: true,
  },
  {
    id: "6", name: "Thanksgiving Day", date: "2025-11-27",
    recurringType: "annually",
    recurringConfig: { annuallyType: "dayOfWeek", ordinal: "4th", weekday: "Thursday", month: 11, startDate: "2025-11-27" },
    isActive: true,
  },
  {
    id: "7", name: "Day After Thanksgiving", date: "2025-11-28",
    recurringType: "annually",
    recurringConfig: { annuallyType: "dayOfWeek", ordinal: "4th", weekday: "Friday", month: 11, startDate: "2025-11-28" },
    isActive: false,
  },
  {
    id: "8", name: "Christmas Eve", date: "2025-12-24",
    recurringType: "annually",
    recurringConfig: { annuallyType: "specificDate", month: 12, day: 24, startDate: "2025-12-24" },
    isActive: true,
  },
  {
    id: "9", name: "Christmas Day", date: "2025-12-25",
    recurringType: "annually",
    recurringConfig: { annuallyType: "specificDate", month: 12, day: 25, startDate: "2025-12-25" },
    isActive: true,
  },
  {
    id: "10", name: "New Year's Eve", date: "2025-12-31",
    recurringType: "annually",
    recurringConfig: { annuallyType: "specificDate", month: 12, day: 31, startDate: "2025-12-31" },
    isActive: true,
  },
  {
    id: "11", name: "Staff Training Day", date: "2025-03-15",
    recurringType: "none",
    recurringConfig: {},
    isActive: true,
  },
];

function formatDate(d: string) {
  if (!d) return "—";
  const [, m, day] = d.split("-");
  return `${MONTHS_SHORT[parseInt(m) - 1]} ${parseInt(day)}`;
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
      active ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
             : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400")}>
      <span className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-emerald-500" : "bg-slate-400")} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function RecurrenceBadge({ type }: { type: Holiday["recurringType"] }) {
  if (type === "none") return null;
  const styles: Record<string, string> = {
    daily: "text-violet-600 dark:text-violet-400",
    weekly: "text-blue-600 dark:text-blue-400",
    monthly: "text-cyan-600 dark:text-cyan-400",
    annually: "text-indigo-600 dark:text-indigo-400",
  };
  const labels: Record<string, string> = {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    annually: "Annually",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", styles[type])}>
      <RefreshCw className="w-3 h-3" /> {labels[type]}
    </span>
  );
}

const emptyForm = (): Omit<Holiday, "id"> => ({
  name: "",
  date: "",
  recurringType: "none",
  recurringConfig: {},
  isActive: true,
});

export default function HolidaysScreen() {
  const [holidays, setHolidays] = useState<Holiday[]>(SEED);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [form, setForm] = useState<Omit<Holiday, "id">>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const sorted = useMemo(() => [...holidays].sort((a, b) => a.date.localeCompare(b.date)), [holidays]);

  function openAdd() {
    setForm(emptyForm());
    setEditing(null); setErrors({}); setDrawerOpen(true);
  }

  function openEdit(h: Holiday) {
    setForm({ name: h.name, date: h.date, recurringType: h.recurringType, recurringConfig: { ...h.recurringConfig }, isActive: h.isActive });
    setEditing(h); setErrors({}); setDrawerOpen(true);
  }

  function setConfig(patch: Partial<RecurringConfig>) {
    setForm(f => ({ ...f, recurringConfig: { ...f.recurringConfig, ...patch } }));
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Holiday name is required";
    if (form.recurringType === "none" && !form.date) errs.date = "Date is required";
    if (form.recurringType === "daily") {
      if (!form.recurringConfig.startDate) errs.startDate = "Start date is required";
      if (!form.recurringConfig.endDate) errs.endDate = "End date is required";
    }
    if (form.recurringType === "weekly") {
      if (!form.recurringConfig.startDate) errs.startDate = "Start date is required";
      if (!form.recurringConfig.noEndDate && !form.recurringConfig.endDate) errs.endDate = "End date is required";
      if (!form.recurringConfig.repeatOnDays?.length) errs.repeatOnDays = "Select at least one day";
    }
    if (form.recurringType === "monthly") {
      if (!form.recurringConfig.startDate) errs.startDate = "Start date is required";
      if (!form.recurringConfig.endDate) errs.endDate = "End date is required";
    }
    if (form.recurringType === "annually") {
      if (!form.recurringConfig.startDate) errs.startDate = "Start date is required";
      if (!form.recurringConfig.endDate) errs.endDate = "End date is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    // Set date from startDate for recurring types
    const date = form.recurringType !== "none" ? (form.recurringConfig.startDate ?? form.date) : form.date;
    const saved = { ...form, date };
    if (editing) {
      setHolidays(p => p.map(h => h.id === editing.id ? { ...h, ...saved } : h));
    } else {
      setHolidays(p => [...p, { id: crypto.randomUUID(), ...saved }]);
    }
    setDrawerOpen(false);
  }

  const activeCount = holidays.filter(h => h.isActive).length;
  const recurringCount = holidays.filter(h => h.recurringType !== "none").length;

  const inputCls = (err?: string) => cn(
    "w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
    err ? "border-red-400" : "border-slate-200 dark:border-slate-700"
  );
  const selectCls = "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center flex-shrink-0">
            <CalendarX className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Holidays</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Define organization holidays. Appointment scheduling will block these dates.
            </p>
          </div>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors flex-shrink-0">
          <Plus className="w-4 h-4" /> Add Holiday
        </button>
      </div>

      <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
        <span>{holidays.length} total</span>
        <span className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
        <span className="text-emerald-600 dark:text-emerald-400">{activeCount} active</span>
        <span className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
        <span>{recurringCount} recurring</span>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Holiday</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-32">Date</th>
              <th className="text-center py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-32">Recurrence</th>
              <th className="text-center py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-24">Status</th>
              <th className="py-3 px-4 w-24" />
            </tr>
          </thead>
          <tbody>
            {sorted.map(h => (
              <tr key={h.id} onMouseEnter={() => setHoveredId(h.id)} onMouseLeave={() => setHoveredId(null)}
                className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">{h.name}</td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{formatDate(h.date)}</td>
                <td className="py-3 px-4 text-center"><RecurrenceBadge type={h.recurringType} /></td>
                <td className="py-3 px-4 text-center"><StatusBadge active={h.isActive} /></td>
                <td className="py-3 px-4">
                  <div className={cn("flex items-center justify-end gap-1 transition-opacity", hoveredId === h.id ? "opacity-100" : "opacity-0")}>
                    <button onClick={() => openEdit(h)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteId(h.id)} className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Edit Holiday" : "Add Holiday"} description="Holiday date and recurrence settings"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">Save Holiday</button>
          </div>
        }>
        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Holiday Name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Christmas Day"
              className={inputCls(errors.name)} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Recurrence type selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Recurrence</label>
            <div className="flex gap-1.5 flex-wrap">
              {RECURRENCE_TYPES.map(rt => (
                <button key={rt} type="button"
                  onClick={() => setForm(f => ({ ...f, recurringType: rt, recurringConfig: {} }))}
                  className={cn(
                    "px-3 py-1.5 rounded-full border text-xs font-medium transition-colors capitalize",
                    form.recurringType === rt
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400"
                  )}>
                  {rt === "none" ? "None" : rt.charAt(0).toUpperCase() + rt.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* None: just date */}
          {form.recurringType === "none" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Date <span className="text-red-500">*</span></label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className={inputCls(errors.date)} />
              {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
            </div>
          )}

          {/* Daily */}
          {form.recurringType === "daily" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Start Date <span className="text-red-500">*</span></label>
                  <input type="date" value={form.recurringConfig.startDate ?? ""} onChange={e => setConfig({ startDate: e.target.value })}
                    className={inputCls(errors.startDate)} />
                  {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">End Date <span className="text-red-500">*</span></label>
                  <input type="date" value={form.recurringConfig.endDate ?? ""} onChange={e => setConfig({ endDate: e.target.value })}
                    className={inputCls(errors.endDate)} />
                  {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Weekly */}
          {form.recurringType === "weekly" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Repeat On <span className="text-red-500">*</span></label>
                <div className="flex gap-1.5 flex-wrap">
                  {WEEKDAYS.map((day, i) => {
                    const selected = form.recurringConfig.repeatOnDays?.includes(day) ?? false;
                    return (
                      <button key={day} type="button"
                        onClick={() => {
                          const days = form.recurringConfig.repeatOnDays ?? [];
                          setConfig({ repeatOnDays: selected ? days.filter(d => d !== day) : [...days, day] });
                        }}
                        className={cn(
                          "w-10 h-10 rounded-lg border text-xs font-medium transition-colors",
                          selected ? "bg-blue-600 border-blue-600 text-white" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400"
                        )}>
                        {WEEKDAYS_SHORT[i]}
                      </button>
                    );
                  })}
                </div>
                {errors.repeatOnDays && <p className="text-xs text-red-500 mt-1">{errors.repeatOnDays}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Start Date <span className="text-red-500">*</span></label>
                  <input type="date" value={form.recurringConfig.startDate ?? ""} onChange={e => setConfig({ startDate: e.target.value })}
                    className={inputCls(errors.startDate)} />
                  {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">End Date</label>
                  <input type="date" value={form.recurringConfig.endDate ?? ""} onChange={e => setConfig({ endDate: e.target.value })}
                    disabled={form.recurringConfig.noEndDate}
                    className={cn(inputCls(errors.endDate), form.recurringConfig.noEndDate && "opacity-40 cursor-not-allowed")} />
                  {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.recurringConfig.noEndDate ?? false}
                  onChange={e => setConfig({ noEndDate: e.target.checked, endDate: e.target.checked ? undefined : form.recurringConfig.endDate })}
                  className="w-4 h-4 rounded accent-blue-600" />
                <span className="text-sm text-slate-700 dark:text-slate-300">No end date</span>
              </label>
            </div>
          )}

          {/* Monthly */}
          {form.recurringType === "monthly" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="monthlyType" checked={(form.recurringConfig.monthlyType ?? "dayOfMonth") === "dayOfMonth"}
                    onChange={() => setConfig({ monthlyType: "dayOfMonth" })}
                    className="accent-blue-600" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">On day</span>
                  <input type="number" min={1} max={31} value={form.recurringConfig.dayOfMonth ?? 1}
                    onChange={e => setConfig({ dayOfMonth: parseInt(e.target.value) || 1 })}
                    className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <span className="text-sm text-slate-500">of the month</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer flex-wrap">
                  <input type="radio" name="monthlyType" checked={form.recurringConfig.monthlyType === "dayOfWeek"}
                    onChange={() => setConfig({ monthlyType: "dayOfWeek" })}
                    className="accent-blue-600" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">On the</span>
                  <select value={form.recurringConfig.ordinal ?? "1st"} onChange={e => setConfig({ ordinal: e.target.value as RecurringConfig["ordinal"] })}
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {ORDINALS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <select value={form.recurringConfig.weekday ?? "Monday"} onChange={e => setConfig({ weekday: e.target.value })}
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {WEEKDAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Start Date <span className="text-red-500">*</span></label>
                  <input type="date" value={form.recurringConfig.startDate ?? ""} onChange={e => setConfig({ startDate: e.target.value })}
                    className={inputCls(errors.startDate)} />
                  {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">End Date <span className="text-red-500">*</span></label>
                  <input type="date" value={form.recurringConfig.endDate ?? ""} onChange={e => setConfig({ endDate: e.target.value })}
                    className={inputCls(errors.endDate)} />
                  {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Annually */}
          {form.recurringType === "annually" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer flex-wrap">
                  <input type="radio" name="annuallyType" checked={(form.recurringConfig.annuallyType ?? "specificDate") === "specificDate"}
                    onChange={() => setConfig({ annuallyType: "specificDate" })}
                    className="accent-blue-600" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">On</span>
                  <select value={form.recurringConfig.month ?? 1} onChange={e => setConfig({ month: parseInt(e.target.value) })}
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {MONTHS_FULL.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                  <input type="number" min={1} max={31} value={form.recurringConfig.day ?? 1}
                    onChange={e => setConfig({ day: parseInt(e.target.value) || 1 })}
                    className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </label>
                <label className="flex items-center gap-2 cursor-pointer flex-wrap">
                  <input type="radio" name="annuallyType" checked={form.recurringConfig.annuallyType === "dayOfWeek"}
                    onChange={() => setConfig({ annuallyType: "dayOfWeek" })}
                    className="accent-blue-600" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">On the</span>
                  <select value={form.recurringConfig.ordinal ?? "1st"} onChange={e => setConfig({ ordinal: e.target.value as RecurringConfig["ordinal"] })}
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {ORDINALS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <select value={form.recurringConfig.weekday ?? "Monday"} onChange={e => setConfig({ weekday: e.target.value })}
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {WEEKDAYS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <span className="text-sm text-slate-700 dark:text-slate-300">of</span>
                  <select value={form.recurringConfig.month ?? 1} onChange={e => setConfig({ month: parseInt(e.target.value) })}
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {MONTHS_FULL.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Start Date <span className="text-red-500">*</span></label>
                  <input type="date" value={form.recurringConfig.startDate ?? ""} onChange={e => setConfig({ startDate: e.target.value })}
                    className={inputCls(errors.startDate)} />
                  {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">End Date <span className="text-red-500">*</span></label>
                  <input type="date" value={form.recurringConfig.endDate ?? ""} onChange={e => setConfig({ endDate: e.target.value })}
                    className={inputCls(errors.endDate)} />
                  {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Active toggle */}
          <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Active</p>
            <Toggle checked={form.isActive} onChange={v => setForm(f => ({ ...f, isActive: v }))} />
          </div>
        </div>
      </Drawer>

      {deleteId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border shadow-xl p-6 space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Delete this holiday?</h3>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={() => { setHolidays(p => p.filter(h => h.id !== deleteId)); setDeleteId(null); }} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
