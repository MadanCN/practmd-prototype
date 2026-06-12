"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays, Video, MapPin, Clock, PlusCircle, Phone,
  DollarSign, CheckCircle2, AlertCircle, ChevronRight, Sparkles,
} from "lucide-react";
import { PORTAL_APPOINTMENTS, type PortalAppointment, type ReservedSlotOption } from "@/data/patient-portal";
import { cn } from "@/lib/utils";

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function fmtDate(iso: string, weekday = true) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    ...(weekday ? { weekday: "long" } : {}),
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
function fmtDateShort(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

const today = new Date().toISOString().split("T")[0];

const MODE_ICON = { telehealth: Video, "in-person": MapPin, phone: Phone };
const MODE_LABEL = { telehealth: "Telehealth", "in-person": "In Person", phone: "Phone" };

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  confirmed:    { label: "Confirmed",           cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
  arrived:      { label: "Arrived",             cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" },
  requested:    { label: "Pending Confirmation",cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  "in-session": { label: "In Session",          cls: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400" },
  completed:    { label: "Completed",           cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  cancelled:    { label: "Cancelled",           cls: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400" },
};

// ── Reserved slot selection card ──────────────────────────────────────────────

function ReservedSlotCard({ appt, onConfirm, onDecline }: {
  appt: PortalAppointment;
  onConfirm: (slotId: string) => void;
  onDecline: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [declined, setDeclined] = useState(false);

  if (declined) {
    return (
      <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/10 p-5">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Thanks! We'll send you new options soon.</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Your care coordinator has been notified and will reach out with alternative times.</p>
          </div>
        </div>
      </div>
    );
  }

  if (confirmed) {
    const slot = appt.slotOptions!.find(s => s.slotId === selected)!;
    return (
      <div className="rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/10 p-5">
        <div className="flex items-start gap-4">
          <div className="w-14 rounded-xl bg-emerald-600 text-white flex flex-col items-center py-2 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">
              {new Date(slot.date + "T12:00:00").toLocaleDateString("en-US", { month: "short" })}
            </span>
            <span className="text-2xl font-bold leading-tight">
              {new Date(slot.date + "T12:00:00").getDate()}
            </span>
            <span className="text-[10px] text-emerald-100">
              {new Date(slot.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" })}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{appt.visitType}</p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">Confirmed</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">{appt.providerName} · {appt.providerCredentials}</p>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5" /> {fmt12(slot.startTime)} – {fmt12(slot.endTime)} ({appt.duration} min)
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Appointment confirmed — you&apos;ll receive a reminder.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/10 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/20">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Action Required — Choose Your Appointment Time</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Your care coordinator has reserved {appt.slotOptions!.length} slots for your <strong>{appt.visitType}</strong> with {appt.providerName}. Select your preferred time.
            </p>
          </div>
        </div>
      </div>

      {/* Slot options */}
      <div className="p-5 space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Time Slots</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {appt.slotOptions!.map((slot, i) => {
            const isSelected = selected === slot.slotId;
            const slotDate = new Date(slot.date + "T12:00:00");
            const isToday = slot.date === today;
            return (
              <button key={slot.slotId} onClick={() => setSelected(slot.slotId)}
                className={cn(
                  "rounded-xl border-2 p-4 text-left transition-all hover:shadow-sm",
                  isSelected
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 shadow-sm"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 hover:border-emerald-300 dark:hover:border-emerald-700"
                )}>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                    isSelected ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800")}>
                    Option {i + 1}
                  </span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                </div>
                <p className={cn("text-sm font-bold", isSelected ? "text-emerald-700 dark:text-emerald-300" : "text-slate-800 dark:text-slate-200")}>
                  {isToday ? "Today" : slotDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {fmt12(slot.startTime)} – {fmt12(slot.endTime)}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {Math.round((new Date(slot.date + "T" + slot.endTime).getTime() - new Date(slot.date + "T" + slot.startTime).getTime()) / 60000)} min · {appt.clinicName}
                </p>
              </button>
            );
          })}
        </div>

        {/* Confirm button */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => { if (selected) { onConfirm(selected); setConfirmed(true); } }}
            disabled={!selected}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold transition-colors">
            <CheckCircle2 className="w-4 h-4" />
            Confirm Selected Time
          </button>
          <p className="text-xs text-slate-400">
            {selected ? `You selected: ${fmtDateShort(appt.slotOptions!.find(s => s.slotId === selected)!.date)} at ${fmt12(appt.slotOptions!.find(s => s.slotId === selected)!.startTime)}` : "Select a slot above to confirm"}
          </p>
        </div>

        {/* None of these work */}
        <button onClick={() => { onDecline(); setDeclined(true); }}
          className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          None of these times work for me — Request new options
        </button>

        {/* Copay note */}
        {appt.copay !== undefined && (
          <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pt-1">
            <DollarSign className="w-3.5 h-3.5" />
            Co-pay: ${appt.copay} — due at visit · {appt.clinicAddress}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Regular appointment card ──────────────────────────────────────────────────

function VisitCard({ appt }: { appt: PortalAppointment }) {
  const ModeIcon = MODE_ICON[appt.mode];
  const status = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.confirmed;
  const isTelehealth = appt.mode === "telehealth";
  const isToday = appt.date === today;

  return (
    <div className={cn(
      "rounded-2xl border p-5 transition-all hover:shadow-sm",
      isToday
        ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/10"
        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40"
    )}>
      <div className="flex items-start gap-4">
        {/* Date block */}
        <div className={cn("w-14 rounded-xl flex flex-col items-center py-2 shrink-0",
          isToday ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800")}>
          <span className={cn("text-[10px] font-bold uppercase tracking-wider",
            isToday ? "text-emerald-100" : "text-slate-500 dark:text-slate-400")}>
            {new Date(appt.date + "T12:00:00").toLocaleDateString("en-US", { month: "short" })}
          </span>
          <span className={cn("text-2xl font-bold leading-tight",
            isToday ? "text-white" : "text-slate-800 dark:text-slate-200")}>
            {new Date(appt.date + "T12:00:00").getDate()}
          </span>
          <span className={cn("text-[10px]",
            isToday ? "text-emerald-100" : "text-slate-500 dark:text-slate-400")}>
            {isToday ? "Today" : new Date(appt.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" })}
          </span>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{appt.visitType}</p>
            <span className={cn("text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full", status.cls)}>
              {status.label}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">{appt.providerName} · {appt.providerCredentials}</p>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5" />{fmt12(appt.startTime)} – {fmt12(appt.endTime)} ({appt.duration} min)
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <ModeIcon className="w-3.5 h-3.5" />{MODE_LABEL[appt.mode]}
            </span>
          </div>
          {!isTelehealth && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{appt.clinicAddress}</p>
          )}
          {appt.copay !== undefined && (
            <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <DollarSign className="w-3.5 h-3.5" />
              Co-pay: ${appt.copay} — {appt.copayPaid
                ? <span className="text-emerald-600 font-medium ml-0.5">Paid</span>
                : <span className="text-amber-600 font-medium ml-0.5">Due at visit</span>}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        {isTelehealth && ["confirmed", "arrived"].includes(appt.status) && (
          <Link href={`/patient/telehealth/${appt.id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors">
            <Video className="w-4 h-4" /> Join Session
          </Link>
        )}
        {isTelehealth && (
          <Link href="/patient/telehealth/system-check"
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
            System Check
          </Link>
        )}
        <button className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
          <CalendarDays className="w-3.5 h-3.5" /> Add to Calendar
        </button>
        <button className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-950/20">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VisitsPage() {
  const [appointments, setAppointments] = useState(
    PORTAL_APPOINTMENTS.filter(a => a.date >= today && ["confirmed", "arrived", "requested"].includes(a.status))
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
  );

  function handleSlotConfirm(apptId: string, slotId: string) {
    setAppointments(prev => prev.map(a => {
      if (a.id !== apptId) return a;
      const slot = a.slotOptions!.find(s => s.slotId === slotId)!;
      return { ...a, status: "confirmed" as const, date: slot.date, startTime: slot.startTime, endTime: slot.endTime, appointmentType: "fixed" as const };
    }));
  }

  function handleSlotDecline(apptId: string) {
    setAppointments(prev => prev.filter(a => a.id !== apptId));
  }

  const reserved = appointments.filter(a => a.appointmentType === "reserved" && a.status === "requested");
  const regular = appointments.filter(a => !(a.appointmentType === "reserved" && a.status === "requested"));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">My Visits</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Upcoming appointments and visit history</p>
        </div>
        <Link href="/patient/visits/schedule"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shrink-0">
          <PlusCircle className="w-4 h-4" /> Book Appointment
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 w-fit">
        {["Upcoming", "Past Visits"].map((tab, i) => (
          <Link key={tab} href={i === 0 ? "/patient/visits" : "/patient/visits/past"}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              i === 0
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            )}>
            {tab}
          </Link>
        ))}
      </div>

      {/* Action required: reserved slots */}
      {reserved.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              {reserved.length} appointment{reserved.length > 1 ? "s" : ""} awaiting your time selection
            </p>
          </div>
          {reserved.map(appt => (
            <ReservedSlotCard key={appt.id} appt={appt} onConfirm={(slotId) => handleSlotConfirm(appt.id, slotId)} onDecline={() => handleSlotDecline(appt.id)} />
          ))}
        </div>
      )}

      {/* Upcoming confirmed appointments */}
      {regular.length > 0 ? (
        <div className="space-y-3">
          {reserved.length > 0 && (
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirmed Appointments</p>
          )}
          {regular.map(appt => <VisitCard key={appt.id} appt={appt} />)}
        </div>
      ) : reserved.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center">
          <CalendarDays className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-600 dark:text-slate-400">No upcoming appointments</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Book an appointment to get started</p>
          <Link href="/patient/visits/schedule"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors">
            <PlusCircle className="w-4 h-4" /> Schedule Now
          </Link>
        </div>
      )}
    </div>
  );
}
