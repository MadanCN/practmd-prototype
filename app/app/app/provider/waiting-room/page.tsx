"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock, Video, Phone, MapPin, AlertCircle, CheckCircle2,
  UserCheck, Loader2, RefreshCw, MessageSquare, FileText, Stethoscope, LogOut,
} from "lucide-react";
import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import { buildWaitingRoom, type WrEntry, type WrStatus } from "@/lib/provider-schedule";
import { CC_APPOINTMENTS } from "@/data/cc-appointments";
import { useEncounterStore, markCalled, startSession, checkOutPatient } from "@/lib/encounter-store";
import { cn } from "@/lib/utils";

const CURRENT_PROVIDER_ID = "p1";

const MODE_CFG = {
  "in-person": { icon: MapPin, label: "In Person", cls: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400" },
  telehealth:  { icon: Video,  label: "Telehealth", cls: "text-brand-600 bg-brand-50 dark:bg-brand-950/30 dark:text-brand-400" },
  phone:       { icon: Phone,  label: "Phone", cls: "text-teal-600 bg-teal-50 dark:bg-teal-950/30 dark:text-teal-400" },
};

const STATUS_CFG: Record<WrStatus, { label: string; cls: string; dot: string }> = {
  waiting:             { label: "Waiting",          cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400", dot: "bg-amber-400 animate-pulse" },
  called:              { label: "Called In",         cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",   dot: "bg-blue-500" },
  "with-provider":     { label: "With Provider",     cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400", dot: "bg-emerald-500" },
  "telehealth-waiting":{ label: "In Virtual Lobby", cls: "bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400", dot: "bg-brand-500 animate-pulse" },
};

function fmt12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

type ModeFilter = "all" | "in-person" | "telehealth" | "phone";

export default function WaitingRoomPage() {
  const router = useRouter();
  useEncounterStore(); // subscribe so this page re-renders on call-in / session / check-out
  const entries = buildWaitingRoom(CURRENT_PROVIDER_ID); // re-derived fresh from the store on every render
  const [refreshing, setRefreshing] = useState(false);
  const [calling, setCalling] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<ModeFilter>("all");
  const [highlightId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("appt");
  });
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Deep-link support: /provider/waiting-room?appt=<id> scrolls to that entry.
  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => {
      cardRefs.current[highlightId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    return () => clearTimeout(t);
  }, [highlightId]);

  function refresh() {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); }, 1200);
  }

  function callIn(id: string) {
    setCalling(id);
    setTimeout(() => {
      markCalled(id);
      setCalling(null);
    }, 800);
  }

  function startPatientSession(appointmentId: string) {
    const appt = CC_APPOINTMENTS.find((a) => a.id === appointmentId);
    if (!appt) return;
    const { noteId } = startSession(appt);
    router.push(`/provider/encounters/${noteId}`);
  }

  const filteredEntries = activeMode === "all" ? entries : entries.filter(e => e.mode === activeMode);
  const waiting = filteredEntries.filter(e => e.status === "waiting" || e.status === "telehealth-waiting");
  const inProgress = filteredEntries.filter(e => e.status === "with-provider" || e.status === "called");

  const stats = [
    { label: "In Waiting Room", value: waiting.length, cls: "text-amber-600" },
    { label: "With Provider", value: inProgress.length, cls: "text-emerald-600" },
    { label: "Avg Wait", value: waiting.length > 0 ? `${Math.round(waiting.reduce((s, e) => s + e.waitMinutes, 0) / waiting.length)}m` : "0m", cls: "text-blue-600" },
    { label: "Checked In", value: entries.length, cls: "text-slate-600 dark:text-slate-400" },
  ];

  const modeLabelMap: Record<ModeFilter, string> = {
    all: "All",
    "in-person": "In-Person Only",
    telehealth: "Telehealth Only",
    phone: "Phone Only",
  };

  return (
    <ProviderLayout>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Waiting Room</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Dr. Sarah Mitchell · {activeMode === "all" ? "All patients" : `Showing: ${modeLabelMap[activeMode]}`}
          </p>
        </div>
        <button onClick={refresh}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3" data-tour="wr-stats">
        {stats.map(s => (
          <div key={s.label} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 text-center">
            <p className={cn("text-2xl font-bold", s.cls)}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800" data-tour="wr-tabs">
        {[
          { id: "all" as ModeFilter, label: "All", count: entries.length },
          { id: "in-person" as ModeFilter, label: "In Person", count: entries.filter(e => e.mode === "in-person").length },
          { id: "telehealth" as ModeFilter, label: "Telehealth", count: entries.filter(e => e.mode === "telehealth").length },
          { id: "phone" as ModeFilter, label: "Phone", count: entries.filter(e => e.mode === "phone").length },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveMode(tab.id)}
            className={cn("flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeMode === tab.id ? "border-brand-600 text-brand-600 dark:text-brand-400" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300")}>
            {tab.label}
            {tab.count > 0 && <span className={cn("text-xs px-1.5 py-0.5 rounded-full font-semibold", activeMode === tab.id ? "bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* In Progress */}
      {inProgress.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Currently With Provider</p>
          {inProgress.map(e => (
            <PatientCard key={e.appointmentId} entry={e} onCall={() => callIn(e.appointmentId)} calling={calling === e.appointmentId}
              onJoin={() => router.push(`/provider/telehealth/${e.appointmentId}`)}
              onStartSession={() => startPatientSession(e.appointmentId)}
              onCheckOut={() => checkOutPatient(e.appointmentId)}
              highlighted={e.appointmentId === highlightId}
              cardRef={(el) => { cardRefs.current[e.appointmentId] = el; }} />
          ))}
        </div>
      )}

      {/* Waiting */}
      {waiting.length > 0 ? (
        <div className="space-y-3" data-tour="wr-list">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Waiting</p>
          {waiting.map(e => (
            <PatientCard key={e.appointmentId} entry={e} onCall={() => callIn(e.appointmentId)} calling={calling === e.appointmentId}
              onJoin={() => router.push(`/provider/telehealth/${e.appointmentId}`)}
              onStartSession={() => startPatientSession(e.appointmentId)}
              onCheckOut={() => checkOutPatient(e.appointmentId)}
              highlighted={e.appointmentId === highlightId}
              cardRef={(el) => { cardRefs.current[e.appointmentId] = el; }} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12" data-tour="wr-list">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">Waiting room is clear</p>
          <p className="text-xs text-slate-400 mt-1">
            {activeMode === "all" ? "All patients have been seen or are with a provider" : `No ${modeLabelMap[activeMode].toLowerCase()} patients waiting`}
          </p>
        </div>
      )}
    </div>
    </ProviderLayout>
  );
}

function PatientCard({ entry, onCall, calling, onJoin, onStartSession, onCheckOut, highlighted, cardRef }: {
  entry: WrEntry;
  onCall: () => void;
  calling: boolean;
  onJoin: () => void;
  onStartSession: () => void;
  onCheckOut: () => void;
  highlighted?: boolean;
  cardRef?: (el: HTMLDivElement | null) => void;
}) {
  const modeCfg = MODE_CFG[entry.mode];
  const ModeIcon = modeCfg.icon;
  const statusCfg = STATUS_CFG[entry.status];
  const isTelehealth = entry.mode === "telehealth";
  const isPhone = entry.mode === "phone";

  return (
    <div ref={cardRef} className={cn(
      "rounded-2xl border bg-white dark:bg-slate-900/40 p-5 transition-shadow",
      highlighted ? "border-brand-400 dark:border-brand-600 ring-2 ring-brand-300 dark:ring-brand-700" : "border-slate-200 dark:border-slate-800"
    )}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
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
            {/* Larger/more prominent mode badge */}
            <span className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold", modeCfg.cls)}>
              <ModeIcon className="w-3.5 h-3.5" /> {modeCfg.label}
            </span>
            <span>{entry.visitType}</span>
            <span>· Scheduled {fmt12(entry.scheduledTime)}</span>
            {entry.waitMinutes > 0 && (
              <span className={cn("flex items-center gap-1", entry.waitMinutes > 15 ? "text-amber-500 font-medium" : "")}>
                <Clock className="w-3 h-3" />
                {entry.waitMinutes > 0 ? `${entry.waitMinutes}m wait` : "On time"}
              </span>
            )}
            {entry.room && <span className="text-slate-400">· {entry.room}</span>}
          </div>
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
          {entry.status === "with-provider" ? (
            isTelehealth ? (
              <button onClick={onJoin}
                className="flex items-center gap-2 px-4 py-2 rounded-xl practmd-gradient text-white text-xs font-semibold transition-colors">
                <Video className="w-3.5 h-3.5" /> Rejoin Call
              </button>
            ) : (
              <>
                <button onClick={onStartSession}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors">
                  <FileText className="w-3.5 h-3.5" /> Resume note
                </button>
                <button onClick={onCheckOut}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors">
                  <LogOut className="w-3.5 h-3.5" /> Check Out
                </button>
              </>
            )
          ) : isTelehealth ? (
            <button onClick={onJoin}
              className="flex items-center gap-2 px-4 py-2 rounded-xl practmd-gradient text-white text-xs font-semibold transition-colors">
              <Video className="w-3.5 h-3.5" /> Join Call
            </button>
          ) : isPhone && entry.status === "waiting" ? (
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors">
              <Phone className="w-3.5 h-3.5" /> Call Patient
            </button>
          ) : entry.status === "waiting" ? (
            <button onClick={onCall} disabled={calling}
              className="flex items-center gap-2 px-4 py-2 rounded-xl practmd-gradient disabled:opacity-70 text-white text-xs font-semibold transition-colors">
              {calling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
              Call In
            </button>
          ) : entry.status === "called" ? (
            <button onClick={onStartSession}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors">
              <Stethoscope className="w-3.5 h-3.5" /> Start Session
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
