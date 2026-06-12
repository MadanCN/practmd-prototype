"use client";

import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import { CC_APPOINTMENTS } from "@/data/cc-appointments";
import { CC_PATIENTS } from "@/data/cc-patients";
import { PROVIDERS } from "@/data/providers";
import { PROVIDER_LEAVE_REQUESTS } from "@/data/provider-leaves";
import {
  CalendarDays, Users, Clock, CheckCircle, AlertCircle,
  Video, Phone, ArrowRight, CalendarRange,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const CURRENT_PROVIDER_ID = "p1";

function fmt12(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

const VISIT_TYPE_COLOR: Record<string, string> = {
  "Initial Consultation": "#0ea5e9",
  "Follow-Up": "#10b981",
  "Medication Check": "#8b5cf6",
  "Therapy Session": "#f59e0b",
  "Group Session": "#ef4444",
  "Telehealth Consultation": "#06b6d4",
};

export default function ProviderHomePage() {
  const provider = PROVIDERS.find(p => p.id === CURRENT_PROVIDER_ID)!;
  const today = new Date().toISOString().split("T")[0];

  const myAppts = CC_APPOINTMENTS.filter(a => a.providerId === CURRENT_PROVIDER_ID);
  const todayAppts = myAppts
    .filter(a => a.date === today && ["confirmed", "arrived", "in-session"].includes(a.status))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const myPatientIds = [...new Set(myAppts.map(a => a.patientId))];
  const myPatients = CC_PATIENTS.filter(p => myPatientIds.includes(p.id));

  const pendingLeave = PROVIDER_LEAVE_REQUESTS.filter(
    r => r.providerId === CURRENT_PROVIDER_ID && r.status === "pending"
  );

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const upcomingAppts = myAppts
    .filter(a => {
      const apptDate = new Date(a.date + "T" + a.startTime);
      return apptDate > now && ["confirmed"].includes(a.status);
    })
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
    .slice(0, 5);

  return (
    <ProviderLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {greeting}, {provider.firstName}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {provider.credentials} · {provider.providerType} · Penfield Psychiatry
          </p>
        </div>

        {/* Pending leave alert */}
        {pendingLeave.length > 0 && (
          <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>You have <strong>{pendingLeave.length}</strong> leave request{pendingLeave.length > 1 ? "s" : ""} pending admin approval.</span>
            <Link href="/provider/availability" className="ml-auto text-xs font-semibold underline underline-offset-2">View →</Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Today's Appointments", value: todayAppts.length, icon: CalendarDays, color: "violet" },
            { label: "My Patients", value: myPatientIds.length, icon: Users, color: "blue" },
            { label: "Upcoming (7 days)", value: myAppts.filter(a => {
              const dt = new Date(a.date);
              const diff = (dt.getTime() - now.getTime()) / 86400000;
              return diff >= 0 && diff <= 7 && a.status === "confirmed";
            }).length, icon: Clock, color: "emerald" },
            { label: "Completed (month)", value: myAppts.filter(a => a.status === "completed").length, icon: CheckCircle, color: "slate" },
          ].map(stat => {
            const Icon = stat.icon;
            const colors: Record<string, string> = {
              violet: "bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400",
              blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
              emerald: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
              slate: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
            };
            return (
              <div key={stat.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", colors[stat.color])}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-5 gap-5">
          {/* Today's schedule */}
          <div className="col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Today&apos;s Schedule</h2>
              <Link href="/provider/appointments" className="text-xs text-violet-600 dark:text-violet-400 font-medium flex items-center gap-1 hover:underline">
                Full calendar <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {todayAppts.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-slate-400">No appointments scheduled for today.</div>
              ) : todayAppts.map(appt => {
                const patient = CC_PATIENTS.find(p => p.id === appt.patientId);
                const vColor = VISIT_TYPE_COLOR[appt.visitType] ?? "#64748b";
                const ModeIcon = appt.mode === "telehealth" ? Video : appt.mode === "phone" ? Phone : CheckCircle;
                return (
                  <div key={appt.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: vColor }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{patient?.displayName}</p>
                      <p className="text-xs text-slate-500 truncate">{appt.visitType}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{fmt12(appt.startTime)}</p>
                        <div className="flex items-center gap-1 justify-end mt-0.5">
                          <ModeIcon className="w-3 h-3 text-slate-400" />
                          <span className="text-[10px] text-slate-400">{appt.mode}</span>
                        </div>
                      </div>
                      {appt.mode === "telehealth" && (
                        <Link href={`/provider/telehealth/${appt.id}`}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold transition-colors">
                          <Video className="w-3 h-3" /> Join
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming + Quick links */}
          <div className="col-span-2 space-y-4">
            {/* Upcoming appointments */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Upcoming</h2>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {upcomingAppts.length === 0 ? (
                  <p className="px-4 py-5 text-xs text-slate-400 text-center">No upcoming appointments.</p>
                ) : upcomingAppts.map(appt => {
                  const patient = CC_PATIENTS.find(p => p.id === appt.patientId);
                  const apptDate = new Date(appt.date + "T12:00:00");
                  const isToday = appt.date === today;
                  const label = isToday ? "Today" : apptDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                  return (
                    <div key={appt.id} className="flex items-center gap-2.5 px-4 py-2.5">
                      <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/30 flex flex-col items-center justify-center shrink-0">
                        <CalendarDays className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{patient?.displayName}</p>
                        <p className="text-[10px] text-slate-400">{label} · {fmt12(appt.startTime)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Quick Links</h2>
              <div className="space-y-1.5">
                {[
                  { label: "My Patients", href: "/provider/patients", icon: Users },
                  { label: "My Availability", href: "/provider/availability", icon: CalendarRange },
                  { label: "Messages", href: "/provider/messages", icon: Clock },
                ].map(link => {
                  const Icon = link.icon;
                  return (
                    <Link key={link.href} href={link.href}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                      <Icon className="w-4 h-4 text-slate-400" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProviderLayout>
  );
}
