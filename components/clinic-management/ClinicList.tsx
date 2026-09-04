"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Plus, MapPin, Globe, Eye, Pencil, Building2, CheckCircle2, XCircle, Map, ChevronDown } from "lucide-react";
import { CLINICS, PRACTICES, type Clinic } from "@/data/clinics";
import { cn } from "@/lib/utils";

function avatarBg(name: string) {
  let h = 0;
  for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h);
  return `hsl(${Math.abs(h) % 360} 35% 88%)`;
}

function ClinicCard({ clinic }: { clinic: Clinic }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-blue-300 dark:hover:border-blue-700 transition-all hover:shadow-md group">
      <div className="h-1 bg-blue-500" />
      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border border-slate-100 dark:border-slate-800"
              style={{ backgroundColor: avatarBg(clinic.name) }}>
              {clinic.logoEmoji}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 leading-tight truncate">{clinic.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{clinic.practice}</p>
            </div>
          </div>
          <span className="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            {clinic.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        {/* Address + slug */}
        <div className="flex flex-wrap items-start gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-start gap-1">
            <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-1">{clinic.address}, {clinic.city}, {clinic.state}</span>
          </span>
          <span className="flex items-center gap-1 flex-shrink-0 font-mono">
            <span className="text-slate-300 dark:text-slate-600">#</span> {clinic.slug}
          </span>
        </div>

        {/* App chips */}
        <div className="flex flex-wrap gap-1.5">
          {clinic.hasClinicApp && (
            <span className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50">
              Clinic App <Globe className="w-3 h-3" />
            </span>
          )}
          {clinic.hasOperationsApp && (
            <span className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50">
              Operations App <Globe className="w-3 h-3" />
            </span>
          )}
          {clinic.hasPatientPortal && (
            <span className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50">
              Patient Portal <Globe className="w-3 h-3" />
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
          <Link href={`/clinic-management/${clinic.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Eye className="w-3.5 h-3.5" /> View
          </Link>
          <Link href={`/clinic-management/${clinic.id}?edit=true`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ClinicListScreen() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedPractice, setSelectedPractice] = useState<string | null>(null);

  const total = CLINICS.length;
  const active = CLINICS.filter(c => c.isActive).length;
  const inactive = total - active;
  const states = new Set(CLINICS.map(c => c.state)).size;
  const withDomains = CLINICS.filter(c => c.hasPatientPortal || c.hasClinicApp).length;

  const filtered = useMemo(() => CLINICS.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.city.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter === "active" && !c.isActive) return false;
    if (statusFilter === "inactive" && c.isActive) return false;
    if (selectedPractice && c.practice !== selectedPractice) return false;
    return true;
  }), [search, statusFilter, selectedPractice]);

  const practiceGroups = useMemo(() =>
    PRACTICES.map(p => ({ name: p, count: CLINICS.filter(c => c.practice === p).length })), []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Clinic Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Clinic portfolio overview and management</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Create New Clinic
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Total Clinics</p>
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-200">{total}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">All clinics</p>
          </div>
          <Building2 className="w-5 h-5 text-slate-400 mt-1" />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Active</p>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-emerald-600">{active}</p>
          <div className="mt-2 space-y-1">
            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${Math.round((active / total) * 100)}%` }} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{Math.round((active / total) * 100)}%</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Inactive</p>
            <p className={cn("text-3xl font-bold", inactive > 0 ? "text-red-600" : "text-slate-400")}>{inactive}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{inactive === 0 ? "All clinics active" : `${inactive} inactive`}</p>
          </div>
          <XCircle className={cn("w-5 h-5 mt-1", inactive > 0 ? "text-red-400" : "text-slate-300")} />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Coverage</p>
            <p className="text-3xl font-bold text-blue-600">{states}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">states · {withDomains} with domains</p>
          </div>
          <Map className="w-5 h-5 text-blue-400 mt-1" />
        </div>
      </div>

      {/* Main content */}
      <div className="flex gap-6">
        {/* By Practice sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sticky top-6">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">By Practice</h2>
            <div className="space-y-2">
              {practiceGroups.map(({ name, count }) => (
                <button key={name} onClick={() => setSelectedPractice(selectedPractice === name ? null : name)}
                  className={cn("w-full text-left p-2.5 rounded-lg transition-colors space-y-1.5",
                    selectedPractice === name ? "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800" : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent")}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-tight">{name}</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${(count / total) * 100}%` }} />
                  </div>
                </button>
              ))}
            </div>
            {selectedPractice && (
              <button onClick={() => setSelectedPractice(null)} className="mt-3 w-full text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                Clear filter ×
              </button>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clinics..."
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="relative">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                className="pl-3 pr-8 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Showing {filtered.length} of {total} clinics</p>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300" />{total} clinics</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />{active} Active</span>
              <span className="flex items-center gap-1"><Map className="w-3 h-3" />{states} states</span>
              <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{withDomains} with domains</span>
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {filtered.map(c => <ClinicCard key={c.id} clinic={c} />)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No clinics match your filters</p>
              <button onClick={() => { setSearch(""); setStatusFilter("all"); setSelectedPractice(null); }}
                className="mt-2 text-xs text-blue-600 hover:underline">Clear filters</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
