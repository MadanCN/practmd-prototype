"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { CalendarClock, Plus, Pencil, PowerOff, Trash2, Search, X, ChevronDown, Check } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";
import { PROCEDURE_CODE_MASTER } from "@/data/procedure-codes";

interface VisitType {
  id: string;
  name: string;
  color: string;
  duration: number;
  mode: "in-person" | "telehealth" | "both";
  selfScheduling: boolean;
  /** procedure code(s) from Settings > Procedure Codes; auto-added to the Encounter when this visit type is used */
  procedureCodes: string[];
  charge: number;
  displayOrder: number;
  isActive: boolean;
}

// 10 preset swatches, per spec.
const COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444",
  "#06b6d4", "#f97316", "#84cc16", "#ec4899", "#6366f1",
];

const MODE_OPTIONS = [
  { value: "in-person", label: "In-Person" },
  { value: "telehealth", label: "Telehealth" },
  { value: "both", label: "Both" },
];

const ACTIVE_CODES = PROCEDURE_CODE_MASTER.filter((c) => c.isActive);

const SEED: VisitType[] = [
  { id: "1", name: "Initial Consultation", color: "#3b82f6", duration: 60, mode: "both", selfScheduling: true, procedureCodes: ["90791"], charge: 350, displayOrder: 1, isActive: true },
  { id: "2", name: "Follow-Up", color: "#8b5cf6", duration: 30, mode: "both", selfScheduling: true, procedureCodes: ["99213"], charge: 175, displayOrder: 2, isActive: true },
  { id: "3", name: "Therapy Session", color: "#10b981", duration: 60, mode: "both", selfScheduling: false, procedureCodes: ["90837"], charge: 200, displayOrder: 3, isActive: true },
  { id: "4", name: "Medication Check", color: "#f59e0b", duration: 20, mode: "both", selfScheduling: true, procedureCodes: ["99212"], charge: 110, displayOrder: 4, isActive: true },
  { id: "5", name: "Group Session", color: "#06b6d4", duration: 90, mode: "in-person", selfScheduling: false, procedureCodes: ["90853"], charge: 80, displayOrder: 5, isActive: true },
  { id: "6", name: "Crisis Visit", color: "#ef4444", duration: 60, mode: "both", selfScheduling: false, procedureCodes: ["90839", "90840"], charge: 285, displayOrder: 6, isActive: true },
  { id: "7", name: "Assessment", color: "#f97316", duration: 120, mode: "in-person", selfScheduling: false, procedureCodes: ["96136"], charge: 450, displayOrder: 7, isActive: true },
];

const EMPTY_FORM: Omit<VisitType, "id"> = { name: "", color: "#3b82f6", duration: 60, mode: "both", selfScheduling: false, procedureCodes: [], charge: 0, displayOrder: 1, isActive: true };

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

const currency = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Local multi-select — the app has no reusable dropdown-multiselect component (see FormPreferences.tsx for the closest precedent, a plain checkbox list). */
function ProcedureCodeMultiSelect({ value, onChange }: { value: string[]; onChange: (codes: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const options = useMemo(() => {
    const query = q.trim().toLowerCase();
    return ACTIVE_CODES.filter((c) => !query || c.code.toLowerCase().includes(query) || c.description.toLowerCase().includes(query));
  }, [q]);

  function toggle(code: string) {
    onChange(value.includes(code) ? value.filter((c) => c !== code) : [...value, code]);
  }

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-left flex items-center flex-wrap gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
        {value.length === 0 && <span className="text-slate-400">Select procedure code(s)…</span>}
        {value.map((code) => (
          <span key={code} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 text-xs font-mono">
            {code}
            <span role="button" tabIndex={-1} onClick={(e) => { e.stopPropagation(); toggle(code); }} className="hover:text-blue-900 dark:hover:text-blue-200"><X className="w-3 h-3" /></span>
          </span>
        ))}
        <ChevronDown className="w-4 h-4 text-slate-400 ml-auto" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search code or description…"
              className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {options.length === 0 && <p className="px-3 py-4 text-xs text-center text-slate-400">No matching codes</p>}
            {options.map((c) => (
              <button type="button" key={c.code} onClick={() => toggle(c.code)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60">
                <span className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0",
                  value.includes(c.code) ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 dark:border-slate-600")}>
                  {value.includes(c.code) && <Check className="w-3 h-3" />}
                </span>
                <span className="min-w-0">
                  <span className="block font-mono text-xs text-slate-800 dark:text-slate-200">{c.code}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">{c.description}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VisitTypesScreen() {
  const [types, setTypes] = useState<VisitType[]>(SEED);
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<VisitType | null>(null);
  const [form, setForm] = useState<Omit<VisitType, "id">>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = useMemo(() => !query ? types : types.filter(t =>
    t.name.toLowerCase().includes(query.toLowerCase()) || t.procedureCodes.some((c) => c.includes(query))
  ), [types, query]);

  function openAdd() {
    setForm({ ...EMPTY_FORM, displayOrder: types.length + 1 });
    setEditing(null); setErrors({}); setDrawerOpen(true);
  }

  function openEdit(t: VisitType) {
    setForm({ name: t.name, color: t.color, duration: t.duration, mode: t.mode, selfScheduling: t.selfScheduling, procedureCodes: t.procedureCodes, charge: t.charge, displayOrder: t.displayOrder, isActive: t.isActive });
    setEditing(t); setErrors({}); setDrawerOpen(true);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Visit type name is required";
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
            <p className="text-sm text-slate-500 dark:text-slate-400">Calendar-facing, billable visit type definitions. Status here blocks patient booking — this is the highest-priority master.</p>
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

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Visit Type</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-24">Duration</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-28">Mode</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-32">Self-Scheduling</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-40">Procedure Code</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-24">Charge</th>
              <th className="text-center py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-24">Status</th>
              <th className="py-3 px-4 w-24" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-slate-400">No visit types found</td></tr>}
            {filtered.map(t => (
              <tr key={t.id} onMouseEnter={() => setHoveredId(t.id)} onMouseLeave={() => setHoveredId(null)}
                className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                    <p className="font-medium text-slate-900 dark:text-slate-100">{t.name}</p>
                  </div>
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{t.duration} min</td>
                <td className="py-3 px-4">
                  <span className="text-xs text-slate-600 dark:text-slate-400">{MODE_OPTIONS.find(m => m.value === t.mode)?.label}</span>
                </td>
                <td className="py-3 px-4">
                  {t.selfScheduling
                    ? <span className="text-xs bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded">Eligible</span>
                    : <span className="text-xs text-slate-400">—</span>}
                </td>
                <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400 text-xs">
                  {t.procedureCodes.length ? t.procedureCodes.join(", ") : "—"}
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{currency(t.charge)}</td>
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Visit Type <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Initial Consultation"
              className={cn("w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.name ? "border-red-400" : "border-slate-200 dark:border-slate-700")} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Colour</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
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
              <p className="text-xs text-slate-400 mt-1">Drives calendar slot length.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Delivery Mode</label>
              <select value={form.mode} onChange={e => setForm(p => ({ ...p, mode: e.target.value as VisitType["mode"] }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {MODE_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Procedure Code</label>
            <ProcedureCodeMultiSelect value={form.procedureCodes} onChange={(codes) => setForm(p => ({ ...p, procedureCodes: codes }))} />
            <p className="text-xs text-slate-400 mt-1">Sourced from Settings &gt; Procedure Codes. Selected code(s) are auto-added to the Encounter.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Charge ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input type="number" min={0} step="0.01" value={form.charge} onChange={e => setForm(p => ({ ...p, charge: parseFloat(e.target.value) || 0 }))}
                  className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Display Order</label>
              <input type="number" min={1} value={form.displayOrder} onChange={e => setForm(p => ({ ...p, displayOrder: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="space-y-2">
            {[
              { key: "selfScheduling", label: "Self-Scheduling Eligible", desc: "Governs patient-facing booking eligibility" },
              { key: "isActive", label: "Active", desc: "Inactive blocks patient booking" },
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
