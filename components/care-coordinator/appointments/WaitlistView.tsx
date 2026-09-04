"use client";

import { useState, useMemo } from "react";
import { GripVertical, Clock, UserCheck, CalendarPlus, MoreHorizontal, Phone, Video, MapPin, X, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { getWaitlistedAppointments, getBookedSlots } from "@/data/cc-appointments";
import { CC_PATIENTS } from "@/data/cc-patients";
import { PROVIDERS } from "@/data/providers";
import { DAYS } from "@/data/clinics";
import type { Provider } from "@/data/providers";
import { cn } from "@/lib/utils";

function fmt12(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function fmtDateLong(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const t = h * 60 + m + mins;
  return `${Math.floor(t / 60).toString().padStart(2, "0")}:${(t % 60).toString().padStart(2, "0")}`;
}

const SLOT_INTERVAL = 30;

function generateSlots(provider: Provider | undefined, date: string): string[] {
  if (!provider) return [];
  const dayName = new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" }) as typeof DAYS[number];
  const wh = provider.workingHours.find(w => w.day === dayName);
  if (!wh || !wh.isOpen) return [];
  const slots: string[] = [];
  let cur = wh.openTime;
  const end = wh.closeTime;
  while (cur < end) {
    const next = addMinutes(cur, SLOT_INTERVAL);
    if (next > end) break;
    slots.push(cur);
    cur = next;
  }
  return slots;
}

function getDates(count = 14): string[] {
  const dates: string[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

const MODE_ICON = { telehealth: Video, phone: Phone, "in-person": MapPin };

interface OfferedSlot { date: string; time: string }

interface OfferDrawerProps {
  apptId: string;
  patientName: string;
  visitType: string;
  provider: Provider | undefined;
  onClose: () => void;
  onOffer: (apptId: string, date: string, time: string) => void;
}

function OfferDrawer({ apptId, patientName, visitType, provider, onClose, onOffer }: OfferDrawerProps) {
  const dates = useMemo(() => getDates(14), []);
  const [selectedDate, setSelectedDate] = useState<string>(dates[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const slots = useMemo(() => {
    if (!selectedDate) return [];
    const all = generateSlots(provider, selectedDate);
    const booked = getBookedSlots(provider?.id ?? "", selectedDate);
    return all.filter(s => !booked.includes(s));
  }, [provider, selectedDate]);

  function handleOffer() {
    if (!selectedDate || !selectedTime) return;
    setConfirmed(true);
    setTimeout(() => {
      onOffer(apptId, selectedDate, selectedTime);
      onClose();
    }, 1800);
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
      {/* Panel */}
      <div className="fixed top-0 right-0 h-full z-[60] flex flex-col w-[440px] bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Offer Appointment Slot</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{patientName} · {visitType}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
          {confirmed ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-brand-100 dark:bg-brand-950/40 flex items-center justify-center mb-4">
                <Check className="w-7 h-7 text-brand-600 dark:text-brand-400" />
              </div>
              <p className="text-base font-semibold text-slate-800 dark:text-slate-200">Slot offer sent!</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs">
                Slot offer sent to <span className="font-medium text-slate-700 dark:text-slate-300">{patientName}</span> for{" "}
                <span className="font-medium text-slate-700 dark:text-slate-300">{fmtDateLong(selectedDate!)}</span> at{" "}
                <span className="font-medium text-slate-700 dark:text-slate-300">{fmt12(selectedTime!)}</span>.
                Patient has 24 hours to confirm.
              </p>
            </div>
          ) : (
            <>
              {/* Provider (readonly) */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Provider</p>
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: provider?.color }} />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{provider?.displayName}</span>
                  <span className="ml-auto text-xs text-slate-400">{provider?.providerType}</span>
                </div>
              </div>

              {/* Date picker */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Date</p>
                <div className="grid grid-cols-7 gap-1">
                  {getDates(14).map(date => {
                    const d = new Date(date + "T12:00:00");
                    const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
                    const dayNum = d.getDate();
                    const isSelected = date === selectedDate;
                    const slots = generateSlots(provider, date);
                    const booked = getBookedSlots(provider?.id ?? "", date);
                    const available = slots.filter(s => !booked.includes(s)).length;
                    const hasSlots = available > 0;
                    return (
                      <button
                        key={date}
                        disabled={!hasSlots}
                        onClick={() => { setSelectedDate(date); setSelectedTime(null); }}
                        className={cn(
                          "flex flex-col items-center py-2 rounded-xl text-xs transition-all",
                          isSelected
                            ? "bg-brand-600 text-white font-semibold shadow-md"
                            : hasSlots
                            ? "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/30"
                            : "bg-slate-50 dark:bg-slate-800/50 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                        )}
                      >
                        <span className="text-[10px] font-medium">{dayLabel}</span>
                        <span className="text-sm font-bold mt-0.5">{dayNum}</span>
                        {hasSlots && !isSelected && (
                          <span className="w-1 h-1 rounded-full bg-brand-500 mt-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Available Times {selectedDate && <span className="normal-case font-normal text-slate-400">— {fmtDateLong(selectedDate)}</span>}
                </p>
                {slots.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic py-3">No available slots on this day</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map(s => (
                      <button
                        key={s}
                        onClick={() => setSelectedTime(s)}
                        className={cn(
                          "px-3 py-2 rounded-xl text-xs font-medium transition-all border",
                          selectedTime === s
                            ? "bg-brand-600 text-white border-brand-600 shadow-md"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/30"
                        )}
                      >
                        {fmt12(s)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!confirmed && (
          <div className="shrink-0 px-5 py-4 border-t border-slate-200 dark:border-slate-800">
            <button
              disabled={!selectedDate || !selectedTime}
              onClick={handleOffer}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
            >
              <CalendarPlus className="w-4 h-4" />
              Send Slot Offer to Patient
            </button>
            {selectedDate && selectedTime && (
              <p className="text-xs text-center text-slate-400 mt-2">
                {fmtDateLong(selectedDate)} at {fmt12(selectedTime)}
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function WaitlistView({ onSchedule }: { onSchedule?: () => void }) {
  const waitlist = getWaitlistedAppointments();
  const [openActions, setOpenActions] = useState<string | null>(null);
  const [drawerEntry, setDrawerEntry] = useState<string | null>(null);
  const [offeredSlots, setOfferedSlots] = useState<Record<string, OfferedSlot>>({});

  function handleOffer(apptId: string, date: string, time: string) {
    setOfferedSlots(prev => ({ ...prev, [apptId]: { date, time } }));
    setDrawerEntry(null);
  }

  const drawerAppt = drawerEntry ? waitlist.find(a => a.id === drawerEntry) : null;
  const drawerPatient = drawerAppt ? CC_PATIENTS.find(p => p.id === drawerAppt.patientId) : null;
  const drawerProvider = drawerAppt ? PROVIDERS.find(p => p.id === drawerAppt.providerId) : null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950">
      {/* Offer drawer */}
      {drawerEntry && drawerAppt && (
        <OfferDrawer
          apptId={drawerAppt.id}
          patientName={drawerPatient?.displayName ?? "Patient"}
          visitType={drawerAppt.visitType}
          provider={drawerProvider ?? undefined}
          onClose={() => setDrawerEntry(null)}
          onOffer={handleOffer}
        />
      )}

      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Waitlist</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{waitlist.length} patients waiting · Drag to reprioritize</p>
          </div>
          <button onClick={onSchedule} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors">
            <CalendarPlus className="w-3.5 h-3.5" />
            Schedule from Waitlist
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 p-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
        {[
          { label: "Total Waiting", value: waitlist.length, color: "slate" },
          { label: "Avg Wait Time", value: "4.2 days", color: "amber" },
          { label: "Scheduled Today", value: "2", color: "teal" },
        ].map(s => (
          <div key={s.label} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Waitlist items */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {waitlist.length === 0 && (
          <div className="text-center py-16">
            <Clock className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No patients on the waitlist</p>
          </div>
        )}

        {waitlist.map((appt, idx) => {
          const patient = CC_PATIENTS.find(p => p.id === appt.patientId);
          const provider = PROVIDERS.find(p => p.id === appt.providerId);
          const ModeIcon = MODE_ICON[appt.mode];
          const offered = offeredSlots[appt.id];

          return (
            <div key={appt.id}
              className={cn(
                "flex items-start gap-3 p-4 rounded-2xl border bg-white dark:bg-slate-900 transition-all hover:shadow-sm group",
                offered
                  ? "border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/10"
                  : "border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700"
              )}>
              {/* Drag handle + position */}
              <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                <GripVertical className="w-4 h-4 text-slate-300 dark:text-slate-700 cursor-grab active:cursor-grabbing group-hover:text-slate-400 transition-colors" />
                <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
              </div>

              {/* Patient avatar */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                style={{ backgroundColor: provider?.color ?? "#94a3b8" }}>
                {patient?.firstName[0]}{patient?.lastName[0]}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{patient?.displayName}</p>
                  <span className="text-xs text-slate-500">{patient?.mrn}</span>
                  {offered && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-semibold border border-amber-200 dark:border-amber-800">
                      Slot Offered · {fmtDateLong(offered.date)} {fmt12(offered.time)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: provider?.color }} />
                    {provider?.displayName}
                  </span>
                  <span>{appt.visitType}</span>
                  <span className="flex items-center gap-1"><ModeIcon className="w-3 h-3" />{appt.mode === "in-person" ? "In-Person" : appt.mode}</span>
                </div>
                {appt.notes && (
                  <p className="mt-1.5 text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-800 rounded-lg px-2.5 py-1.5">
                    &quot;{appt.notes}&quot;
                  </p>
                )}
              </div>

              {/* Insurance */}
              {patient?.insuranceProvider && (
                <div className="hidden sm:block text-right shrink-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400">{patient.insuranceProvider}</p>
                  <p className="text-[10px] text-slate-400">{patient.insuranceMemberId}</p>
                </div>
              )}

              {/* Actions */}
              <div className="relative shrink-0">
                <div className={cn("flex items-center gap-1 transition-opacity", offered ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                  {offered ? (
                    <span className="px-2.5 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Awaiting reply
                    </span>
                  ) : (
                    <button
                      onClick={() => setDrawerEntry(appt.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium transition-colors">
                      <CalendarPlus className="w-3.5 h-3.5" />
                      Offer Slot
                    </button>
                  )}
                  <button onClick={() => setOpenActions(o => o === appt.id ? null : appt.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                {openActions === appt.id && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpenActions(null)} />
                    <div className="absolute right-0 top-8 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden w-40">
                      {["Move to top", "Contact patient", "Remove from list"].map(a => (
                        <button key={a} onClick={() => setOpenActions(null)}
                          className={cn("w-full text-left px-4 py-2.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
                            a === "Remove from list" ? "text-red-500" : "text-slate-700 dark:text-slate-300")}>
                          {a}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
