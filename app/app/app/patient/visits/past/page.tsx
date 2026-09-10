"use client";

import Link from "next/link";
import {
  Video, MapPin, Phone, Clock, CheckCircle2, FileText, ChevronDown, ChevronUp, DollarSign,
} from "lucide-react";
import { PORTAL_APPOINTMENTS } from "@/data/patient-portal";
import { cn } from "@/lib/utils";
import { useState } from "react";

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" });
}

const today = new Date().toISOString().split("T")[0];
const past = PORTAL_APPOINTMENTS
  .filter(a => a.date < today || a.status === "completed")
  .sort((a, b) => b.date.localeCompare(a.date));

const MODE_ICON = { telehealth: Video, "in-person": MapPin, phone: Phone };

function PastVisitCard({ appt }: { appt: typeof past[0] }) {
  const [expanded, setExpanded] = useState(false);
  const ModeIcon = MODE_ICON[appt.mode];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden">
      <button onClick={() => setExpanded(e => !e)} className="w-full text-left">
        <div className="flex items-center gap-4 p-5">
          <div className="w-12 rounded-xl flex flex-col items-center py-2 bg-slate-100 dark:bg-slate-800 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {new Date(appt.date + "T12:00:00").toLocaleDateString("en-US", { month: "short" })}
            </span>
            <span className="text-xl font-bold text-slate-700 dark:text-slate-300">
              {new Date(appt.date + "T12:00:00").getDate()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{appt.visitType}</p>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                Completed
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{appt.providerName} · {fmt12(appt.startTime)}</p>
            <div className="flex items-center gap-2 mt-1">
              <ModeIcon className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-400">{appt.mode === "telehealth" ? "Telehealth" : appt.mode === "in-person" ? "In Person" : "Phone"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-0 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs text-slate-500 mb-1">Date & Time</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{fmtDate(appt.date)}</p>
              <p className="text-xs text-slate-500">{fmt12(appt.startTime)} – {fmt12(appt.endTime)}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <p className="text-xs text-slate-500 mb-1">Location</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{appt.clinicName}</p>
              <p className="text-xs text-slate-500">{appt.mode === "telehealth" ? "Virtual" : appt.clinicAddress}</p>
            </div>
          </div>
          {appt.summary && (
            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Visit Summary</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{appt.summary}</p>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <DollarSign className="w-3.5 h-3.5" />
            Co-pay: ${appt.copay} — {appt.copayPaid ? "Paid" : "Outstanding"}
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
              <FileText className="w-3.5 h-3.5" /> View Documents
            </button>
            <Link href="/patient/visits/schedule"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium">
              Book Follow-Up
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PastVisitsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">My Visits</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{past.length} past visit{past.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-fit">
        {["Upcoming", "Past Visits"].map((tab, i) => (
          <Link key={tab}
            href={i === 0 ? "/patient/visits" : "/patient/visits/past"}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              i === 1
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            )}>
            {tab}
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {past.map(appt => <PastVisitCard key={appt.id} appt={appt} />)}
        {past.length === 0 && (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">No past visits found.</div>
        )}
      </div>
    </div>
  );
}
