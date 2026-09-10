"use client";

import { useState, useMemo } from "react";
import { BookOpen, Plus, Pencil, ChevronRight, Trash2, Search, X } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

interface Specialization {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  displayOrder: number;
  isActive: boolean;
}

const SEED: Specialization[] = [
  { id: "1", name: "Mental Health", code: "MH", parentId: null, displayOrder: 1, isActive: true },
  { id: "2", name: "Psychiatry", code: "PSY", parentId: "1", displayOrder: 1, isActive: true },
  { id: "3", name: "Child & Adolescent Psychiatry", code: "CAP", parentId: "2", displayOrder: 1, isActive: true },
  { id: "4", name: "Geriatric Psychiatry", code: "GP", parentId: "2", displayOrder: 2, isActive: true },
  { id: "5", name: "Forensic Psychiatry", code: "FP", parentId: "2", displayOrder: 3, isActive: false },
  { id: "6", name: "Clinical Psychology", code: "CP", parentId: "1", displayOrder: 2, isActive: true },
  { id: "7", name: "Neuropsychology", code: "NP", parentId: "6", displayOrder: 1, isActive: true },
  { id: "8", name: "Behavioral Psychology", code: "BP", parentId: "6", displayOrder: 2, isActive: true },
  { id: "9", name: "Counseling & Therapy", code: "CT", parentId: "1", displayOrder: 3, isActive: true },
  { id: "10", name: "Cognitive Behavioral Therapy", code: "CBT", parentId: "9", displayOrder: 1, isActive: true },
  { id: "11", name: "Dialectical Behavior Therapy", code: "DBT", parentId: "9", displayOrder: 2, isActive: true },
  { id: "12", name: "Family Therapy", code: "FT", parentId: "9", displayOrder: 3, isActive: true },
  { id: "13", name: "Substance Use", code: "SU", parentId: null, displayOrder: 2, isActive: true },
  { id: "14", name: "Addiction Psychiatry", code: "AP", parentId: "13", displayOrder: 1, isActive: true },
  { id: "15", name: "Chemical Dependency Counseling", code: "CDC", parentId: "13", displayOrder: 2, isActive: true },
];

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
      active ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
             : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400")}>
      <span className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-emerald-500" : "bg-slate-400")} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function SpecRow({ spec, depth, all, onEdit, onDelete }: {
  spec: Specialization;
  depth: number;
  all: Specialization[];
  onEdit: (s: Specialization) => void;
  onDelete: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const children = all.filter(s => s.parentId === spec.id);

  return (
    <>
      <tr onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
        <td className="py-2.5 px-4">
          <div className="flex items-center gap-1" style={{ paddingLeft: `${depth * 20}px` }}>
            {depth > 0 && <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 flex-shrink-0" />}
            <span className={cn("font-medium", depth === 0 ? "text-slate-900 dark:text-slate-100 text-sm" : "text-slate-700 dark:text-slate-300 text-sm")}>{spec.name}</span>
          </div>
        </td>
        <td className="py-2.5 px-4">
          <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-semibold">{spec.code}</span>
        </td>
        <td className="py-2.5 px-4 text-xs text-slate-400">{spec.displayOrder}</td>
        <td className="py-2.5 px-4 text-center"><StatusBadge active={spec.isActive} /></td>
        <td className="py-2.5 px-4">
          <div className={cn("flex items-center justify-end gap-1 transition-opacity", hovered ? "opacity-100" : "opacity-0")}>
            <button onClick={() => onEdit(spec)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={() => onDelete(spec.id)} className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </td>
      </tr>
      {children.map(c => <SpecRow key={c.id} spec={c} depth={depth + 1} all={all} onEdit={onEdit} onDelete={onDelete} />)}
    </>
  );
}

export default function SpecializationsScreen() {
  const [specs, setSpecs] = useState<Specialization[]>(SEED);
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Specialization | null>(null);
  const [form, setForm] = useState({ name: "", code: "", parentId: null as string | null, displayOrder: 1, isActive: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const parentOptions = specs.filter(s => s.parentId === null);

  const displaySpecs = useMemo(() => {
    if (!query) return specs;
    const q = query.toLowerCase();
    return specs.filter(s => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
  }, [specs, query]);

  const rootSpecs = displaySpecs.filter(s => s.parentId === null);

  function openAdd() {
    setForm({ name: "", code: "", parentId: null, displayOrder: 1, isActive: true });
    setEditing(null); setErrors({}); setDrawerOpen(true);
  }

  function openEdit(s: Specialization) {
    setForm({ name: s.name, code: s.code, parentId: s.parentId, displayOrder: s.displayOrder, isActive: s.isActive });
    setEditing(s); setErrors({}); setDrawerOpen(true);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.code.trim()) errs.code = "Code is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (editing) {
      setSpecs(p => p.map(s => s.id === editing.id ? { ...s, ...form } : s));
    } else {
      setSpecs(p => [...p, { id: crypto.randomUUID(), ...form }]);
    }
    setDrawerOpen(false);
  }

  function handleDelete(id: string) {
    setSpecs(p => p.filter(s => s.id !== id && s.parentId !== id));
    setDeleteId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Specializations</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage the clinical specialization taxonomy with parent-child hierarchy.</p>
          </div>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex-shrink-0">
          <Plus className="w-4 h-4" /> Add Specialization
        </button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search specializations…"
          className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {query && <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-3.5 h-3.5" /></button>}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Name</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-24">Code</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-16">Order</th>
              <th className="text-center py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-24">Status</th>
              <th className="py-3 px-4 w-24" />
            </tr>
          </thead>
          <tbody>
            {query
              ? displaySpecs.map(s => <SpecRow key={s.id} spec={s} depth={0} all={displaySpecs} onEdit={openEdit} onDelete={setDeleteId} />)
              : rootSpecs.map(s => <SpecRow key={s.id} spec={s} depth={0} all={specs} onEdit={openEdit} onDelete={setDeleteId} />)
            }
          </tbody>
        </table>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Edit Specialization" : "Add Specialization"} description="Specialization details and taxonomy placement"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">Save</button>
          </div>
        }>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Name <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Specialization name"
              className={cn("w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.name ? "border-red-400" : "border-slate-200 dark:border-slate-700")} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Code <span className="text-red-500">*</span></label>
            <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().slice(0, 6) }))} placeholder="e.g., CBT"
              className={cn("w-full px-3 py-2 rounded-lg border text-sm font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.code ? "border-red-400" : "border-slate-200 dark:border-slate-700")} />
            {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Parent Category</label>
            <select value={form.parentId ?? ""} onChange={e => setForm(f => ({ ...f, parentId: e.target.value || null }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Top Level —</option>
              {parentOptions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Delete specialization?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Child specializations under this entry will also be removed.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
