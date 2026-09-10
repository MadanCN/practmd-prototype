"use client";

import { useState, useMemo } from "react";
import { Building, Plus, Pencil, PowerOff, Trash2, Search, X, Upload } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

interface Insurer {
  id: string;
  name: string;
  abbreviation: string;
  payerId: string;
  planType: string;
  phone: string;
  website: string;
  displayOrder: number;
  isActive: boolean;
}

const PLAN_TYPES = [
  { value: "commercial", label: "Commercial" },
  { value: "medicare", label: "Medicare" },
  { value: "medicaid", label: "Medicaid" },
  { value: "tricare", label: "TRICARE" },
  { value: "workers_comp", label: "Workers Comp" },
  { value: "self_pay", label: "Self Pay" },
  { value: "other", label: "Other" },
];

const PLAN_COLORS: Record<string, string> = {
  commercial: "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400",
  medicare: "bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400",
  medicaid: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400",
  tricare: "bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400",
  workers_comp: "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400",
  self_pay: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
  other: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
};

const SEED: Insurer[] = [
  { id: "1", name: "Blue Cross Blue Shield", abbreviation: "BCBS", payerId: "BCBS001", planType: "commercial", phone: "1-800-252-2227", website: "bcbs.com", displayOrder: 1, isActive: true },
  { id: "2", name: "Aetna", abbreviation: "AET", payerId: "AET001", planType: "commercial", phone: "1-800-872-3862", website: "aetna.com", displayOrder: 2, isActive: true },
  { id: "3", name: "UnitedHealthcare", abbreviation: "UHC", payerId: "UHC001", planType: "commercial", phone: "1-866-801-4409", website: "uhc.com", displayOrder: 3, isActive: true },
  { id: "4", name: "Cigna", abbreviation: "CGN", payerId: "CGN001", planType: "commercial", phone: "1-800-244-6224", website: "cigna.com", displayOrder: 4, isActive: true },
  { id: "5", name: "Medicare", abbreviation: "MCR", payerId: "MCR001", planType: "medicare", phone: "1-800-633-4227", website: "medicare.gov", displayOrder: 5, isActive: true },
  { id: "6", name: "Medicaid NY", abbreviation: "MCAID-NY", payerId: "MCAID-NY001", planType: "medicaid", phone: "1-800-541-2831", website: "health.ny.gov/medicaid", displayOrder: 6, isActive: true },
  { id: "7", name: "Humana", abbreviation: "HUM", payerId: "HUM001", planType: "commercial", phone: "1-800-448-6262", website: "humana.com", displayOrder: 7, isActive: true },
  { id: "8", name: "Self Pay", abbreviation: "SP", payerId: "SP", planType: "self_pay", phone: "", website: "", displayOrder: 8, isActive: true },
];

function AvatarBadge({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const hue = name.charCodeAt(0) * 11 % 360;
  return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
      style={{ backgroundColor: `hsl(${hue}, 65%, 50%)` }}>
      {initials}
    </div>
  );
}

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

export default function InsurersScreen() {
  const [insurers, setInsurers] = useState<Insurer[]>(SEED);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Insurer | null>(null);
  const [form, setForm] = useState<Omit<Insurer, "id">>({ name: "", abbreviation: "", payerId: "", planType: "commercial", phone: "", website: "", displayOrder: 1, isActive: true });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = useMemo(() => insurers.filter(i => {
    const matchQ = !query || i.name.toLowerCase().includes(query.toLowerCase()) || i.payerId.toLowerCase().includes(query.toLowerCase()) || i.abbreviation.toLowerCase().includes(query.toLowerCase());
    const matchT = !typeFilter || i.planType === typeFilter;
    return matchQ && matchT;
  }), [insurers, query, typeFilter]);

  function openAdd() {
    setForm({ name: "", abbreviation: "", payerId: "", planType: "commercial", phone: "", website: "", displayOrder: insurers.length + 1, isActive: true });
    setEditing(null); setErrors({}); setDrawerOpen(true);
  }

  function openEdit(i: Insurer) {
    setForm({ name: i.name, abbreviation: i.abbreviation, payerId: i.payerId, planType: i.planType, phone: i.phone, website: i.website, displayOrder: i.displayOrder, isActive: i.isActive });
    setEditing(i); setErrors({}); setDrawerOpen(true);
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Insurer name is required";
    if (!form.payerId.trim()) errs.payerId = "Payer ID is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (editing) {
      setInsurers(p => p.map(i => i.id === editing.id ? { ...i, ...form } : i));
    } else {
      setInsurers(p => [...p, { id: crypto.randomUUID(), ...form }]);
    }
    setDrawerOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center flex-shrink-0">
            <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Insurers</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage insurance carriers and payer configurations for billing and claims submission.</p>
          </div>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex-shrink-0">
          <Plus className="w-4 h-4" /> Add Insurer
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, payer ID, or abbreviation…"
            className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {query && <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-3.5 h-3.5" /></button>}
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Types</option>
          {PLAN_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Insurer</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-32">Payer ID</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-32">Type</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-36">Phone</th>
              <th className="text-center py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-24">Status</th>
              <th className="py-3 px-4 w-24" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6} className="py-12 text-center text-slate-400">No insurers found</td></tr>}
            {filtered.map(i => (
              <tr key={i.id} onMouseEnter={() => setHoveredId(i.id)} onMouseLeave={() => setHoveredId(null)}
                className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <AvatarBadge name={i.name} />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{i.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{i.abbreviation}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">{i.payerId}</td>
                <td className="py-3 px-4">
                  <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", PLAN_COLORS[i.planType])}>
                    {PLAN_TYPES.find(p => p.value === i.planType)?.label}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs">{i.phone || "—"}</td>
                <td className="py-3 px-4 text-center"><StatusBadge active={i.isActive} /></td>
                <td className="py-3 px-4">
                  <div className={cn("flex items-center justify-end gap-1 transition-opacity", hoveredId === i.id ? "opacity-100" : "opacity-0")}>
                    <button onClick={() => openEdit(i)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setInsurers(p => p.map(x => x.id === i.id ? { ...x, isActive: !x.isActive } : x))} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"><PowerOff className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteId(i.id)} className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? "Edit Insurer" : "Add Insurer"} description="Insurance carrier details"
        footer={
          <div className="flex gap-3 justify-end">
            <button onClick={() => setDrawerOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">Save Insurer</button>
          </div>
        }>
        <div className="space-y-4">
          {/* Logo upload */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Logo</label>
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col items-center gap-2 text-slate-400 cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-colors">
              <Upload className="w-6 h-6" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Click to upload insurer logo</p>
              <p className="text-xs text-slate-400">PNG, SVG up to 2MB</p>
            </div>
          </div>
          {[
            { key: "name", label: "Insurer Name", required: true, placeholder: "e.g., Blue Cross Blue Shield" },
            { key: "abbreviation", label: "Abbreviation", placeholder: "e.g., BCBS" },
            { key: "payerId", label: "Payer ID", required: true, placeholder: "Electronic payer identifier" },
            { key: "phone", label: "Phone Number", placeholder: "e.g., 1-800-252-2227" },
            { key: "website", label: "Website", placeholder: "e.g., bcbs.com" },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{f.label} {f.required && <span className="text-red-500">*</span>}</label>
              <input value={String(form[f.key as keyof typeof form] ?? "")} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                className={cn("w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500",
                  errors[f.key] ? "border-red-400" : "border-slate-200 dark:border-slate-700")} />
              {errors[f.key] && <p className="text-xs text-red-500 mt-1">{errors[f.key]}</p>}
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Plan Type</label>
            <select value={form.planType} onChange={e => setForm(p => ({ ...p, planType: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {PLAN_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
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
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Delete this insurer?</h3>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-50">Cancel</button>
              <button onClick={() => { setInsurers(p => p.filter(i => i.id !== deleteId)); setDeleteId(null); }} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
