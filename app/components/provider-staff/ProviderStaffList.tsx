"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search, Plus, ChevronDown, ChevronUp, ChevronsUpDown,
  MoreHorizontal, Settings2, Columns3, Filter, RotateCcw, Pencil, Trash2, Eye
} from "lucide-react";
import { PROVIDERS, STAFF, type Provider, type StaffMember } from "@/data/providers";
import { CLINICS } from "@/data/clinics";
import { cn } from "@/lib/utils";

type Mode = "provider" | "staff";
type SubTab = "active" | "deleted";

function initials(first: string, last: string) { return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase(); }

function avatarBg(id: string) {
  let h = 0;
  for (const c of id) h = c.charCodeAt(0) + ((h << 5) - h);
  return `hsl(${Math.abs(h) % 360} 60% 70%)`;
}

function Avatar({ first, last, id }: { first: string; last: string; id: string }) {
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
      style={{ backgroundColor: avatarBg(id) }}>
      {initials(first, last)}
    </div>
  );
}

type SortDir = "asc" | "desc" | null;
interface SortState { field: string; dir: SortDir }

function SortIcon({ field, sort }: { field: string; sort: SortState }) {
  if (sort.field !== field) return <ChevronsUpDown className="w-3 h-3 text-slate-400" />;
  return sort.dir === "asc" ? <ChevronUp className="w-3 h-3 text-blue-500" /> : <ChevronDown className="w-3 h-3 text-blue-500" />;
}

function ColHeader({ label, field, sort, onSort }: { label: string; field: string; sort: SortState; onSort: (f: string) => void }) {
  return (
    <th className="py-2.5 px-3 text-left whitespace-nowrap">
      <button onClick={() => onSort(field)} className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
        {label} <SortIcon field={field} sort={sort} />
      </button>
    </th>
  );
}

export default function ProviderStaffListScreen() {
  const [mode, setMode] = useState<Mode>("provider");
  const [subTab, setSubTab] = useState<SubTab>("active");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState>({ field: "lastName", dir: "asc" });
  const [page, setPage] = useState(1);
  const [openActions, setOpenActions] = useState<string | null>(null);
  const PER_PAGE = 10;

  function toggleSort(field: string) {
    setSort(s => s.field === field ? { field, dir: s.dir === "asc" ? "desc" : s.dir === "desc" ? null : "asc" } : { field, dir: "asc" });
  }

  const providers = useMemo(() => {
    let list = PROVIDERS.filter(p => (subTab === "active" ? !p.isDeleted && p.isActive : p.isDeleted));
    if (search) list = list.filter(p => `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase().includes(search.toLowerCase()));
    if (sort.field && sort.dir) {
      list = [...list].sort((a, b) => {
        const av = (a as unknown as Record<string, unknown>)[sort.field] as string ?? "";
        const bv = (b as unknown as Record<string, unknown>)[sort.field] as string ?? "";
        return sort.dir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }
    return list;
  }, [search, sort, subTab]);

  const staff = useMemo(() => {
    let list = STAFF.filter(s => (subTab === "active" ? !s.isDeleted && s.isActive : s.isDeleted));
    if (search) list = list.filter(s => `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(search.toLowerCase()));
    if (sort.field && sort.dir) {
      list = [...list].sort((a, b) => {
        const av = (a as unknown as Record<string, unknown>)[sort.field] as string ?? "";
        const bv = (b as unknown as Record<string, unknown>)[sort.field] as string ?? "";
        return sort.dir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
      });
    }
    return list;
  }, [search, sort, subTab]);

  const items = mode === "provider" ? providers : staff;
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / PER_PAGE);
  const paginated = items.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function clinicName(id: string) { return CLINICS.find(c => c.id === id)?.name ?? id; }

  return (
    <div className="space-y-5">
      {/* Mode toggle */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          {(["provider", "staff"] as Mode[]).map(m => (
            <button key={m} onClick={() => { setMode(m); setPage(1); setSearch(""); }}
              className={cn("px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors",
                mode === m ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200")}>
              {m === "provider" ? "Provider" : "Staff"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          {(["active", "deleted"] as SubTab[]).map(t => (
            <button key={t} onClick={() => { setSubTab(t); setPage(1); }}
              className={cn("px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors",
                subTab === t ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm" : "text-slate-500 dark:text-slate-400")}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Title + Add */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {mode === "provider" ? "Provider" : "Staff"} Management
        </h1>
        <Link href="/provider-staff/add"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Add {mode === "provider" ? "Provider" : "Staff"}
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {[
          { label: "Density", icon: Settings2 }, { label: "Columns", icon: Columns3 },
          { label: "Active Filters", icon: Filter }, { label: "Reset", icon: RotateCcw },
        ].map(({ label, icon: Icon }) => (
          <button key={label} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800">
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
              <tr>
                {mode === "provider" ? (
                  <>
                    <ColHeader label="Name" field="lastName" sort={sort} onSort={toggleSort} />
                    <ColHeader label="Provider Type" field="providerType" sort={sort} onSort={toggleSort} />
                    <ColHeader label="Email" field="email" sort={sort} onSort={toggleSort} />
                    <ColHeader label="Phone" field="phone" sort={sort} onSort={toggleSort} />
                    <ColHeader label="Clinic Access" field="clinicAccess" sort={sort} onSort={toggleSort} />
                    <ColHeader label="Status" field="isActive" sort={sort} onSort={toggleSort} />
                    <th className="py-2.5 px-3 w-10" />
                  </>
                ) : (
                  <>
                    <th className="py-2.5 px-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">User Id</th>
                    <ColHeader label="Full Name" field="displayName" sort={sort} onSort={toggleSort} />
                    <ColHeader label="First Name" field="firstName" sort={sort} onSort={toggleSort} />
                    <ColHeader label="Last Name" field="lastName" sort={sort} onSort={toggleSort} />
                    <ColHeader label="Email" field="email" sort={sort} onSort={toggleSort} />
                    <ColHeader label="Phone" field="phone" sort={sort} onSort={toggleSort} />
                    <ColHeader label="Type" field="staffType" sort={sort} onSort={toggleSort} />
                    <th className="py-2.5 px-3 w-10" />
                  </>
                )}
              </tr>
              {/* Column search inputs */}
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {(mode === "provider" ? 7 : 8).toString().split("").map((_, i) => (
                  <td key={i} className="py-1 px-3">
                    {i < (mode === "provider" ? 6 : 7) && (
                      <input placeholder="Search..." className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none" />
                    )}
                  </td>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={mode === "provider" ? 7 : 8} className="py-12 text-center text-slate-400 text-sm">
                    No {mode === "provider" ? "providers" : "staff members"} found
                  </td>
                </tr>
              ) : paginated.map(item => (
                mode === "provider" ? (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 group">
                    <td className="py-3 px-3">
                      <Link href={`/provider-staff/${item.id}`} className="flex items-center gap-2.5 hover:underline">
                        <Avatar first={item.firstName} last={item.lastName} id={item.id} />
                        <span className="font-medium text-slate-800 dark:text-slate-200">{(item as Provider).displayName}</span>
                      </Link>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-xs">{(item as Provider).providerType}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-mono text-xs truncate max-w-[180px]">{item.email}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-xs">{item.phone || "—"}</td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {(item as Provider).clinicAccess.slice(0, 2).map(id => (
                          <span key={id} className="px-1.5 py-0.5 rounded text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
                            {clinicName(id).split(" ").slice(0, 2).join(" ")}
                          </span>
                        ))}
                        {(item as Provider).clinicAccess.length > 2 && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-500">+{(item as Provider).clinicAccess.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                        item.isActive ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-3 relative">
                      <button onClick={() => setOpenActions(openActions === item.id ? null : item.id)}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {openActions === item.id && (
                        <div className="absolute right-8 top-2 z-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 w-32">
                          <Link href={`/provider-staff/${item.id}`} className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                            <Eye className="w-3.5 h-3.5" /> View
                          </Link>
                          <Link href={`/provider-staff/${item.id}?edit=true`} className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </Link>
                          <button className="flex items-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 w-full text-left">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 group">
                    <td className="py-3 px-3 font-mono text-xs text-slate-400">{item.id.replace("s", "").padStart(8, "0")}-{item.id}...</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar first={item.firstName} last={item.lastName} id={item.id} />
                        <span className="font-medium text-blue-600 dark:text-blue-400">{(item as StaffMember).displayName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{item.firstName}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{item.lastName}</td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-500 dark:text-slate-400 truncate max-w-[160px]">{item.email}</td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-xs">{item.phone || "—"}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">{(item as StaffMember).staffType}</span>
                    </td>
                    <td className="py-3 px-3">
                      <button onClick={() => setOpenActions(openActions === item.id ? null : item.id)}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <span>{Math.min((page - 1) * PER_PAGE + 1, totalItems)}–{Math.min(page * PER_PAGE, totalItems)} of {totalItems} results • page {page} of {Math.max(1, totalPages)}</span>
          <div className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">Previous</button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
