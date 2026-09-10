"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Search, SlidersHorizontal, Columns3, ChevronDown, X, Eye, UserPlus, Check,
} from "lucide-react";
import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import { ReferPatientModal } from "@/components/provider/patients/ReferPatientModal";
import {
  getMyPatients, calcAge, getCareCoordinator, getLastVisit, getNextVisit,
  CARE_COORDINATORS, type PatientProfile,
} from "@/data/provider-patients";
import { cn } from "@/lib/utils";

type ColKey = "genderAge" | "clinic" | "patientType" | "insurance" | "lastVisit" | "nextAppt" | "status";

const OPTIONAL_COLS: { key: ColKey; label: string }[] = [
  { key: "genderAge", label: "Gender / Age" },
  { key: "clinic", label: "Clinic" },
  { key: "patientType", label: "Patient Type" },
  { key: "insurance", label: "Insurance" },
  { key: "lastVisit", label: "Last Visit" },
  { key: "nextAppt", label: "Next Appointment" },
  { key: "status", label: "Status" },
];

const AGE_BUCKETS = [
  { value: "any", label: "Any age" },
  { value: "u30", label: "Under 30" },
  { value: "30-50", label: "30 – 50" },
  { value: "o50", label: "Over 50" },
];

const INSURANCE_STATES = ["any", "active", "inactive", "pending"] as const;

function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function useOutsideClose<T extends HTMLElement>(onClose: () => void) {
  const ref = useRef<T>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  return ref;
}

export default function ProviderPatientsPage() {
  const allPatients = useMemo(() => getMyPatients(), []);

  const [search, setSearch] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("q") ?? "";
  });
  const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(new Set());
  const [colMenu, setColMenu] = useState(false);
  const [filterMenu, setFilterMenu] = useState(false);
  const [refer, setRefer] = useState(false);

  const [fCoordinator, setFCoordinator] = useState("any");
  const [fStatus, setFStatus] = useState("any");
  const [fInsurance, setFInsurance] = useState<(typeof INSURANCE_STATES)[number]>("any");
  const [fAge, setFAge] = useState("any");
  const [fUpcomingOnly, setFUpcomingOnly] = useState(false);

  const colRef = useOutsideClose<HTMLDivElement>(() => setColMenu(false));
  const filterRef = useOutsideClose<HTMLDivElement>(() => setFilterMenu(false));

  function toggleCol(k: ColKey) {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
  }

  const activeFilterCount =
    (fCoordinator !== "any" ? 1 : 0) +
    (fStatus !== "any" ? 1 : 0) +
    (fInsurance !== "any" ? 1 : 0) +
    (fAge !== "any" ? 1 : 0) +
    (fUpcomingOnly ? 1 : 0);

  function clearFilters() {
    setFCoordinator("any"); setFStatus("any"); setFInsurance("any"); setFAge("any"); setFUpcomingOnly(false);
  }

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allPatients
      .filter((p) => {
        if (q && ![p.displayName, p.mrn, p.email, p.phone].some((f) => f.toLowerCase().includes(q))) return false;
        if (fCoordinator !== "any" && p.careCoordinatorId !== fCoordinator) return false;
        if (fStatus !== "any" && p.status !== fStatus) return false;
        if (fInsurance !== "any" && p.insuranceStatus !== fInsurance) return false;
        if (fUpcomingOnly && !getNextVisit(p.id)) return false;
        if (fAge !== "any") {
          const a = calcAge(p.dob);
          if (fAge === "u30" && a >= 30) return false;
          if (fAge === "30-50" && (a < 30 || a > 50)) return false;
          if (fAge === "o50" && a <= 50) return false;
        }
        return true;
      })
      .sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [allPatients, search, fCoordinator, fStatus, fInsurance, fAge, fUpcomingOnly]);

  return (
    <ProviderLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">My Patients</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {allPatients.length} patients in your panel at Penfield Psychiatry
            </p>
          </div>
          <button
            onClick={() => setRefer(true)}
            data-tour="pt-refer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold practmd-gradient text-white shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Refer Patient
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div data-tour="pt-search" className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, MRN, email, phone…"
              className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 outline-none"
            />
            {search && <button onClick={() => setSearch("")}><X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" /></button>}
          </div>

          {/* Columns */}
          <div className="relative" ref={colRef} data-tour="pt-columns">
            <button
              onClick={() => { setColMenu((o) => !o); setFilterMenu(false); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Columns3 className="w-4 h-4" /> Columns <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            {colMenu && (
              <div className="absolute left-0 top-11 z-30 w-60 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-2">
                <p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Optional columns</p>
                {OPTIONAL_COLS.map((c) => (
                  <label key={c.key} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                    <span className={cn("w-4 h-4 rounded border flex items-center justify-center", visibleCols.has(c.key) ? "bg-brand-600 border-brand-600" : "border-slate-300 dark:border-slate-600")}>
                      {visibleCols.has(c.key) && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </span>
                    <input type="checkbox" checked={visibleCols.has(c.key)} onChange={() => toggleCol(c.key)} className="sr-only" />
                    {c.label}
                  </label>
                ))}
                {visibleCols.size > 0 && (
                  <button onClick={() => setVisibleCols(new Set())} className="mt-1 w-full text-left px-2 py-1.5 text-xs font-medium text-brand-700 dark:text-brand-400 hover:underline">
                    Reset to default columns
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="relative" ref={filterRef} data-tour="pt-filters">
            <button
              onClick={() => { setFilterMenu((o) => !o); setColMenu(false); }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border",
                activeFilterCount > 0
                  ? "border-brand-400 bg-brand-50/60 text-brand-800 dark:bg-brand-950/20 dark:text-brand-300 dark:border-brand-700"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
              )}
            >
              <SlidersHorizontal className="w-4 h-4" /> Advanced Filters
              {activeFilterCount > 0 && <span className="ml-0.5 min-w-[16px] h-4 px-1 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            {filterMenu && (
              <div className="absolute left-0 top-11 z-30 w-72 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-3 space-y-3">
                <FilterField label="Care coordinator">
                  <select value={fCoordinator} onChange={(e) => setFCoordinator(e.target.value)} className={selCls}>
                    <option value="any">Any</option>
                    {CARE_COORDINATORS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </FilterField>
                <FilterField label="Patient status">
                  <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={selCls}>
                    <option value="any">Any</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </FilterField>
                <FilterField label="Insurance status">
                  <select value={fInsurance} onChange={(e) => setFInsurance(e.target.value as typeof fInsurance)} className={selCls}>
                    {INSURANCE_STATES.map((s) => <option key={s} value={s}>{s === "any" ? "Any" : s[0].toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </FilterField>
                <FilterField label="Age">
                  <select value={fAge} onChange={(e) => setFAge(e.target.value)} className={selCls}>
                    {AGE_BUCKETS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </FilterField>
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={fUpcomingOnly} onChange={(e) => setFUpcomingOnly(e.target.checked)} className="w-4 h-4 rounded accent-brand-600" />
                  Has an upcoming appointment
                </label>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="w-full text-xs font-medium text-brand-700 dark:text-brand-400 hover:underline text-left">
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>

          <span className="ml-auto text-xs text-slate-400">{rows.length} shown</span>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto" data-tour="pt-table">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-left">
                <Th>Patient</Th>
                <Th>Full Name</Th>
                <Th>Date of Birth</Th>
                {visibleCols.has("genderAge") && <Th>Gender / Age</Th>}
                <Th>Mobile Phone</Th>
                <Th>Email</Th>
                {visibleCols.has("clinic") && <Th>Clinic</Th>}
                {visibleCols.has("patientType") && <Th>Patient Type</Th>}
                {visibleCols.has("insurance") && <Th>Insurance</Th>}
                <Th>Care Coordinator</Th>
                {visibleCols.has("lastVisit") && <Th>Last Visit</Th>}
                {visibleCols.has("nextAppt") && <Th>Next Appointment</Th>}
                {visibleCols.has("status") && <Th>Status</Th>}
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-4 py-10 text-center text-sm text-slate-400">No patients match your search or filters.</td>
                </tr>
              ) : rows.map((p) => <Row key={p.id} p={p} cols={visibleCols} />)}
            </tbody>
          </table>
        </div>
      </div>

      {refer && <ReferPatientModal onClose={() => setRefer(false)} />}
    </ProviderLayout>
  );
}

function Row({ p, cols }: { p: PatientProfile; cols: Set<ColKey> }) {
  const coordinator = getCareCoordinator(p.careCoordinatorId);
  const last = getLastVisit(p.id);
  const next = getNextVisit(p.id);
  const href = `/provider/patients/${p.id}`;
  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 text-xs font-bold shrink-0">
            {p.firstName[0]}{p.lastName[0]}
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">{p.mrn}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <Link href={href} className="font-medium text-brand-700 dark:text-brand-400 hover:underline whitespace-nowrap">
          {p.displayName}
        </Link>
      </td>
      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{p.dob}</td>
      {cols.has("genderAge") && <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{p.gender} · {calcAge(p.dob)} yrs</td>}
      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{p.phone}</td>
      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.email}</td>
      {cols.has("clinic") && <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{p.clinicName}</td>}
      {cols.has("patientType") && <td className="px-4 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{p.patientType}</td>}
      {cols.has("insurance") && (
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="text-slate-600 dark:text-slate-300">{p.insuranceProvider ?? "—"}</span>
          {p.insuranceStatus && <span className="ml-1.5 text-[10px] font-semibold text-slate-400 capitalize">({p.insuranceStatus})</span>}
        </td>
      )}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-500 dark:text-slate-300">{coordinator?.initials ?? "—"}</span>
          <span className="text-slate-600 dark:text-slate-300">{coordinator?.name ?? "Unassigned"}</span>
        </div>
      </td>
      {cols.has("lastVisit") && <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">{last ? fmtDate(last.date) : "—"}</td>}
      {cols.has("nextAppt") && <td className="px-4 py-3 whitespace-nowrap text-xs">{next ? <span className="text-brand-700 dark:text-brand-400">{fmtDate(next.date)}</span> : <span className="text-slate-400">None</span>}</td>}
      {cols.has("status") && (
        <td className="px-4 py-3">
          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize", p.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400")}>
            {p.status}
          </span>
        </td>
      )}
      <td className="px-4 py-3">
        <Link href={href} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
          <Eye className="w-3.5 h-3.5" /> View
        </Link>
      </td>
    </tr>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">{children}</th>;
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

const selCls = "w-full px-2.5 py-1.5 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500";
