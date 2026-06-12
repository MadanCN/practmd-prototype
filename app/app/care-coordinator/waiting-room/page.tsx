"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock, Video, Phone, MapPin, AlertCircle, CheckCircle2,
  UserCheck, Loader2, RefreshCw, MessageSquare, FileText, ChevronDown,
} from "lucide-react";
import CcLayout from "@/components/care-coordinator/layout/CcLayout";
import { CC_APPOINTMENTS } from "@/data/cc-appointments";
import { CC_PATIENTS } from "@/data/cc-patients";
import { PROVIDERS } from "@/data/providers";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type WrStatus = "waiting" | "called" | "with-provider" | "telehealth-waiting";

interface WrEntry {
  appointmentId: string;
  patientId: string;
  patientName: string;
  mrn: string;
  visitType: string;
  mode: "in-person" | "telehealth" | "phone";
  providerId: string;
  providerName: string;
  scheduledTime: string;
  arrivedAt: string;
  status: WrStatus;
  waitMinutes: number;
  room?: string;
  insuranceStatus: "active" | "inactive" | "pending";
}

// ── Data builders ─────────────────────────────────────────────────────────────

const PATIENT_MAP = Object.fromEntries(CC_PATIENTS.map(p => [p.id, p]));
const PROVIDER_MAP = Object.fromEntries(PROVIDERS.map(p => [p.id, p]));

function buildWaitingRoom(): WrEntry[] {
  const relevant = CC_APPOINTMENTS.filter(a =>
    a.status === "confirmed" || a.status === "arrived" || a.status === "in-session"
  );

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  // Group by provider to simulate per-provider ordering
  const byProvider: Record<string, typeof relevant> = {};
  for (const appt of relevant) {
    if (!byProvider[appt.providerId]) byProvider[appt.providerId] = [];
    byProvider[appt.providerId].push(appt);
  }

  const entries: WrEntry[] = [];

  for (const [providerId, appts] of Object.entries(byProvider)) {
    appts.forEach((appt, i) => {
      const [h, m] = appt.startTime.split(":").map(Number);
      const schMins = h * 60 + m;
      const diff = nowMins - schMins;

      let status: WrStatus;
      if (appt.mode === "telehealth") status = "telehealth-waiting";
      else if (i === 0) status = "with-provider";
      else if (i === 1) status = "called";
      else status = "waiting";

      const patient = PATIENT_MAP[appt.patientId];
      const provider = PROVIDER_MAP[providerId];

      const arrivedMinsAgo = Math.max(0, diff > 0 ? Math.min(diff, 15) : 5);
      const arriveTime = new Date(now.getTime() - arrivedMinsAgo * 60000);
      const arrivedAt = `${String(arriveTime.getHours()).padStart(2, "0")}:${String(arriveTime.getMinutes()).padStart(2, "0")}`;

      entries.push({
        appointmentId: appt.id,
        patientId: appt.patientId,
        patientName: patient?.displayName ?? "Unknown",
        mrn: patient?.mrn ?? "",
        visitType: appt.visitType,
        mode: appt.mode,
        providerId,
        providerName: provider?.displayName ?? "Unknown Provider",
        scheduledTime: appt.startTime,
        arrivedAt,
        status,
        waitMinutes: Math.max(0, diff > 0 ? diff : 0),
        room: appt.mode === "in-person" ? `Room ${(i + 1) * 101}` : undefined,
        insuranceStatus: patient?.insuranceStatus ?? "active",
      });
    });
  }

  return entries;
}

// ── Config ────────────────────────────────────────────────────────────────────

const MODE_CFG = {
  "in-person": { icon: MapPin, label: "In Person", cls: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400" },
  telehealth:  { icon: Video,  label: "Telehealth", cls: "text-violet-600 bg-violet-50 dark:bg-violet-950/30 dark:text-violet-400" },
  phone:       { icon: Phone,  label: "Phone", cls: "text-teal-600 bg-teal-50 dark:bg-teal-950/30 dark:text-teal-400" },
};

const STATUS_CFG: Record<WrStatus, { label: string; cls: string; dot: string }> = {
  waiting:             { label: "Waiting",          cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400", dot: "bg-amber-400 animate-pulse" },
  called:              { label: "Called In",         cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",   dot: "bg-blue-500" },
  "with-provider":     { label: "With Provider",     cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400", dot: "bg-emerald-500" },
  "telehealth-waiting":{ label: "In Virtual Lobby", cls: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400", dot: "bg-violet-500 animate-pulse" },
};

function fmt12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

type ModeFilter = "all" | "in-person" | "telehealth" | "phone";

// ── Component ─────────────────────────────────────────────────────────────────

export default function CcWaitingRoomPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<WrEntry[]>(buildWaitingRoom);
  const [refreshing, setRefreshing] = useState(false);
  const [calling, setCalling] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<ModeFilter>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);

  function refresh() {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); }, 1200);
  }

  function callIn(id: string) {
    setCalling(id);
    setTimeout(() => {
      setEntries(prev => prev.map(e => e.appointmentId === id ? { ...e, status: "called" } : e));
      setCalling(null);
    }, 800);
  }

  // Unique providers in current waiting room
  const presentProviders = [...new Map(entries.map(e => [e.providerId, e.providerName])).entries()];

  // Apply filters
  const filteredEntries = entries.filter(e => {
    if (activeMode !== "all" && e.mode !== activeMode) return false;
    if (providerFilter !== "all" && e.providerId !== providerFilter) return false;
    return true;
  });

  const waiting = filteredEntries.filter(e => e.status === "waiting" || e.status === "telehealth-waiting");
  const inProgress = filteredEntries.filter(e => e.status === "with-provider" || e.status === "called");

  const allWaiting = entries.filter(e => e.status === "waiting" || e.status === "telehealth-waiting");
  const allInProgress = entries.filter(e => e.status === "with-provider" || e.status === "called");
  const avgWait = allWaiting.length > 0
    ? `${Math.round(allWaiting.reduce((s, e) => s + e.waitMinutes, 0) / allWaiting.length)}m`
    : "0m";

  const stats = [
    { label: "Total Waiting", value: allWaiting.length, cls: "text-amber-600" },
    { label: "With Provider", value: allInProgress.length, cls: "text-emerald-600" },
    { label: "Avg Wait", value: avgWait, cls: "text-blue-600" },
    { label: "Total Today", value: entries.length, cls: "text-slate-600 dark:text-slate-400" },
  ];

  const selectedProviderName = providerFilter === "all"
    ? "All Providers"
    : presentProviders.find(([id]) => id === providerFilter)?.[1] ?? "All Providers";

  return (
    <CcLayout>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Waiting Room</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">All providers · Today&apos;s patients</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Provider filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setProviderDropdownOpen(o => !o)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-slate-900"
            >
              {selectedProviderName}
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {providerDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-20 overflow-hidden">
                {[{ id: "all", name: "All Providers" }, ...presentProviders.map(([id, name]) => ({ id, name }))].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setProviderFilter(opt.id); setProviderDropdownOpen(false); }}
                    className={cn("w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                      providerFilter === opt.id ? "text-teal-600 font-semibold" : "text-slate-700 dark:text-slate-300")}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={refresh}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 text-center">
            <p className={cn("text-2xl font-bold", s.cls)}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {[
          { id: "all" as ModeFilter, label: "All", count: entries.length },
          { id: "in-person" as ModeFilter, label: "In Person", count: entries.filter(e => e.mode === "in-person").length },
          { id: "telehealth" as ModeFilter, label: "Telehealth", count: entries.filter(e => e.mode === "telehealth").length },
          { id: "phone" as ModeFilter, label: "Phone", count: entries.filter(e => e.mode === "phone").length },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveMode(tab.id)}
            className={cn("flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeMode === tab.id ? "border-teal-600 text-teal-600 dark:text-teal-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}>
            {tab.label}
            {tab.count > 0 && <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-semibold", activeMode === tab.id ? "bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* In Progress */}
      {inProgress.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Currently With Provider</p>
          {inProgress.map(e => <PatientCard key={e.appointmentId} entry={e} onCall={() => callIn(e.appointmentId)} calling={calling === e.appointmentId} onJoin={() => router.push(`/provider/telehealth/${e.appointmentId}`)} showProvider />)}
        </div>
      )}

      {/* Waiting */}
      {waiting.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Waiting</p>
          {waiting.map(e => <PatientCard key={e.appointmentId} entry={e} onCall={() => callIn(e.appointmentId)} calling={calling === e.appointmentId} onJoin={() => router.push(`/provider/telehealth/${e.appointmentId}`)} showProvider />)}
        </div>
      ) : (
        <div className="text-center py-12">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">Waiting room is clear</p>
          <p className="text-xs text-slate-400 mt-1">All patients have been seen or are with a provider</p>
        </div>
      )}
    </div>
    </CcLayout>
  );
}

// ── Patient Card ──────────────────────────────────────────────────────────────

function PatientCard({ entry, onCall, calling, onJoin, showProvider }: {
  entry: WrEntry;
  onCall: () => void;
  calling: boolean;
  onJoin: () => void;
  showProvider?: boolean;
}) {
  const modeCfg = MODE_CFG[entry.mode];
  const ModeIcon = modeCfg.icon;
  const statusCfg = STATUS_CFG[entry.status];
  const isTelehealth = entry.mode === "telehealth";
  const isPhone = entry.mode === "phone";

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-5">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {entry.patientName.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{entry.patientName}</p>
            <span className="text-[10px] text-slate-400">{entry.mrn}</span>
            <span className={cn("flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full", statusCfg.cls)}>
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusCfg.dot)} />
              {statusCfg.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
            <span className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold", modeCfg.cls)}>
              <ModeIcon className="w-3.5 h-3.5" /> {modeCfg.label}
            </span>
            <span>{entry.visitType}</span>
            <span>· Scheduled {fmt12(entry.scheduledTime)}</span>
            {entry.waitMinutes > 0 && (
              <span className={cn("flex items-center gap-1", entry.waitMinutes > 15 ? "text-amber-500 font-medium" : "")}>
                <Clock className="w-3 h-3" />
                {entry.waitMinutes}m wait
              </span>
            )}
            {entry.room && <span className="text-slate-400">· {entry.room}</span>}
          </div>
          {showProvider && (
            <p className="text-xs text-slate-500 mt-1">
              Provider: <span className="font-medium text-slate-700 dark:text-slate-300">{entry.providerName}</span>
            </p>
          )}
          {entry.insuranceStatus !== "active" && (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-3 h-3" />
              Insurance {entry.insuranceStatus} — verify before visit
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors" title="View chart">
            <FileText className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors" title="Message patient">
            <MessageSquare className="w-4 h-4" />
          </button>
          {isTelehealth ? (
            <button onClick={onJoin}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors">
              <Video className="w-3.5 h-3.5" /> Join Call
            </button>
          ) : isPhone ? (
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors">
              <Phone className="w-3.5 h-3.5" /> Call Patient
            </button>
          ) : (
            entry.status === "waiting" && (
              <button onClick={onCall} disabled={calling}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-70 text-white text-xs font-semibold transition-colors">
                {calling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                Call In
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
