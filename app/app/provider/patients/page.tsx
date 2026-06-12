"use client";

import { useState } from "react";
import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import { CC_APPOINTMENTS } from "@/data/cc-appointments";
import { CC_PATIENTS } from "@/data/cc-patients";
import { Search, User, Calendar, Shield, Phone, Mail, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const CURRENT_PROVIDER_ID = "p1";

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  inactive: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
  pending: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
};

export default function ProviderPatientsPage() {
  const [search, setSearch] = useState("");

  // Only patients who have at least one appointment with this provider
  const myAppts = CC_APPOINTMENTS.filter(a => a.providerId === CURRENT_PROVIDER_ID);
  const myPatientIds = [...new Set(myAppts.map(a => a.patientId))];
  const myPatients = CC_PATIENTS.filter(p => myPatientIds.includes(p.id));

  const filtered = myPatients.filter(p =>
    p.displayName.toLowerCase().includes(search.toLowerCase()) ||
    p.mrn.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  function getLastAppt(patientId: string) {
    const today = new Date().toISOString().split("T")[0];
    const past = myAppts
      .filter(a => a.patientId === patientId && a.date <= today && a.status === "completed")
      .sort((a, b) => b.date.localeCompare(a.date));
    return past[0] ?? null;
  }

  function getNextAppt(patientId: string) {
    const today = new Date().toISOString().split("T")[0];
    const upcoming = myAppts
      .filter(a => a.patientId === patientId && a.date >= today && a.status === "confirmed")
      .sort((a, b) => a.date.localeCompare(b.date));
    return upcoming[0] ?? null;
  }

  function fmtDate(iso: string) {
    return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function fmt12(t: string) {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  }

  return (
    <ProviderLayout>
      <div className="p-6">
        {/* Page header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">My Patients</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{myPatients.length} patients with scheduled appointments</p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 mb-4 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, MRN, email…"
            className="flex-1 bg-transparent text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 outline-none" />
        </div>

        {/* Patient table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Patient</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">MRN</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Insurance</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Last Visit</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">Next Appointment</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">No patients found.</td>
                </tr>
              ) : filtered.map(patient => {
                const lastAppt = getLastAppt(patient.id);
                const nextAppt = getNextAppt(patient.id);
                const age = calcAge(patient.dob);
                return (
                  <tr key={patient.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 text-xs font-bold shrink-0">
                          {patient.firstName[0]}{patient.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">{patient.displayName}</p>
                          <p className="text-xs text-slate-400">{patient.gender} · {age} yrs · {patient.dob}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-slate-600 dark:text-slate-400">{patient.mrn}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-700 dark:text-slate-300">{patient.insuranceProvider ?? "—"}</span>
                        {patient.insuranceStatus && (
                          <span className={cn("inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded capitalize w-fit", STATUS_STYLES[patient.insuranceStatus])}>
                            {patient.insuranceStatus}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {lastAppt ? (
                        <div>
                          <p className="text-xs text-slate-700 dark:text-slate-300">{fmtDate(lastAppt.date)}</p>
                          <p className="text-[10px] text-slate-400">{lastAppt.visitType}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No visits yet</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {nextAppt ? (
                        <div>
                          <p className="text-xs text-slate-700 dark:text-slate-300">{fmtDate(nextAppt.date)}</p>
                          <p className="text-[10px] text-slate-400">{fmt12(nextAppt.startTime)} · {nextAppt.visitType}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">None scheduled</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </ProviderLayout>
  );
}
