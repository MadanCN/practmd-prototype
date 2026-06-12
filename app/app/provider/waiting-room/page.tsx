"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock, Video, Phone, MapPin, AlertCircle, CheckCircle2,
  UserCheck, Loader2, RefreshCw, MessageSquare, FileText,
} from "lucide-react";
import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import { CC_APPOINTMENTS } from "@/data/cc-appointments";
import { CC_PATIENTS } from "@/data/cc-patients";
import { cn } from "@/lib/utils";

const CURRENT_PROVIDER_ID = "p1";

type WrStatus = "waiting" | "called" | "with-provider" | "telehealth-waiting";

interface WrEntry {
  appointmentId: string;
  patientId: string;
  patientName: string;
  mrn: string;
  visitType: string;
  mode: "in-person" | "telehealth" | "phone";
  scheduledTime: string;
  arrivedAt: string;
  status: WrStatus;
  waitMinutes: number;
  room?: string;
  priority: "normal" | "urgent" | "crisis";
  insuranceStatus: "active" | "inactive" | "pending";
}

const PATIENT_MAP = Object.fromEntries(CC_PATIENTS.map(p => [p.id, p]));

function buildWaitingRoom(): WrEntry[] {
  const today = CC_APPOINTMENTS.filter(a =>
    a.providerId === CURRENT_PROVIDER_ID &&
    (a.status === "confirmed" || a.status === "arrived" || a.status === "in-session")
  );

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  return today.map((appt, i) => {
    const [h, m] = appt.startTime.split(":").map(Number);
    const schMins = h * 60 + m;
    const diff = nowMins - schMins;

    let status: WrStatus;
    if (appt.mode === "telehealth") status = "telehealth-waiting";
    else if (i === 0) status = "with-provider";
    else if (i === 1) status = "called";
    else status = "waiting";

    const patient = PATIENT_MAP[appt.patientId];

    const arrivedMinsAgo = Math.max(0, diff > 0 ? Math.min(diff, 15) : 5);
    const arriveTime = new Date(now.getTime() - arrivedMinsAgo * 60000);
    const arrivedAt = `${String(arriveTime.getHours()).padStart(2, "0")}:${String(arriveTime.getMinutes()).padStart(2, "0")}`;

    return {
      appointmentId: appt.id,
      patientId: appt.patientId,
      patientName: patient?.displayName ?? "Unknown",
      mrn: patient?.mrn ?? "",
      visitType: appt.visitType,
      mode: appt.mode,
      scheduledTime: appt.startTime,
      arrivedAt,
      status,
      waitMinutes: Math.max(0, diff > 0 ? diff : 0),
      room: appt.mode === "in-person" ? `Room ${i + 1}0${i + 1}` : undefined,
      priority: "normal",
      insuranceStatus: patient?.insuranceStatus ?? "active",
    };
  });
}

const MODE_CFG = {
  "in-person": { icon: MapPin, label: "In Person", cls: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400" },
  telehealth:  { icon: Video,  label: "Telehealth", cls: "text-violet-600 bg-violet-50 dark:bg-violet-950/30 dark:text-violet-400" },
  phone:       { icon: Phone,  label: "Phone", cls: "text-teal-600 bg-teal-50 dark:bg-teal-950/30 dark:text-teal-400" },
};

const STATUS_CFG: Record<WrStatus, { label: string; cls: string; dot: string }> = {
  waiting:            { label: "Waiting",          cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400", dot: "bg-amber-400 animate-pulse" },
  called:             { label: "Called In",         cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",   dot: "bg-blue-500" },
  "with-provider":    { label: "With Provider",     cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400", dot: "bg-emerald-500" },
  "telehealth-waiting":{ label: "In Virtual Lobby", cls: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400", dot: "bg-violet-500 animate-pulse" },
};

function fmt12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  return `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export default function WaitingRoomPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<WrEntry[]>(buildWaitingRoom);
  const [refreshing, setRefreshing] = useState(false);
  const [calling, setCalling] = useState<string | null>(null);

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

  const waiting = entries.filter(e => e.status === "waiting" || e.status === "telehealth-waiting");
  const inProgress = entries.filter(e => e.status === "with-provider" || e.status === "called");

  const stats = [
    { label: "In Waiting Room", value: waiting.length, cls: "text-amber-600" },
    { label: "With Provider", value: inProgress.length, cls: "text-emerald-600" },
    { label: "Avg Wait", value: waiting.length > 0 ? `${Math.round(waiting.reduce((s, e) => s + e.waitMinutes, 0) / waiting.length)}m` : "0m", cls: "text-blue-600" },
    { label: "Total Today", value: entries.length, cls: "text-slate-600 dark:text-slate-400" },
  ];

  return (
    <ProviderLayout>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Waiting Room</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Dr. Sarah Mitchell · Today&apos;s patients</p>
        </div>
        <button onClick={refresh}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
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

      {/* In Progress */}
      {inProgress.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Currently With Provider</p>
          {inProgress.map(e => <PatientCard key={e.appointmentId} entry={e} onCall={() => callIn(e.appointmentId)} calling={calling === e.appointmentId} onJoin={() => router.push(`/provider/telehealth/${e.appointmentId}`)} />)}
        </div>
      )}

      {/* Waiting */}
      {waiting.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Waiting</p>
          {waiting.map(e => <PatientCard key={e.appointmentId} entry={e} onCall={() => callIn(e.appointmentId)} calling={calling === e.appointmentId} onJoin={() => router.push(`/provider/telehealth/${e.appointmentId}`)} />)}
        </div>
      ) : (
        <div className="text-center py-12">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-500">Waiting room is clear</p>
          <p className="text-xs text-slate-400 mt-1">All patients have been seen or are with a provider</p>
        </div>
      )}
    </div>
    </ProviderLayout>
  );
}

function PatientCard({ entry, onCall, calling, onJoin }: {
  entry: WrEntry;
  onCall: () => void;
  calling: boolean;
  onJoin: () => void;
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
        <div className="w-11 h-11 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
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
            <span className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold", modeCfg.cls)}>
              <ModeIcon className="w-3 h-3" /> {modeCfg.label}
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
          {isTelehealth ? (
            <button onClick={onJoin}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors">
              <Video className="w-3.5 h-3.5" /> Join Call
            </button>
          ) : isPhone ? (
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors">
              <Phone className="w-3.5 h-3.5" /> Call Patient
            </button>
          ) : (
            entry.status === "waiting" && (
              <button onClick={onCall} disabled={calling}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-70 text-white text-xs font-semibold transition-colors">
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
