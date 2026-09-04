"use client";

import { useState, useMemo } from "react";
import { CalendarClock, Plus, Pencil, PowerOff, Trash2, Search, X } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

interface VisitType {
  id: string;
  name: string;
  color: string;
  duration: number;
  buffer: number;
  mode: "in-person" | "telehealth" | "both";
  selfScheduling: boolean;
  cptCode: string;
  displayOrder: number;
  isActive: boolean;
}

const COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444",
  "#06b6d4", "#f97316", "#84cc16", "#ec4899", "#6366f1",
];

const MODE_OPTIONS = [
  { value: "in-person", label: "In-Person" },
  { value: "telehealth", label: "Telehealth" },
  { value: "both", label: "Both" },
];

const SEED: VisitType[] = [
  { id: "1", name: "Initial Consultation", color: "#3b82f6", duration: 60, buffer: 15, mode: "both", selfScheduling: true, cptCode: "90791", displayOrder: 1, isActive: true },
  { id: "2", name: "Follow-Up", color: "#8b5cf6", duration: 30, buffer: 10, mode: "both", selfScheduling: true, cptCode: "99213", displayOrder: 2, isActive: true },
  { id: "3", name: "Therapy Session", color: "#10b981", duration: 60, buffer: 10, mode: "both", selfScheduling: false, cptCode: "90837", displayOrder: 3, isActive: true },
  { id: "4", name: "Medication Check", color: "#f59e0b", duration: 20, buffer: 5, mode: "both", selfScheduling: true, cptCode: "99212", displayOrder: 4, isActive: true },
  { id: "5", name: "Group Session", color: "#06b6d4", duration: 90, buffer: 10, mode: "in-person", selfScheduling: false, cptCode: "90853", displayOrder: 5, isActive: true },
  { id: "6", name: "Crisis Visit", color: "#ef4444", duration: 60, buffer: 0, mode: "both", selfScheduling: false, cptCode: "90839", displayOrder: 6, isActive: true },
  { id: "7", name: "Assessment", color: "#f97316", duration: 120, buffer: 15, mode: "in-person", selfScheduling: false, cptCode: "96136", displayOrder: 7, isActive: true },
];

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

export default function VisitTypesScreen() {
  const [types, setTypes] = useState<VisitType[]>(SEED);
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<VisitType | null>(null);
  const [form, setForm] = useState<Omit<VisitType, "id">>({ name: "", color: "#3b82f6", duration: 60, buffer: 10, mode: "both", selfScheduling: false, cptCode: "", displayOrder: 1, isActive: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = useMemo(() => !query ? types : types.filter(t =>
    t.name.toLowerCase().includes(query.toLowerCase()) || t.cptCode.includes(query)
  ), [types, query]);

  function openAdd() {
    setForm({ name: "", color: "#3b82f6", duration: 60, buffer: 10, mode: "both", selfScheduling: false, cptCode: "", displayOrder: types.length + 1, isActive: true });
    setEditing(null); setErrors({}); setDrawerOpen(true);
  }

  function openEdit(t: VisitType) {
    setForm({ name: t.name, color: t.color, duration: t.duration, buffer: t.buffer, mode: t.mode, selfScheduling: t.selfScheduling, cptCode: t.cptCode, displayOrder: t.displayOrder, isActive: t.isActive });
    setEditing(t); setErrors({}); setDrawerOpen(true);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.duration || form.duration < 1) errs.duration = "Duration must be ≥ 1 min";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (editing) {
      setTypes(p => p.map(t => t.id === editing.id ? { ...t, ...form } : t));
    } else {
      setTypes(p => [...p, { id: crypto.randomUUID(), ...form }]);
    }
    setDrawerOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center flex-shrink-0">
            <CalendarClock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Visit Types</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Configure appointment visit types with duration, buffer, mode, and calendar color.</p>
          </div>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex-shrink-0">
          <Plus className="w-4 h-4" /> Add Visit Type
        </button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search visit types…"
          className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {query && <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-3.5 h-3.5" /></button>}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Visit Type</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-28">Duration</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-28">Mode</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-28">CPT Code</th>
              <th className="text-center py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-24">Status</th>
              <th className="py-3 px-4 w-24" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-slate-400">No visit types found</td></tr>}
            {filtered.map(t => (
              <tr key={t.id} onMouseEnter={() => setHoveredId(t.id)} onMouseLeave={() => setHoveredId(null)}
                className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{t.name}</p>
                      <div className="flex gap-1.5 mt-0.5">
                        {t.selfScheduling && <span className="text-xs bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded">Self-Schedule</span>}
                        {t.buffer > 0 && <span className="text-xs text-slate-400">{t.buffer}m buffer</span>}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{t.duration} min</td>
                <td className="py-3 px-4">
                  <span className="text-xs text-slate-600 dark:text-slate-400">{MODE_OPTIONS.find(m => m.value === t.mode)?.label}</span>
                </td>
                <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 text-xs">{t.cptCode || "—"}</td>
                <td className="py-3 px-4 text-center"><StatusBadge active={t.isActive} /></td>
                <td className="py-3 px-4">
                  <div className={cn("flex items-center justify-end gap-1 transition-opacity", hoveredId === t.id ? "opacity-100" : "opacity-0")}>
                    <button onClick={() => openEdit(t)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setTypes(p => p.map(x => x.id === t.id ? { ...x, isActive: !x.isActive } : x))} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><PowerOff className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteId(t.id)} className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Edit Visit Type" : "Add Visit Type"} description="Configure visit type details and scheduling settings"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">Save Visit Type</button>
          </div>
        }>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Initial Consultation"
              className={cn("w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.name ? "border-red-400" : "border-slate-200 dark:border-slate-700")} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Calendar Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                  className={cn("w-8 h-8 rounded-full border-2 transition-transform", form.color === c ? "border-slate-700 dark:border-slate-200 scale-110" : "border-transparent")}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Duration (min) <span className="text-red-500">*</span></label>
              <input type="number" min={1} value={form.duration} onChange={e => setForm(p => ({ ...p, duration: parseInt(e.target.value) || 1 }))}
                className={cn("w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                  errors.duration ? "border-red-400" : "border-slate-200 dark:border-slate-700")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Buffer (min)</label>
              <input type="number" min={0} value={form.buffer} onChange={e => setForm(p => ({ ...p, buffer: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Mode</label>
            <div className="flex gap-2">
              {(["in-person", "telehealth", "both"] as const).map(m => (
                <button key={m} type="button"
                  onClick={() => setForm(p => ({ ...p, mode: m }))}
                  className={cn(
                    "flex-1 py-2 rounded-lg border text-sm font-medium transition-colors",
                    form.mode === m
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-blue-400"
                  )}>
                  {m === "in-person" ? "In-Person" : m === "telehealth" ? "Telehealth" : "Both"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">CPT Code</label>
            <input value={form.cptCode} onChange={e => setForm(p => ({ ...p, cptCode: e.target.value }))} placeholder="e.g., 90837"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="space-y-2">
            {[
              { key: "selfScheduling", label: "Self-Scheduling Enabled", desc: "Patients can book this type online" },
              { key: "isActive", label: "Active", desc: "Available in scheduling dropdowns" },
            ].map(opt => (
              <div key={opt.key} className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{opt.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{opt.desc}</p>
                </div>
                <Toggle checked={Boolean(form[opt.key as keyof typeof form])} onChange={v => setForm(p => ({ ...p, [opt.key]: v }))} />
              </div>
            ))}
          </div>
        </div>
      </Drawer>

      {deleteId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border shadow-xl p-6 space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Delete this visit type?</h3>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={() => { setTypes(p => p.filter(t => t.id !== deleteId)); setDeleteId(null); }} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
