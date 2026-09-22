"use client";

import { useState, useMemo } from "react";
import { Layers, Plus, Pencil, PowerOff, Trash2, Search, X } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  // Not in the field spec, but the spec's "on screen" line explicitly asks for
  // a category filter above the table — kept so that affordance has something
  // to filter on.
  category: string;
  displayOrder: number;
  isActive: boolean;
}

const CATEGORIES = [
  { value: "psychiatric", label: "Psychiatric" },
  { value: "therapy", label: "Therapy" },
  { value: "assessment", label: "Assessment" },
  { value: "group", label: "Group" },
  { value: "crisis", label: "Crisis" },
  { value: "other", label: "Other" },
];

const CAT_COLORS: Record<string, string> = {
  psychiatric: "bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400",
  therapy: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400",
  assessment: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400",
  group: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400",
  crisis: "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400",
  other: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
};

const SEED: Service[] = [
  { id: "1", name: "Initial Psychiatric Evaluation", category: "psychiatric", displayOrder: 1, isActive: true },
  { id: "2", name: "Medication Management", category: "psychiatric", displayOrder: 2, isActive: true },
  { id: "3", name: "Individual Therapy (60 min)", category: "therapy", displayOrder: 3, isActive: true },
  { id: "4", name: "Individual Therapy (45 min)", category: "therapy", displayOrder: 4, isActive: true },
  { id: "5", name: "Group Therapy", category: "group", displayOrder: 5, isActive: true },
  { id: "6", name: "Psychological Testing", category: "assessment", displayOrder: 6, isActive: true },
  { id: "7", name: "Crisis Intervention", category: "crisis", displayOrder: 7, isActive: true },
  { id: "8", name: "Family Therapy", category: "therapy", displayOrder: 8, isActive: true },
];

const EMPTY_FORM: Omit<Service, "id"> = { name: "", category: "therapy", displayOrder: 1, isActive: true };

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

export default function ServicesScreen() {
  const [services, setServices] = useState<Service[]>(SEED);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState<Omit<Service, "id">>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = useMemo(() => services
    .filter(s => {
      const matchQ = !query || s.name.toLowerCase().includes(query.toLowerCase());
      const matchC = !catFilter || s.category === catFilter;
      return matchQ && matchC;
    })
    .sort((a, b) => a.displayOrder - b.displayOrder), [services, query, catFilter]);

  function openAdd() {
    setForm({ ...EMPTY_FORM, displayOrder: services.length + 1 });
    setEditing(null); setErrors({}); setDrawerOpen(true);
  }

  function openEdit(s: Service) {
    setForm({ name: s.name, category: s.category, displayOrder: s.displayOrder, isActive: s.isActive });
    setEditing(s); setErrors({}); setDrawerOpen(true);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Service name is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (editing) {
      setServices(p => p.map(s => s.id === editing.id ? { ...s, ...form } : s));
    } else {
      setServices(p => [...p, { id: crypto.randomUUID(), ...form }]);
    }
    setDrawerOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center flex-shrink-0">
            <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Services</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Service definitions for all provider services — powers the Patient Portal self-scheduling display of what services providers offer.</p>
          </div>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex-shrink-0">
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search services…"
            className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {query && <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-3.5 h-3.5" /></button>}
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Service Name</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-32">Category</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-32">Order of Display</th>
              <th className="text-center py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-24">Status</th>
              <th className="py-3 px-4 w-24" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={5} className="py-12 text-center text-slate-400">No services found</td></tr>}
            {filtered.map(s => (
              <tr key={s.id} onMouseEnter={() => setHoveredId(s.id)} onMouseLeave={() => setHoveredId(null)}
                className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                <td className="py-3 px-4"><p className="font-medium text-slate-900 dark:text-slate-100">{s.name}</p></td>
                <td className="py-3 px-4">
                  <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", CAT_COLORS[s.category])}>
                    {CATEGORIES.find(c => c.value === s.category)?.label}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{s.displayOrder}</td>
                <td className="py-3 px-4 text-center"><StatusBadge active={s.isActive} /></td>
                <td className="py-3 px-4">
                  <div className={cn("flex items-center justify-end gap-1 transition-opacity", hoveredId === s.id ? "opacity-100" : "opacity-0")}>
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setServices(p => p.map(x => x.id === s.id ? { ...x, isActive: !x.isActive } : x))} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><PowerOff className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Edit Service" : "Add Service"} description="Service configuration details"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">Save Service</button>
          </div>
        }>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Service Name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Individual Therapy (60 min)"
              className={cn("w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.name ? "border-red-400" : "border-slate-200 dark:border-slate-700")} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Display Order</label>
              <input type="number" min={1} value={form.displayOrder} onChange={e => setForm(p => ({ ...p, displayOrder: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-slate-400 mt-1">Controls row sort order.</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Active</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Shown on the Patient Portal&apos;s self-scheduling service list</p>
            </div>
            <Toggle checked={form.isActive} onChange={v => setForm(p => ({ ...p, isActive: v }))} />
          </div>
        </div>
      </Drawer>

      {deleteId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border shadow-xl p-6 space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Delete this service?</h3>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={() => { setServices(p => p.filter(s => s.id !== deleteId)); setDeleteId(null); }} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
