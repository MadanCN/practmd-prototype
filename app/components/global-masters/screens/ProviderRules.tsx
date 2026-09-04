"use client";

import { useState } from "react";
import { UserCheck, Plus, Pencil, Trash2 } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PROVIDERS = ["Dr. Sarah Mitchell", "Dr. James O'Brien", "Lisa Nguyen, LCSW", "Dr. Marcus Reid", "Amara Johnson, LPC"];
const LOCATIONS = ["Penfield Psychiatry", "New Hartford Psychological Services"];
const VISIT_TYPES = ["Initial Consultation", "Follow-Up", "Therapy Session", "Medication Check", "Group Session", "Crisis Visit"];

interface ProviderRule {
  id: string;
  provider: string;
  location: string;
  days: boolean[];
  fromTime: string;
  toTime: string;
  slotDuration: number;
  bufferTime: number;
  maxPerDay: number;
  visitTypes: string[];
  isActive: boolean;
}

const SEED: ProviderRule[] = [
  { id: "1", provider: "Dr. Sarah Mitchell", location: "Penfield Psychiatry", days: [true, true, false, true, true, false, false], fromTime: "09:00", toTime: "17:00", slotDuration: 30, bufferTime: 10, maxPerDay: 12, visitTypes: ["Initial Consultation", "Follow-Up", "Medication Check"], isActive: true },
  { id: "2", provider: "Dr. James O'Brien", location: "Penfield Psychiatry", days: [true, false, true, false, true, false, false], fromTime: "10:00", toTime: "16:00", slotDuration: 60, bufferTime: 15, maxPerDay: 6, visitTypes: ["Initial Consultation", "Therapy Session"], isActive: true },
  { id: "3", provider: "Lisa Nguyen, LCSW", location: "New Hartford Psychological Services", days: [false, true, true, true, false, false, false], fromTime: "08:00", toTime: "15:00", slotDuration: 60, bufferTime: 10, maxPerDay: 7, visitTypes: ["Therapy Session"], isActive: true },
];

function RuleCard({ rule, onEdit, onDelete }: { rule: ProviderRule; onEdit: () => void; onDelete: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-900 dark:text-slate-100">{rule.provider}</p>
            <span className="text-xs text-slate-500 dark:text-slate-400">@ {rule.location}</span>
            <span className={cn("text-xs px-2 py-0.5 rounded-full", rule.isActive ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400")}>
              {rule.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{rule.fromTime} – {rule.toTime}</span>
            <span>{rule.slotDuration}m slots</span>
            <span>{rule.bufferTime}m buffer</span>
            <span>Max {rule.maxPerDay}/day</span>
          </div>
          <div className="flex gap-1 mt-1.5">
            {DAYS.map((d, i) => (
              <span key={d} className={cn("text-xs px-1.5 py-0.5 rounded", rule.days[i] ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-medium" : "text-slate-300 dark:text-slate-600")}>{d}</span>
            ))}
          </div>
        </div>
        <div className={cn("flex items-center gap-1 flex-shrink-0 transition-opacity", hovered ? "opacity-100" : "opacity-0")}>
          <button onClick={onEdit} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
    </div>
  );
}

export default function ProviderRulesScreen() {
  const [rules, setRules] = useState<ProviderRule[]>(SEED);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ProviderRule | null>(null);
  const [form, setForm] = useState<Omit<ProviderRule, "id">>({
    provider: PROVIDERS[0], location: LOCATIONS[0], days: [true, true, true, true, true, false, false],
    fromTime: "09:00", toTime: "17:00", slotDuration: 30, bufferTime: 10, maxPerDay: 10, visitTypes: [], isActive: true,
  });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function openAdd() {
    setForm({ provider: PROVIDERS[0], location: LOCATIONS[0], days: [true, true, true, true, true, false, false], fromTime: "09:00", toTime: "17:00", slotDuration: 30, bufferTime: 10, maxPerDay: 10, visitTypes: [], isActive: true });
    setEditing(null); setDrawerOpen(true);
  }

  function openEdit(r: ProviderRule) {
    setForm({ provider: r.provider, location: r.location, days: [...r.days], fromTime: r.fromTime, toTime: r.toTime, slotDuration: r.slotDuration, bufferTime: r.bufferTime, maxPerDay: r.maxPerDay, visitTypes: [...r.visitTypes], isActive: r.isActive });
    setEditing(r); setDrawerOpen(true);
  }

  function handleSave() {
    if (editing) {
      setRules(p => p.map(r => r.id === editing.id ? { ...r, ...form } : r));
    } else {
      setRules(p => [...p, { id: crypto.randomUUID(), ...form }]);
    }
    setDrawerOpen(false);
  }

  function toggleVT(vt: string) {
    setForm(f => ({ ...f, visitTypes: f.visitTypes.includes(vt) ? f.visitTypes.filter(x => x !== vt) : [...f.visitTypes, vt] }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center flex-shrink-0">
            <UserCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Provider Rules</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Set individual provider availability, slot settings, and visit type restrictions.</p>
          </div>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex-shrink-0">
          <Plus className="w-4 h-4" /> Add Rule
        </button>
      </div>

      <div className="space-y-3">
        {rules.map(r => <RuleCard key={r.id} rule={r} onEdit={() => openEdit(r)} onDelete={() => setDeleteId(r.id)} />)}
        {rules.length === 0 && <p className="text-center text-sm text-slate-400 py-8">No provider rules configured</p>}
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Edit Provider Rule" : "Add Provider Rule"} description="Configure availability for a specific provider"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">Save Rule</button>
          </div>
        }>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Provider</label>
              <select value={form.provider} onChange={e => setForm(p => ({ ...p, provider: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Location</label>
              <select value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Available Days</label>
            <div className="flex gap-2">
              {DAYS.map((d, i) => (
                <button key={d} type="button" onClick={() => setForm(p => { const days = [...p.days]; days[i] = !days[i]; return { ...p, days }; })}
                  className={cn("w-10 h-10 rounded-full text-sm font-medium border transition-colors",
                    form.days[i] ? "bg-blue-600 border-blue-600 text-white" : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-400")}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">From</label>
              <input type="time" value={form.fromTime} onChange={e => setForm(p => ({ ...p, fromTime: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">To</label>
              <input type="time" value={form.toTime} onChange={e => setForm(p => ({ ...p, toTime: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Slot (min)</label>
              <input type="number" min={5} step={5} value={form.slotDuration} onChange={e => setForm(p => ({ ...p, slotDuration: parseInt(e.target.value) || 30 }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Buffer (min)</label>
              <input type="number" min={0} value={form.bufferTime} onChange={e => setForm(p => ({ ...p, bufferTime: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Max/day</label>
              <input type="number" min={1} value={form.maxPerDay} onChange={e => setForm(p => ({ ...p, maxPerDay: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Allowed Visit Types</label>
            <div className="flex flex-wrap gap-2">
              {VISIT_TYPES.map(vt => (
                <button key={vt} type="button" onClick={() => toggleVT(vt)}
                  className={cn("px-3 py-1 rounded-full border text-xs font-medium transition-colors",
                    form.visitTypes.includes(vt) ? "bg-blue-600 border-blue-600 text-white" : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-400")}>
                  {vt}
                </button>
              ))}
            </div>
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
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Delete this provider rule?</h3>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={() => { setRules(p => p.filter(r => r.id !== deleteId)); setDeleteId(null); }} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
