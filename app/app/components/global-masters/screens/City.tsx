"use client";

import { useState, useMemo } from "react";
import { Building2, Plus, Pencil, PowerOff, Trash2, Search, X } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

interface CityItem {
  id: string;
  name: string;
  state: string;
  country: string;
  displayOrder: number;
  isActive: boolean;
}

const SEED: CityItem[] = [
  { id: "1", name: "New York City", state: "NY", country: "US", displayOrder: 1, isActive: true },
  { id: "2", name: "Buffalo", state: "NY", country: "US", displayOrder: 2, isActive: true },
  { id: "3", name: "Rochester", state: "NY", country: "US", displayOrder: 3, isActive: true },
  { id: "4", name: "Penfield", state: "NY", country: "US", displayOrder: 4, isActive: true },
  { id: "5", name: "New Hartford", state: "NY", country: "US", displayOrder: 5, isActive: true },
  { id: "6", name: "Los Angeles", state: "CA", country: "US", displayOrder: 6, isActive: true },
  { id: "7", name: "San Francisco", state: "CA", country: "US", displayOrder: 7, isActive: true },
  { id: "8", name: "Chicago", state: "IL", country: "US", displayOrder: 8, isActive: true },
  { id: "9", name: "Houston", state: "TX", country: "US", displayOrder: 9, isActive: true },
  { id: "10", name: "Miami", state: "FL", country: "US", displayOrder: 10, isActive: true },
];

const STATES = ["NY", "CA", "TX", "FL", "IL", "PA", "OH", "MI", "GA", "NC", "ON", "QC"];

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

export default function CityScreen() {
  const [cities, setCities] = useState<CityItem[]>(SEED);
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CityItem | null>(null);
  const [form, setForm] = useState({ name: "", state: "NY", country: "US", displayOrder: 1, isActive: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = useMemo(() => cities.filter(c => {
    const matchQ = !query || c.name.toLowerCase().includes(query.toLowerCase());
    const matchS = !stateFilter || c.state === stateFilter;
    return matchQ && matchS;
  }), [cities, query, stateFilter]);

  function openAdd() {
    setForm({ name: "", state: "NY", country: "US", displayOrder: cities.length + 1, isActive: true });
    setEditing(null); setErrors({}); setDrawerOpen(true);
  }

  function openEdit(c: CityItem) {
    setForm({ name: c.name, state: c.state, country: c.country, displayOrder: c.displayOrder, isActive: c.isActive });
    setEditing(c); setErrors({}); setDrawerOpen(true);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "City name is required";
    if (!form.state) errs.state = "State is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (editing) {
      setCities(prev => prev.map(c => c.id === editing.id ? { ...c, ...form } : c));
    } else {
      setCities(prev => [...prev, { id: crypto.randomUUID(), ...form }]);
    }
    setDrawerOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Cities</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage city options used in patient and organization address fields.</p>
          </div>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors flex-shrink-0">
          <Plus className="w-4 h-4" /> Add City
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search cities…"
            className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {query && <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-3.5 h-3.5" /></button>}
        </div>
        <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All States</option>
          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-8">#</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">City</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-24">State</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-24">Country</th>
              <th className="text-center py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-24">Status</th>
              <th className="py-3 px-4 w-28" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-slate-400">No cities found</td></tr>}
            {filtered.map(c => (
              <tr key={c.id} onMouseEnter={() => setHoveredId(c.id)} onMouseLeave={() => setHoveredId(null)}
                className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                <td className="py-3 px-4 text-slate-400 text-xs">{c.displayOrder}</td>
                <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">{c.name}</td>
                <td className="py-3 px-4">
                  <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-semibold">{c.state}</span>
                </td>
                <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs">{c.country}</td>
                <td className="py-3 px-4 text-center"><StatusBadge active={c.isActive} /></td>
                <td className="py-3 px-4">
                  <div className={cn("flex items-center justify-end gap-1 transition-opacity", hoveredId === c.id ? "opacity-100" : "opacity-0")}>
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setCities(p => p.map(x => x.id === c.id ? { ...x, isActive: !x.isActive } : x))} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><PowerOff className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Edit City" : "Add City"} description="City details"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">Save City</button>
          </div>
        }>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">City Name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., New York City"
              className={cn("w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.name ? "border-red-400" : "border-slate-200 dark:border-slate-700")} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">State / Province <span className="text-red-500">*</span></label>
            <select value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Country</label>
            <select value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="US">United States</option>
              <option value="CA">Canada</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Display Order</label>
            <input type="number" min={1} value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: parseInt(e.target.value) || 1 }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
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
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Delete this city?</h3>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={() => { setCities(p => p.filter(c => c.id !== deleteId)); setDeleteId(null); }} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
