"use client";

import { useState, useMemo } from "react";
import { Plus, Search, Pencil, Globe2, Star, PowerOff } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

interface Country {
  id: string;
  name: string;
  flag: string;
  isoCode: string;
  phoneCode: string;
  isActive: boolean;
  isDefault: boolean;
}

const SEED: Country[] = [
  { id: "1", name: "United States", flag: "🇺🇸", isoCode: "US", phoneCode: "+1", isActive: true, isDefault: true },
  { id: "2", name: "Canada", flag: "🇨🇦", isoCode: "CA", phoneCode: "+1", isActive: true, isDefault: false },
  { id: "3", name: "United Kingdom", flag: "🇬🇧", isoCode: "GB", phoneCode: "+44", isActive: true, isDefault: false },
  { id: "4", name: "Australia", flag: "🇦🇺", isoCode: "AU", phoneCode: "+61", isActive: true, isDefault: false },
  { id: "5", name: "India", flag: "🇮🇳", isoCode: "IN", phoneCode: "+91", isActive: false, isDefault: false },
  { id: "6", name: "Germany", flag: "🇩🇪", isoCode: "DE", phoneCode: "+49", isActive: false, isDefault: false },
];

const EMPTY_FORM = { name: "", flag: "", isoCode: "", phoneCode: "", isActive: true };

export default function CountryScreen() {
  const [countries, setCountries] = useState<Country[]>(SEED);
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Country | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() =>
    countries.filter((c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.isoCode.toLowerCase().includes(query.toLowerCase())
    ),
    [countries, query]
  );

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setErrors({});
    setDrawerOpen(true);
  }

  function openEdit(c: Country) {
    setEditing(c);
    setForm({ name: c.name, flag: c.flag, isoCode: c.isoCode, phoneCode: c.phoneCode, isActive: c.isActive });
    setErrors({});
    setDrawerOpen(true);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Country name is required";
    if (!form.isoCode.trim()) e.isoCode = "ISO code is required";
    if (!form.phoneCode.trim()) e.phoneCode = "Phone code is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    if (editing) {
      setCountries((prev) => prev.map((c) => c.id === editing.id ? { ...c, ...form } : c));
    } else {
      setCountries((prev) => [...prev, { id: Date.now().toString(), ...form, isDefault: false }]);
    }
    setDrawerOpen(false);
  }

  function setDefault(id: string) {
    setCountries((prev) => prev.map((c) => ({ ...c, isDefault: c.id === id })));
  }

  function toggleActive(id: string) {
    setCountries((prev) => prev.map((c) => c.id === id ? { ...c, isActive: !c.isActive } : c));
  }

  const inp = (key: string) => ({
    className: cn(
      "w-full px-3 py-2 rounded-lg text-sm border bg-white dark:bg-slate-800",
      "text-slate-900 dark:text-slate-100 placeholder:text-slate-400",
      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
      errors[key] ? "border-red-400 dark:border-red-600" : "border-slate-200 dark:border-slate-700"
    ),
  });

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
            <Globe2 className="w-[18px] h-[18px] text-blue-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Country</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage supported countries with ISO codes and phone prefixes</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Country
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search countries…"
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700
              bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100
              placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <span className="text-xs text-slate-400">{filtered.length} countries</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map((country) => (
          <div
            key={country.id}
            className={cn(
              "group bg-white dark:bg-slate-900 rounded-xl border p-4 transition-all",
              country.isDefault
                ? "border-blue-300 dark:border-blue-700 ring-1 ring-blue-300 dark:ring-blue-700"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
              !country.isActive && "opacity-60"
            )}
          >
            {/* Card top */}
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl leading-none">{country.flag || "🌐"}</span>
              <div className="flex items-center gap-1">
                {country.isDefault && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded-full">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    Default
                  </span>
                )}
                <span className={cn(
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                  country.isActive
                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                )}>
                  {country.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            {/* Country name */}
            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-1">{country.name}</p>

            {/* Codes */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono font-medium">
                {country.isoCode}
              </span>
              <span>{country.phoneCode}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => openEdit(country)}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
              >
                <Pencil className="w-3 h-3" /> Edit
              </button>
              {!country.isDefault && (
                <button
                  onClick={() => setDefault(country.id)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 transition-colors"
                >
                  <Star className="w-3 h-3" /> Set Default
                </button>
              )}
              <button
                onClick={() => toggleActive(country.id)}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <PowerOff className="w-3 h-3" />
                {country.isActive ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-slate-400">
            {query ? `No countries matching "${query}"` : "No countries configured yet."}
          </div>
        )}
      </div>

      {/* Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Edit Country" : "Add Country"}
        description={editing ? `Editing: ${editing.name}` : "Add a new country to the platform"}
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDrawerOpen(false)}
              className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {editing ? "Save Changes" : "Add Country"}
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Country Name <span className="text-red-500">*</span>
            </label>
            <input {...inp("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. United States" />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Flag Emoji</label>
            <input {...inp("flag")} value={form.flag} onChange={(e) => setForm({ ...form, flag: e.target.value })} placeholder="🇺🇸" />
            <p className="mt-1 text-xs text-slate-400">Paste a country flag emoji</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                ISO Code <span className="text-red-500">*</span>
              </label>
              <input {...inp("isoCode")} value={form.isoCode} onChange={(e) => setForm({ ...form, isoCode: e.target.value.toUpperCase() })} placeholder="US" maxLength={3} className={cn(inp("isoCode").className, "font-mono")} />
              {errors.isoCode && <p className="mt-1 text-xs text-red-500">{errors.isoCode}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Phone Code <span className="text-red-500">*</span>
              </label>
              <input {...inp("phoneCode")} value={form.phoneCode} onChange={(e) => setForm({ ...form, phoneCode: e.target.value })} placeholder="+1" className={cn(inp("phoneCode").className, "font-mono")} />
              {errors.phoneCode && <p className="mt-1 text-xs text-red-500">{errors.phoneCode}</p>}
            </div>
          </div>

          <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Active</p>
              <p className="text-xs text-slate-400 mt-0.5">Inactive countries won&apos;t appear in address forms</p>
            </div>
            <Toggle checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
