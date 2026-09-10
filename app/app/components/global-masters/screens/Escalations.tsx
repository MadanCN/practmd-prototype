"use client";

import { useState } from "react";
import { AlertTriangle, Plus, Pencil, Trash2 } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import { cn } from "@/lib/utils";

interface EscalationRule {
  id: string;
  label: string;
  value: number;
  unit: "minutes" | "hours" | "days";
  isActive: boolean;
}

const SEED: EscalationRule[] = [
  { id: "1", label: "Critical — Immediate", value: 15, unit: "minutes", isActive: true },
  { id: "2", label: "High Priority", value: 2, unit: "hours", isActive: true },
  { id: "3", label: "Medium Priority", value: 24, unit: "hours", isActive: true },
  { id: "4", label: "Low Priority", value: 3, unit: "days", isActive: true },
  { id: "5", label: "Routine Follow-up", value: 7, unit: "days", isActive: false },
];

function unitLabel(value: number, unit: string) {
  const u = value === 1 ? unit.replace(/s$/, "") : unit;
  return `${value} ${u}`;
}

const UNIT_OPTS = [
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
];

const PRIORITY_COLORS = [
  "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400",
  "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400",
  "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400",
  "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400",
  "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
];

export default function EscalationsScreen() {
  const [rules, setRules] = useState<EscalationRule[]>(SEED);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<EscalationRule | null>(null);
  const [form, setForm] = useState<{ label: string; value: number; unit: "minutes" | "hours" | "days"; isActive: boolean }>({ label: "", value: 1, unit: "hours", isActive: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  function openAdd() {
    setForm({ label: "", value: 1, unit: "hours", isActive: true });
    setEditing(null);
    setErrors({});
    setDrawerOpen(true);
  }

  function openEdit(r: EscalationRule) {
    setForm({ label: r.label, value: r.value, unit: r.unit, isActive: r.isActive });
    setEditing(r);
    setErrors({});
    setDrawerOpen(true);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.label.trim()) errs.label = "Label is required";
    if (!form.value || form.value < 1) errs.value = "Must be at least 1";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (editing) {
      setRules(prev => prev.map(r => r.id === editing.id ? { ...r, ...form } : r));
    } else {
      setRules(prev => [...prev, { id: crypto.randomUUID(), ...form }]);
    }
    setDrawerOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Escalations</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Define time thresholds for escalating unresolved tasks or alerts to higher priority.
            </p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Label</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Escalation Time</th>
              <th className="text-center py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-24">Status</th>
              <th className="py-3 px-4 w-20" />
            </tr>
          </thead>
          <tbody>
            {rules.map((r, idx) => (
              <tr
                key={r.id}
                onMouseEnter={() => setHoveredId(r.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
              >
                <td className="py-3 px-4">
                  <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", PRIORITY_COLORS[idx % PRIORITY_COLORS.length])}>
                    {r.label}
                  </span>
                </td>
                <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                  {unitLabel(r.value, r.unit)}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
                    r.isActive
                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", r.isActive ? "bg-emerald-500" : "bg-slate-400")} />
                    {r.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className={cn("flex items-center justify-end gap-1 transition-opacity", hoveredId === r.id ? "opacity-100" : "opacity-0")}>
                    <button onClick={() => openEdit(r)} title="Edit" className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteId(r.id)} title="Delete" className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Edit Escalation Rule" : "Add Escalation Rule"}
        description="Define a time threshold and label for this escalation level."
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">Save Rule</button>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Label <span className="text-red-500">*</span></label>
            <input
              value={form.label}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              placeholder="e.g., High Priority"
              className={cn("w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.label ? "border-red-400" : "border-slate-200 dark:border-slate-700")}
            />
            {errors.label && <p className="text-xs text-red-500 mt-1">{errors.label}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Time Threshold <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: parseInt(e.target.value) || 1 }))}
                className={cn("w-24 px-3 py-2 rounded-lg border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                  errors.value ? "border-red-400" : "border-slate-200 dark:border-slate-700")}
              />
              <select
                value={form.unit}
                onChange={e => setForm(f => ({ ...f, unit: e.target.value as "minutes" | "hours" | "days" }))}
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {UNIT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {errors.value && <p className="text-xs text-red-500 mt-1">{errors.value}</p>}
          </div>
          <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Active</p>
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 rounded accent-blue-600" />
          </div>
        </div>
      </Drawer>

      {deleteId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Delete this rule?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">This escalation rule will be permanently removed.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
              <button onClick={() => { setRules(p => p.filter(r => r.id !== deleteId)); setDeleteId(null); }} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
