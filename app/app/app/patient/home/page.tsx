"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays, Video, MapPin, Clock, ChevronRight, Bell,
  Heart, FileText, MessageSquare, AlertTriangle, CheckCircle2,
  PlusCircle, Shield, Pill,
} from "lucide-react";
import { PORTAL_APPOINTMENTS, MESSAGE_THREADS, PATIENT_ALLERGIES, PATIENT_FORMS } from "@/data/patient-portal";
import { cn } from "@/lib/utils";

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}
function fmtDateShort(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function isToday(iso: string) {
  return iso === new Date().toISOString().split("T")[0];
}
function isTomorrow(iso: string) {
  const tom = new Date(); tom.setDate(tom.getDate() + 1);
  return iso === tom.toISOString().split("T")[0];
}

const today = new Date().toISOString().split("T")[0];

const upcoming = PORTAL_APPOINTMENTS
  .filter(a => a.date >= today && ["confirmed", "arrived", "in-session"].includes(a.status))
  .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

const pendingForms = PATIENT_FORMS.filter(f => f.status === "pending");
const unreadMessages = MESSAGE_THREADS.reduce((s, t) => s + t.unreadCount, 0);
const criticalAllergies = PATIENT_ALLERGIES.filter(a => a.status === "active" && (a.severity === "severe" || a.severity === "life-threatening"));

const MODE_ICON = {
  "telehealth": Video,
  "in-person": MapPin,
  "phone": Clock,
};

function AppointmentCard({ appt }: { appt: typeof upcoming[0] }) {
  const ModeIcon = MODE_ICON[appt.mode];
  const isTelehealthAppt = appt.mode === "telehealth";
  const todayAppt = isToday(appt.date);
  const tomorrowAppt = isTomorrow(appt.date);

  return (
    <div className={cn(
      "rounded-2xl border p-5 transition-all",
      todayAppt
        ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20"
        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {todayAppt && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500 text-white">Today</span>
            )}
            {tomorrowAppt && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500 text-white">Tomorrow</span>
            )}
            <span className="text-xs text-slate-500 dark:text-slate-400">{!todayAppt && !tomorrowAppt ? fmtDate(appt.date) : ""}</span>
          </div>
          <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{appt.visitType}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">{appt.providerName} · {appt.providerCredentials}</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              {todayAppt && !tomorrowAppt ? "" : fmtDateShort(appt.date) + " · "}{fmt12(appt.startTime)} — {fmt12(appt.endTime)}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <ModeIcon className="w-3.5 h-3.5" />
              {appt.mode === "telehealth" ? "Telehealth" : appt.mode === "in-person" ? "In Person" : "Phone Call"}
            </div>
          </div>
          {!isTelehealthAppt && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3 h-3 shrink-0" />{appt.clinicAddress}
            </p>
          )}
        </div>
        {todayAppt && (
          <div className="shrink-0 w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
        )}
      </div>
      {isTelehealthAppt && (
        <div className="mt-4 flex items-center gap-2">
          <Link href={`/patient/telehealth/${appt.id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors">
            <Video className="w-4 h-4" />
            Join Telehealth Session
          </Link>
          <Link href="/patient/telehealth/system-check"
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            System Check
          </Link>
        </div>
      )}
      {!isTelehealthAppt && (
        <div className="mt-4 flex items-center gap-2">
          <Link href="/patient/visits"
            className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium">
            View details <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

export default function PatientHomePage() {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Good morning, James 👋</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Here's your health summary for today.</p>
        </div>
        <Link href="/patient/visits/schedule"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shrink-0">
          <PlusCircle className="w-4 h-4" />
          Book Appointment
        </Link>
      </div>

      {/* Alert banners */}
      {pendingForms.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {pendingForms.length} form{pendingForms.length > 1 ? "s" : ""} pending completion
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              {pendingForms.map(f => f.name).join(" · ")}
            </p>
          </div>
          <Link href="/patient/records/forms" className="shrink-0 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline">
            Complete now
          </Link>
        </div>
      )}

      {/* Upcoming appointments */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Upcoming Appointments</h2>
          <Link href="/patient/visits" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">View all</Link>
        </div>
        {upcoming.slice(0, 2).map(appt => (
          <AppointmentCard key={appt.id} appt={appt} />
        ))}
        {upcoming.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center">
            <CalendarDays className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No upcoming appointments</p>
            <Link href="/patient/visits/schedule" className="mt-3 inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
              <PlusCircle className="w-3.5 h-3.5" /> Schedule one now
            </Link>
          </div>
        )}
      </div>

      {/* Quick action grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Messages", icon: MessageSquare, href: "/patient/messages", badge: unreadMessages, color: "blue" },
          { label: "My Forms", icon: FileText, href: "/patient/records/forms", badge: pendingForms.length, color: "amber" },
          { label: "Insurance", icon: Shield, href: "/patient/records/insurance", badge: 0, color: "violet" },
          { label: "Health Profile", icon: Heart, href: "/patient/records/health-profile", badge: 0, color: "rose" },
        ].map(item => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}
              className="relative flex flex-col items-center gap-2 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm transition-all text-center group">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/40 transition-colors">
                <Icon className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100">{item.label}</span>
              {item.badge > 0 && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">{item.badge}</span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Health summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Allergies summary */}
        <div className="rounded-2xl border border-red-100 dark:border-red-900/30 bg-red-50/40 dark:bg-red-950/10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Critical Allergies</h3>
            <Link href="/patient/records/allergies" className="ml-auto text-xs text-red-600 dark:text-red-400 hover:underline">View all</Link>
          </div>
          <div className="space-y-1.5">
            {criticalAllergies.slice(0, 3).map(a => (
              <div key={a.id} className="flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full shrink-0", a.severity === "life-threatening" ? "bg-red-600" : "bg-orange-400")} />
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{a.allergen}</span>
                <span className="text-xs text-slate-500 ml-auto">{a.severity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Current medications placeholder */}
        <div className="rounded-2xl border border-violet-100 dark:border-violet-900/30 bg-violet-50/40 dark:bg-violet-950/10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Pill className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Current Medications</h3>
            <Link href="/patient/records/health-profile" className="ml-auto text-xs text-violet-600 dark:text-violet-400 hover:underline">View all</Link>
          </div>
          <div className="space-y-1.5">
            {[
              { name: "Sertraline", dose: "50 mg", freq: "Once daily", refill: "30 days" },
              { name: "Lorazepam", dose: "0.5 mg", freq: "As needed (PRN)", refill: "As needed" },
            ].map(med => (
              <div key={med.name} className="flex items-start gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-400 shrink-0 mt-1.5" />
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{med.name} <span className="font-normal text-slate-500">{med.dose}</span></p>
                  <p className="text-xs text-slate-500">{med.freq}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent messages preview */}
      {unreadMessages > 0 && (
        <div className="rounded-2xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/40 dark:bg-blue-950/10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">New Message</h3>
            <Link href="/patient/messages" className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:underline">View all</Link>
          </div>
          {MESSAGE_THREADS.filter(t => t.unreadCount > 0).slice(0, 1).map(thread => (
            <div key={thread.id} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-200 dark:bg-blue-900 flex items-center justify-center text-[11px] font-bold text-blue-700 dark:text-blue-300 shrink-0">
                {thread.participantAvatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{thread.participantName}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5">{thread.lastMessage}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
