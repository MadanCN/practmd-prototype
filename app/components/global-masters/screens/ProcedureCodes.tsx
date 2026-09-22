"use client";

import { useState, useMemo, useRef } from "react";
import { Hash, Plus, Pencil, PowerOff, Trash2, Search, X } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";
import {
  PROCEDURE_CODE_MASTER, PROCEDURE_CODE_CATEGORIES, PROCEDURE_CODE_POS_OPTIONS,
  type ProcedureCode,
} from "@/data/procedure-codes";

const POS_OPTIONS = PROCEDURE_CODE_POS_OPTIONS;
const SEED: ProcedureCode[] = PROCEDURE_CODE_MASTER;
const NEW_CATEGORY = "__new__";

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

/** Four 2-character alphanumeric boxes; box N only accepts input once box N-1 is filled. Value is stored as a single concatenated string (e.g. "95GT"). */
function ModifierBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const segs = [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6), value.slice(6, 8)];
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  function setSeg(i: number, raw: string) {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 2);
    const next = [...segs];
    next[i] = clean;
    // A box can only be filled once every box before it is filled, so clearing
    // box i must also clear everything after it to keep the value contiguous.
    if (clean.length < 2) {
      for (let j = i + 1; j < next.length; j++) next[j] = "";
    }
    onChange(next.join(""));
    if (clean.length === 2 && i < 3) refs[i + 1].current?.focus();
  }

  return (
    <div className="flex items-center gap-2">
      {segs.map((seg, i) => {
        const enabled = i === 0 || segs[i - 1].length === 2;
        return (
          <input
            key={i}
            ref={refs[i]}
            value={seg}
            disabled={!enabled}
            onChange={(e) => setSeg(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && seg === "" && i > 0) refs[i - 1].current?.focus();
            }}
            maxLength={2}
            placeholder="—"
            className={cn(
              "w-11 h-10 text-center rounded-lg border text-sm font-mono uppercase bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
              enabled ? "border-slate-200 dark:border-slate-700" : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-not-allowed",
            )}
          />
        );
      })}
    </div>
  );
}

export default function ProcedureCodesScreen() {
  const [codes, setCodes] = useState<ProcedureCode[]>(SEED);
  const [categories, setCategories] = useState(PROCEDURE_CODE_CATEGORIES);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ProcedureCode | null>(null);
  const [form, setForm] = useState<Omit<ProcedureCode, "id">>({
    code: "", description: "", category: "", charge: 0, discount: 0,
    modifier: "", pos: "11", additionalDetails: "", displayOrder: 1, isActive: true,
  });
  const [newCatName, setNewCatName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = useMemo(() => codes.filter(c => {
    const matchQ = !query || c.code.toLowerCase().includes(query.toLowerCase()) || c.description.toLowerCase().includes(query.toLowerCase());
    const matchCat = !catFilter || c.category === catFilter;
    return matchQ && matchCat;
  }), [codes, query, catFilter]);

  function openAdd() {
    setForm({ code: "", description: "", category: "", charge: 0, discount: 0, modifier: "", pos: "11", additionalDetails: "", displayOrder: codes.length + 1, isActive: true });
    setNewCatName(""); setEditing(null); setErrors({}); setDrawerOpen(true);
  }

  function openEdit(c: ProcedureCode) {
    setForm({ code: c.code, description: c.description, category: c.category, charge: c.charge, discount: c.discount, modifier: c.modifier, pos: c.pos, additionalDetails: c.additionalDetails, displayOrder: c.displayOrder, isActive: c.isActive });
    setNewCatName(""); setEditing(c); setErrors({}); setDrawerOpen(true);
  }

  function handleCategoryChange(v: string) {
    if (v === NEW_CATEGORY) {
      setForm(p => ({ ...p, category: NEW_CATEGORY }));
      return;
    }
    setForm(p => ({ ...p, category: v }));
  }

  function confirmNewCategory() {
    const label = newCatName.trim();
    if (!label) return;
    const value = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!categories.some(c => c.value === value)) {
      setCategories(p => [...p, { value, label }]);
    }
    setForm(p => ({ ...p, category: value }));
    setNewCatName("");
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.code.trim()) errs.code = "Code is required";
    if (!form.description.trim()) errs.description = "Description is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const clean = { ...form, category: form.category === NEW_CATEGORY ? "" : form.category };
    if (editing) {
      setCodes(p => p.map(c => c.id === editing.id ? { ...c, ...clean } : c));
    } else {
      setCodes(p => [...p, { id: crypto.randomUUID(), ...clean }]);
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
            <p className="text-sm text-slate-500 dark:text-slate-400">What a visit bills at, and which POS code accompanies the claim — prefills encounter note codes.</p>
          </div>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex-shrink-0">
          <Plus className="w-4 h-4" /> Add Code
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by code or description…"
            className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {query && <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-3.5 h-3.5" /></button>}
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-28">Code</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Description</th>
              <th className="text-right py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-24">Charge</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-32">Category</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-24">Modifier</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-20">POS</th>
              <th className="text-center py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-24">Status</th>
              <th className="py-3 px-4 w-24" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-slate-400">No codes found</td></tr>}
            {filtered.map(c => (
              <tr key={c.id} onMouseEnter={() => setHoveredId(c.id)} onMouseLeave={() => setHoveredId(null)}
                className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-slate-100">{c.code}</td>
                <td className="py-3 px-4 text-slate-900 dark:text-slate-100">{c.description}</td>
                <td className="py-3 px-4 text-right font-semibold text-slate-800 dark:text-slate-200">${c.charge.toFixed(2)}</td>
                <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">{categories.find(cat => cat.value === c.category)?.label ?? "—"}</td>
                <td className="py-3 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">{c.modifier || "—"}</td>
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

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Edit Procedure Code" : "Add Procedure Code"} description="Code and billing details" width="w-[520px]"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">Save Code</button>
          </div>
        }>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Code <span className="text-red-500">*</span></label>
            <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g., 90837"
              className={cn("w-full px-3 py-2 rounded-lg border text-sm font-mono bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.code ? "border-red-400" : "border-slate-200 dark:border-slate-700")} />
            {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
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
            <select value={form.category} onChange={e => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">No category</option>
              {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              <option value={NEW_CATEGORY}>+ Create category…</option>
            </select>
            {form.category === NEW_CATEGORY && (
              <div className="mt-2 flex gap-2">
                <input autoFocus value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="New category name"
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); confirmNewCategory(); } }}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={confirmNewCategory} className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">Add</button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Charge ($)</label>
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Modifier</label>
            <ModifierBoxes value={form.modifier} onChange={v => setForm(p => ({ ...p, modifier: v }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Place of Service (POS) Code</label>
            <select value={form.pos} onChange={e => setForm(p => ({ ...p, pos: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {POS_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Additional Details</label>
            <textarea value={form.additionalDetails} onChange={e => setForm(p => ({ ...p, additionalDetails: e.target.value }))} rows={3} placeholder="Notes for billing staff…"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Display Order</label>
            <input type="number" min={1} value={form.displayOrder} onChange={e => setForm(p => ({ ...p, displayOrder: parseInt(e.target.value) || 1 }))}
              className="w-full max-w-[140px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Active</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Available for billing selection</p>
            </div>
            <Toggle checked={form.isActive} onChange={v => setForm(p => ({ ...p, isActive: v }))} />
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
