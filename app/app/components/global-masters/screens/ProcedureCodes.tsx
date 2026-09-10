"use client";

import { useState, useMemo } from "react";
import { Hash, Plus, Pencil, PowerOff, Trash2, Search, X } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

interface ProcedureCode {
  id: string;
  code: string;
  description: string;
  category: string;
  charge: number;
  discount: number;
  modifier: string;
  pos: string;
  taxable: boolean;
  displayOrder: number;
  isActive: boolean;
}

const CATEGORIES = [
  { value: "psychotherapy", label: "Psychotherapy" },
  { value: "evaluation", label: "Evaluation & Management" },
  { value: "assessment", label: "Assessment" },
  { value: "group", label: "Group Therapy" },
  { value: "crisis", label: "Crisis Intervention" },
  { value: "other", label: "Other" },
];

const POS_OPTIONS = [
  { value: "02", label: "02 — Telehealth" },
  { value: "10", label: "10 — Telehealth (Home)" },
  { value: "11", label: "11 — Office" },
  { value: "12", label: "12 — Home" },
  { value: "99", label: "99 — Other" },
];

const SEED: ProcedureCode[] = [
  { id: "1", code: "90791", description: "Psychiatric Diagnostic Evaluation", category: "evaluation", charge: 350, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 1, isActive: true },
  { id: "2", code: "90837", description: "Psychotherapy, 60 minutes", category: "psychotherapy", charge: 200, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 2, isActive: true },
  { id: "3", code: "90834", description: "Psychotherapy, 45 minutes", category: "psychotherapy", charge: 160, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 3, isActive: true },
  { id: "4", code: "90832", description: "Psychotherapy, 30 minutes", category: "psychotherapy", charge: 120, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 4, isActive: true },
  { id: "5", code: "99213", description: "Office Visit, Established Patient — Low Complexity", category: "evaluation", charge: 175, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 5, isActive: true },
  { id: "6", code: "90853", description: "Group Psychotherapy", category: "group", charge: 80, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 6, isActive: true },
  { id: "7", code: "90839", description: "Psychotherapy for Crisis — First 60 minutes", category: "crisis", charge: 285, discount: 0, modifier: "", pos: "02", taxable: false, displayOrder: 7, isActive: true },
  { id: "8", code: "96136", description: "Psychological or Neuropsychological Testing", category: "assessment", charge: 450, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: 8, isActive: true },
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

export default function ProcedureCodesScreen() {
  const [codes, setCodes] = useState<ProcedureCode[]>(SEED);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ProcedureCode | null>(null);
  const [form, setForm] = useState<Omit<ProcedureCode, "id">>({
    code: "", description: "", category: "psychotherapy", charge: 0, discount: 0,
    modifier: "", pos: "11", taxable: false, displayOrder: 1, isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = useMemo(() => codes.filter(c => {
    const matchQ = !query || c.code.toLowerCase().includes(query.toLowerCase()) || c.description.toLowerCase().includes(query.toLowerCase());
    const matchCat = !catFilter || c.category === catFilter;
    return matchQ && matchCat;
  }), [codes, query, catFilter]);

  function openAdd() {
    setForm({ code: "", description: "", category: "psychotherapy", charge: 0, discount: 0, modifier: "", pos: "11", taxable: false, displayOrder: codes.length + 1, isActive: true });
    setEditing(null); setErrors({}); setDrawerOpen(true);
  }

  function openEdit(c: ProcedureCode) {
    setForm({ code: c.code, description: c.description, category: c.category, charge: c.charge, discount: c.discount, modifier: c.modifier, pos: c.pos, taxable: c.taxable, displayOrder: c.displayOrder, isActive: c.isActive });
    setEditing(c); setErrors({}); setDrawerOpen(true);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.code.trim()) errs.code = "CPT code is required";
    if (!form.description.trim()) errs.description = "Description is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (editing) {
      setCodes(p => p.map(c => c.id === editing.id ? { ...c, ...form } : c));
    } else {
      setCodes(p => [...p, { id: crypto.randomUUID(), ...form }]);
    }
    setDrawerOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950/60 flex items-center justify-center flex-shrink-0">
            <Hash className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Procedure Codes</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Configure CPT codes with standard charges, modifiers, and place of service for billing.</p>
          </div>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex-shrink-0">
          <Plus className="w-4 h-4" /> Add Code
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by CPT code or description…"
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
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-28">Code</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Description</th>
              <th className="text-right py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-24">Charge</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-20">POS</th>
              <th className="text-center py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-24">Status</th>
              <th className="py-3 px-4 w-24" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-slate-400">No codes found</td></tr>}
            {filtered.map(c => (
              <tr key={c.id} onMouseEnter={() => setHoveredId(c.id)} onMouseLeave={() => setHoveredId(null)}
                className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-slate-100">{c.code}</td>
                <td className="py-3 px-4">
                  <p className="text-slate-900 dark:text-slate-100">{c.description}</p>
                  <p className="text-xs text-slate-400">{CATEGORIES.find(cat => cat.value === c.category)?.label}</p>
                </td>
                <td className="py-3 px-4 text-right font-semibold text-slate-800 dark:text-slate-200">${c.charge.toFixed(2)}</td>
                <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs">{c.pos}</td>
                <td className="py-3 px-4 text-center"><StatusBadge active={c.isActive} /></td>
                <td className="py-3 px-4">
                  <div className={cn("flex items-center justify-end gap-1 transition-opacity", hoveredId === c.id ? "opacity-100" : "opacity-0")}>
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setCodes(p => p.map(x => x.id === c.id ? { ...x, isActive: !x.isActive } : x))} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><PowerOff className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Edit Procedure Code" : "Add Procedure Code"} description="CPT code and billing details"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">Save Code</button>
          </div>
        }>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">CPT Code <span className="text-red-500">*</span></label>
              <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g., 90837"
                className={cn("w-full px-3 py-2 rounded-lg border text-sm font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                  errors.code ? "border-red-400" : "border-slate-200 dark:border-slate-700")} />
              {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Modifier</label>
              <input value={form.modifier} onChange={e => setForm(p => ({ ...p, modifier: e.target.value }))} placeholder="e.g., 95"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description <span className="text-red-500">*</span></label>
            <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Procedure description"
              className={cn("w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.description ? "border-red-400" : "border-slate-200 dark:border-slate-700")} />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Standard Charge ($)</label>
              <input type="number" min={0} step={0.01} value={form.charge} onChange={e => setForm(p => ({ ...p, charge: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Discount (%)</label>
              <input type="number" min={0} max={100} value={form.discount} onChange={e => setForm(p => ({ ...p, discount: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Place of Service (POS)</label>
            <select value={form.pos} onChange={e => setForm(p => ({ ...p, pos: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {POS_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            {[
              { key: "taxable", label: "Taxable", desc: "Apply tax to this service charge" },
              { key: "isActive", label: "Active", desc: "Available for billing selection" },
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
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Delete this procedure code?</h3>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={() => { setCodes(p => p.filter(c => c.id !== deleteId)); setDeleteId(null); }} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
