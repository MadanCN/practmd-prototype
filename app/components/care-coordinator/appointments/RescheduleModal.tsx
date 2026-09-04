"use client";

import { useState, useMemo, useEffect } from "react";
import { X, Bell, BellOff, Check, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import WaitlistOfferPanel from "./WaitlistOfferPanel";
import { type CcAppointment, getBookedSlots, getWaitlistMatchesForProvider } from "@/data/cc-appointments";
import { CC_PATIENTS, type CcPatient } from "@/data/cc-patients";
import { type Provider } from "@/data/providers";
import { RESCHEDULE_REASONS, CLINIC_CONFIG } from "@/data/cc-masters";
import { DAYS } from "@/data/clinics";
import { cn } from "@/lib/utils";


const SLOT_INTERVAL = 30;

function fmt12(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${Math.floor(total / 60).toString().padStart(2, "0")}:${(total % 60).toString().padStart(2, "0")}`;
}

function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}


function generateSlots(provider: Provider, date: string): string[] {
  const dayName = new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" }) as typeof DAYS[number];
  const wh = provider.workingHours.find(w => w.day === dayName);
  if (!wh || !wh.isOpen) return [];
  const slots: string[] = [];
  let cur = wh.openTime;
  while (cur < wh.closeTime) {
    const next = addMinutes(cur, SLOT_INTERVAL);
    if (next > wh.closeTime) break;
    slots.push(cur);
    cur = next;
  }
  return slots;
}

const INPUT = "w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500";

interface Props {
  appointment: CcAppointment;
  patient: CcPatient;
  provider: Provider;
  allAppointments: CcAppointment[];
  onConfirm: (newDate: string, newStartTime: string, newEndTime: string, reason: string, notify: boolean) => void;
  onClose: () => void;
}

type Phase = "form" | "processing" | "waitlist";

export default function RescheduleModal({ appointment, patient, provider, allAppointments, onConfirm, onClose }: Props) {
  const [reason, setReason] = useState("");
  const [newDate, setNewDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [notifyPatient, setNotifyPatient] = useState(true);
  const [phase, setPhase] = useState<Phase>("form");

  const allSlots = useMemo(() => (newDate ? generateSlots(provider, newDate) : []), [provider, newDate]);
  const bookedSlots = useMemo(() => (newDate ? getBookedSlots(provider.id, newDate) : []), [provider.id, newDate]);

  // Waitlist entries for the OLD slot (freed by reschedule)
  const waitlistEntries = useMemo(() =>
    getWaitlistMatchesForProvider(appointment.providerId, allAppointments),
    [appointment.providerId, allAppointments]
  );
  const patientMap = useMemo(() => Object.fromEntries(CC_PATIENTS.map(p => [p.id, p])), []);

  const canConfirm = !!(reason && newDate && selectedSlot);

  function handleConfirm() {
    if (!canConfirm) return;
    const endTime = addMinutes(selectedSlot, appointment.duration);
    setPhase("processing");
    setTimeout(() => {
      onConfirm(newDate, selectedSlot, endTime, reason, notifyPatient);
      setPhase("waitlist");
    }, 1600);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={phase === "form" ? onClose : undefined} />
      <div className="relative w-[520px] max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {phase === "waitlist" ? "Appointment Rescheduled" : "Reschedule Appointment"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{patient.displayName} · {provider.displayName}</p>
          </div>
          {phase !== "processing" && (
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── FORM phase ── */}
          {phase === "form" && (
            <div className="space-y-5">
              {/* Current appointment */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Current Appointment</p>
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: provider.color }} />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {fmtDate(appointment.date)} · {fmt12(appointment.startTime)} – {fmt12(appointment.endTime)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{appointment.visitType} · {appointment.duration} min</p>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Reason for Reschedule <span className="text-red-500">*</span>
                </label>
                <select className={INPUT} value={reason} onChange={e => setReason(e.target.value)}>
                  <option value="">Select a reason</option>
                  {RESCHEDULE_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              {/* New date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  New Date <span className="text-red-500">*</span>
                </label>
                <input type="date" className={INPUT} value={newDate}
                  onChange={e => { setNewDate(e.target.value); setSelectedSlot(""); }}
                  min={new Date().toISOString().split("T")[0]} />
              </div>

              {/* Slot grid */}
              {newDate && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Select New Time Slot <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded border border-slate-300 bg-white dark:bg-slate-800 inline-block" />Available</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-brand-500 inline-block" />Selected</span>
                      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700 inline-block opacity-50" />Booked</span>
                    </div>
                  </div>

                  {allSlots.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-sm text-slate-500">Provider is not scheduled on this day.</p>
                      <p className="text-xs text-slate-400 mt-1">Please select a different date.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {allSlots.map(slot => {
                        const isBooked = bookedSlots.includes(slot);
                        const isSelected = selectedSlot === slot;
                        return (
                          <button key={slot} disabled={isBooked} onClick={() => !isBooked && setSelectedSlot(slot)}
                            className={cn(
                              "py-2 px-1 rounded-lg text-xs font-medium transition-all border",
                              isBooked && "bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent cursor-not-allowed opacity-50",
                              isSelected && "bg-brand-500 border-brand-500 text-white shadow-sm",
                              !isBooked && !isSelected && "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/30"
                            )}>
                            {fmt12(slot)}
                            {isBooked && <span className="block text-[10px] font-normal">Booked</span>}
                            {isSelected && <span className="block text-[10px] font-normal opacity-80">Selected</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedSlot && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-brand-600 dark:text-brand-400">
                      <Check className="w-3.5 h-3.5" />
                      New time: {fmtDate(newDate)} at {fmt12(selectedSlot)} ({appointment.duration} min)
                    </div>
                  )}
                </div>
              )}

              {/* Notify patient */}
              <div className={cn("p-3 rounded-xl border transition-colors", notifyPatient ? "bg-brand-50 dark:bg-brand-950/20 border-brand-200 dark:border-brand-800" : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700")}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={notifyPatient} onChange={e => setNotifyPatient(e.target.checked)} className="accent-brand-600 w-4 h-4 shrink-0" />
                  {notifyPatient ? <Bell className="w-4 h-4 text-brand-600 shrink-0" /> : <BellOff className="w-4 h-4 text-slate-400 shrink-0" />}
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Notify patient of reschedule</p>
                    <p className="text-xs text-slate-400 mt-0.5">{patient.email} · {patient.phone}</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* ── PROCESSING phase ── */}
          {phase === "processing" && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Processing reschedule…</p>
                <p className="text-xs text-slate-500 mt-1">Updating appointment and checking waitlist for freed slot</p>
              </div>
            </div>
          )}

          {/* ── WAITLIST phase ── */}
          {phase === "waitlist" && (
            <div className="space-y-4">
              {/* Confirmation */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Appointment rescheduled to {fmtDate(newDate)} at {fmt12(selectedSlot)}
                </div>
                {notifyPatient && (
                  <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Patient notified of new appointment time (Email + SMS)
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <AlertCircle className="w-4 h-4" />
                  Original slot ({fmtDate(appointment.date)} {fmt12(appointment.startTime)}) freed — checking waitlist
                </div>
              </div>

              {/* Waitlist offers for freed slot */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Waitlist — Offer Freed Slot</p>
                <WaitlistOfferPanel
                  freedSlot={{ date: appointment.date, startTime: appointment.startTime, endTime: appointment.endTime }}
                  providerName={provider.displayName}
                  entries={waitlistEntries}
                  patientMap={patientMap}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 shrink-0 flex gap-3">
          {phase === "form" && (
            <>
              <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button onClick={handleConfirm} disabled={!canConfirm}
                className="flex-1 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                Confirm Reschedule
              </button>
            </>
          )}
          {phase === "waitlist" && (
            <button onClick={onClose} className="w-full py-2.5 rounded-lg bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white text-sm font-semibold transition-colors">
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
