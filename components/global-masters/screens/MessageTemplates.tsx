"use client";

import { useState, useMemo } from "react";
import { MessageSquare, Plus, Pencil, Copy, Trash2, Search, X } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

interface QuickText {
  id: string;
  title: string;
  text: string;
  category: string;
  isActive: boolean;
}

const CATEGORIES = ["Greeting", "Appointment", "Follow-Up", "General", "Billing"];

const SEED: QuickText[] = [
  { id: "1", title: "Standard Greeting", text: "Hi! Thank you for reaching out to our clinic. How can I help you today?", category: "Greeting", isActive: true },
  { id: "2", title: "Appointment Confirmation", text: "Your appointment has been confirmed. Please arrive 10 minutes early and bring your insurance card and photo ID.", category: "Appointment", isActive: true },
  { id: "3", title: "Reschedule Offer", text: "We have a few openings available. Would you like me to help you find a new time that works for you?", category: "Appointment", isActive: true },
  { id: "4", title: "Insurance Verification", text: "I'm checking your insurance eligibility now. This usually takes about 1-2 minutes.", category: "General", isActive: true },
  { id: "5", title: "Co-Pay Reminder", text: "Just a reminder that your co-pay will be collected at the time of your visit.", category: "Billing", isActive: true },
];

const CATEGORY_COLORS: Record<string, string> = {
  Greeting: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400",
  Appointment: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400",
  "Follow-Up": "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400",
  General: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
  Billing: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400",
};

export default function MessageTemplatesScreen() {
  const [quickTexts, setQuickTexts] = useState<QuickText[]>(SEED);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<QuickText | null>(null);
  const [form, setForm] = useState<Omit<QuickText, "id">>({ title: "", text: "", category: "Greeting", isActive: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => quickTexts.filter(t => {
    const matchQ = !query || t.title.toLowerCase().includes(query.toLowerCase()) || t.text.toLowerCase().includes(query.toLowerCase());
    const matchC = !catFilter || t.category === catFilter;
    return matchQ && matchC;
  }), [quickTexts, query, catFilter]);

  function openAdd() {
    setForm({ title: "", text: "", category: "Greeting", isActive: true });
    setEditing(null); setErrors({}); setDrawerOpen(true);
  }

  function openEdit(t: QuickText) {
    setForm({ title: t.title, text: t.text, category: t.category, isActive: t.isActive });
    setEditing(t); setErrors({}); setDrawerOpen(true);
  }

  function handleCopy(t: QuickText) {
    navigator.clipboard.writeText(t.text);
    setCopiedId(t.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "Title is required";
    if (!form.text.trim()) errs.text = "Text is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (editing) {
      setQuickTexts(p => p.map(t => t.id === editing.id ? { ...t, ...form } : t));
    } else {
      setQuickTexts(p => [...p, { id: crypto.randomUUID(), ...form }]);
    }
    setDrawerOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Message Templates</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Quick-text snippets for Care Coordinators to use while chatting with patients.</p>
          </div>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex-shrink-0">
          <Plus className="w-4 h-4" /> Add Quick Text
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search quick texts…"
            className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {query && <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-3.5 h-3.5" /></button>}
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map(t => (
          <div key={t.id}
            onMouseEnter={() => setHoveredId(t.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="group rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors bg-white dark:bg-slate-900/20">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{t.title}</p>
                <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", CATEGORY_COLORS[t.category] ?? CATEGORY_COLORS.General)}>
                  {t.category}
                </span>
                {!t.isActive && <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">Inactive</span>}
              </div>
              <div className={cn("flex items-center gap-1 flex-shrink-0 transition-opacity", hoveredId === t.id ? "opacity-100" : "opacity-0")}>
                <button
                  onClick={() => handleCopy(t)}
                  className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                  title="Copy text">
                  <Copy className={cn("w-3.5 h-3.5", copiedId === t.id && "text-emerald-500")} />
                </button>
                <button onClick={() => openEdit(t)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => setDeleteId(t.id)} className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{t.text}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500">No quick texts found</div>
        )}
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Edit Quick Text" : "Add Quick Text"} description="Create a reusable chat snippet for Care Coordinators"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">Save Quick Text</button>
          </div>
        }>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Title <span className="text-red-500">*</span></label>
            <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g., Standard Greeting"
              className={cn("w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                errors.title ? "border-red-400" : "border-slate-200 dark:border-slate-700")} />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category</label>
            <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Text <span className="text-red-500">*</span></label>
            <textarea value={form.text} onChange={e => setForm(p => ({ ...p, text: e.target.value }))} placeholder="Type the quick-text snippet here…" rows={4}
              className={cn("w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none",
                errors.text ? "border-red-400" : "border-slate-200 dark:border-slate-700")} />
            {errors.text && <p className="text-xs text-red-500 mt-1">{errors.text}</p>}
          </div>
          <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Active</p>
            <Toggle checked={form.isActive} onChange={v => setForm(p => ({ ...p, isActive: v }))} />
          </div>
        </div>
      </Drawer>

      {deleteId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border shadow-xl p-6 space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Delete this quick text?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">This snippet will be permanently removed and Care Coordinators will no longer be able to use it.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={() => { setQuickTexts(p => p.filter(t => t.id !== deleteId)); setDeleteId(null); }} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
