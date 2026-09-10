"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Video, Phone, MapPin, ChevronDown, MoreHorizontal } from "lucide-react";
import { CC_APPOINTMENTS, type AppointmentStatus, type CcAppointment } from "@/data/cc-appointments";
import { CC_PATIENTS } from "@/data/cc-patients";
import { PROVIDERS } from "@/data/providers";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  confirmed: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  completed: "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700",
  "no-show": "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
  waitlisted: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  requested: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  cancelled: "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700",
  arrived: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  "in-session": "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800",
};

function fmt12(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

const MODE_ICON = { telehealth: Video, phone: Phone, "in-person": MapPin };

export default function ListView({ onNewAppt }: { onNewAppt?: () => void }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "upcoming">("all");
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  const today = new Date().toISOString().split("T")[0];
  const weekEnd = (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().split("T")[0]; })();

  const filtered = useMemo(() => {
    let list = CC_APPOINTMENTS.filter(a => !["waitlisted", "requested"].includes(a.status));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(a => {
        const pat = CC_PATIENTS.find(p => p.id === a.patientId);
        const prov = PROVIDERS.find(p => p.id === a.providerId);
        return pat?.displayName.toLowerCase().includes(q) || pat?.mrn.toLowerCase().includes(q) || prov?.displayName.toLowerCase().includes(q) || a.visitType.toLowerCase().includes(q);
      });
    }
    if (statusFilter !== "all") list = list.filter(a => a.status === statusFilter);
    if (dateFilter === "today") list = list.filter(a => a.date === today);
    else if (dateFilter === "week") list = list.filter(a => a.date >= today && a.date <= weekEnd);
    else if (dateFilter === "upcoming") list = list.filter(a => a.date >= today);
    return list.sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
  }, [search, statusFilter, dateFilter, today, weekEnd]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Search by patient, provider…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>

        {/* Status filter */}
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="all">All Statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="no-show">No Show</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Date filter */}
        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          {(["all", "today", "week", "upcoming"] as const).map(f => (
            <button key={f} onClick={() => { setDateFilter(f); setPage(1); }}
              className={cn("px-3 py-2 text-xs font-medium capitalize transition-colors",
                dateFilter === f ? "bg-teal-600 text-white" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800")}>
              {f === "week" ? "This Week" : f === "upcoming" ? "Upcoming" : f}
            </button>
          ))}
        </div>

        <div className="ml-auto text-xs text-slate-500">{filtered.length} appointments</div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900/90 z-10 border-b border-slate-200 dark:border-slate-800">
            <tr>
              {["Patient", "Provider", "Date & Time", "Visit Type", "Mode", "Status", ""].map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginated.map(a => {
              const patient = CC_PATIENTS.find(p => p.id === a.patientId);
              const provider = PROVIDERS.find(p => p.id === a.providerId);
              const ModeIcon = MODE_ICON[a.mode];
              return (
                <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400 flex-shrink-0">
                        {patient?.firstName[0]}{patient?.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{patient?.displayName}</p>
                        <p className="text-xs text-slate-500">{patient?.mrn}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: provider?.color }} />
                      <span className="text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{provider?.displayName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <p className="text-slate-800 dark:text-slate-200 font-medium">{new Date(a.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                    <p className="text-xs text-slate-500">{fmt12(a.startTime)} – {fmt12(a.endTime)}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{a.visitType}</td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                      <ModeIcon className="w-3.5 h-3.5" />
                      {a.mode === "in-person" ? "In-Person" : a.mode === "telehealth" ? "Telehealth" : "Phone"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium border capitalize", STATUS_STYLES[a.status])}>
                      {a.status.replace("-", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500 dark:text-slate-400 text-sm">No appointments found</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <p className="text-xs text-slate-500">{(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</p>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">
              <ChevronDown className="w-4 h-4 rotate-90" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={cn("w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium", p === page ? "bg-teal-600 text-white" : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800")}>
                {p}
              </button>
            ))}
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800">
              <ChevronDown className="w-4 h-4 -rotate-90" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
