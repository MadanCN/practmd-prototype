"use client";

import { useState } from "react";
import {
  CalendarCog, Save, CheckCircle, Plus, Pencil, Trash2, X, Check,
  LogIn, ShieldCheck, Clock, CalendarX, DollarSign, ListChecks, RotateCcw,
} from "lucide-react";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";
import { CANCELLATION_REASONS, RESCHEDULE_REASONS, CLINIC_CONFIG } from "@/data/cc-masters";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Reason {
  id: string;
  value: string;
  label: string;
  active: boolean;
}

// ── Seed data from cc-masters ─────────────────────────────────────────────────

const seedCancel: Reason[] = CANCELLATION_REASONS.map((r, i) => ({
  id: `cr_${i}`, value: r.value, label: r.label, active: true,
}));

const seedReschedule: Reason[] = RESCHEDULE_REASONS.map((r, i) => ({
  id: `rr_${i}`, value: r.value, label: r.label, active: true,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const INPUT = "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500";

function toSlug(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── Reason List Editor ────────────────────────────────────────────────────────

interface ReasonListProps {
  title: string;
  reasons: Reason[];
  onChange: (reasons: Reason[]) => void;
}

function ReasonList({ title, reasons, onChange }: ReasonListProps) {
  const [addLabel, setAddLabel] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  function handleAdd() {
    const trimmed = addLabel.trim();
    if (!trimmed) return;
    onChange([...reasons, { id: crypto.randomUUID(), value: toSlug(trimmed), label: trimmed, active: true }]);
    setAddLabel("");
    setShowAdd(false);
  }

  function handleEditSave(id: string) {
    const trimmed = editLabel.trim();
    if (!trimmed) return;
    onChange(reasons.map(r => r.id === id ? { ...r, label: trimmed, value: toSlug(trimmed) } : r));
    setEditId(null);
  }

  function handleDelete(id: string) {
    onChange(reasons.filter(r => r.id !== id));
    setDeleteId(null);
  }

  function toggleActive(id: string) {
    onChange(reasons.map(r => r.id === id ? { ...r, active: !r.active } : r));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</p>
        <button
          onClick={() => { setShowAdd(true); setAddLabel(""); }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/60 border border-blue-200 dark:border-blue-800 transition-colors"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>

      {/* Add row */}
      {showAdd && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
          <input
            autoFocus
            value={addLabel}
            onChange={e => setAddLabel(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setShowAdd(false); }}
            placeholder="Reason label…"
            className="flex-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={handleAdd} className="p-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Reason rows */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {reasons.map(r => (
          <div key={r.id} className={cn("flex items-center gap-3 px-3 py-2.5 transition-colors", !r.active && "opacity-50")}>
            {editId === r.id ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  autoFocus
                  value={editLabel}
                  onChange={e => setEditLabel(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleEditSave(r.id); if (e.key === "Escape") setEditId(null); }}
                  className="flex-1 px-2.5 py-1 rounded-md border border-blue-400 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none"
                />
                <button onClick={() => handleEditSave(r.id)} className="p-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white">
                  <Check className="w-3 h-3" />
                </button>
                <button onClick={() => setEditId(null)} className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <span className="flex-1 text-sm text-slate-800 dark:text-slate-200">{r.label}</span>
                <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 hidden sm:block">{r.value}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <Toggle checked={r.active} onChange={() => toggleActive(r.id)} />
                  <button
                    onClick={() => { setEditId(r.id); setEditLabel(r.label); }}
                    className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setDeleteId(r.id)}
                    className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {reasons.length === 0 && (
          <div className="py-6 text-center text-sm text-slate-400">No reasons configured.</div>
        )}
      </div>

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteId(null)} />
          <div className="relative z-10 w-full max-w-xs rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-4">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Delete this reason?</p>
            <p className="text-xs text-slate-500">This cannot be undone. Appointments that used this reason will retain their saved value.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteId(null)} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Number Stepper ────────────────────────────────────────────────────────────

interface NumStepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit: string;
}

function NumStepper({ value, onChange, min = 0, max = 9999, step = 1, unit }: NumStepperProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-base font-medium"
      >
        −
      </button>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Math.max(min, Math.min(max, Number(e.target.value))))}
        className="w-20 text-center px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-base font-medium"
      >
        +
      </button>
      <span className="text-sm text-slate-500 dark:text-slate-400">{unit}</span>
    </div>
  );
}

// ── Currency Input ────────────────────────────────────────────────────────────

function CurrencyInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1 w-36 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500">
      <span className="text-sm text-slate-400">$</span>
      <input
        type="number"
        min={0}
        max={9999}
        step={5}
        value={value}
        onChange={e => onChange(Math.max(0, Number(e.target.value)))}
        className="flex-1 text-sm font-semibold bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
      />
      <span className="text-xs text-slate-400">USD</span>
    </div>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────

function SectionCard({ icon: Icon, iconBg, title, description, children }: {
  icon: React.ElementType;
  iconBg: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <div className="px-5 py-4 space-y-5">
        {children}
      </div>
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">
        {children}
      </div>
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function AppointmentMastersScreen() {
  // Reasons
  const [cancelReasons, setCancelReasons] = useState<Reason[]>(seedCancel);
  const [rescheduleReasons, setRescheduleReasons] = useState<Reason[]>(seedReschedule);

  // Check-in
  const [checkInBuffer, setCheckInBuffer] = useState(CLINIC_CONFIG.checkInBufferMins);
  const [autoEligibility, setAutoEligibility] = useState(CLINIC_CONFIG.autoEligibilityOnCheckin);

  // No-show & cancellation
  const [noShowWindow, setNoShowWindow] = useState(CLINIC_CONFIG.noShowWindowMins);
  const [rescheduleWindow, setRescheduleWindow] = useState(CLINIC_CONFIG.rescheduleWindowHrs);
  const [noShowFee, setNoShowFee] = useState(CLINIC_CONFIG.noShowFee);
  const [lateCancelFee, setLateCancelFee] = useState(CLINIC_CONFIG.lateCancellationFee);

  // Waitlist
  const [offerExpiry, setOfferExpiry] = useState(CLINIC_CONFIG.offerExpiryHrs);

  // Save state
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center shrink-0">
          <CalendarCog className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Appointment Masters</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Reason codes, check-in rules, fees, and waitlist timing for the appointment lifecycle.
          </p>
        </div>
      </div>

      {/* 1. Cancellation Reasons */}
      <SectionCard
        icon={CalendarX}
        iconBg="bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400"
        title="Cancellation Reasons"
        description="Staff-selectable reasons when cancelling an appointment"
      >
        <ReasonList title="Reasons" reasons={cancelReasons} onChange={setCancelReasons} />
      </SectionCard>

      {/* 2. Reschedule Reasons */}
      <SectionCard
        icon={RotateCcw}
        iconBg="bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
        title="Reschedule Reasons"
        description="Staff-selectable reasons when rescheduling an appointment"
      >
        <ReasonList title="Reasons" reasons={rescheduleReasons} onChange={setRescheduleReasons} />
      </SectionCard>

      {/* 3. Check-In Settings */}
      <SectionCard
        icon={LogIn}
        iconBg="bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400"
        title="Check-In Settings"
        description="Controls when patients can check in and what runs automatically"
      >
        <SettingRow
          label="Check-In Buffer Time"
          description="Patients can be checked in this many minutes before their appointment starts"
        >
          <NumStepper value={checkInBuffer} onChange={setCheckInBuffer} min={0} max={120} step={5} unit="min before" />
        </SettingRow>
        <div className="h-px bg-slate-100 dark:bg-slate-800" />
        <SettingRow
          label="Auto Eligibility Check on Check-In"
          description="Automatically run an insurance eligibility verification when a patient is checked in"
        >
          <Toggle checked={autoEligibility} onChange={setAutoEligibility} />
        </SettingRow>
      </SectionCard>

      {/* 4. No-Show & Late Cancellation */}
      <SectionCard
        icon={Clock}
        iconBg="bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400"
        title="No-Show & Late Cancellation"
        description="Time windows and fee defaults for missed or late-cancelled appointments"
      >
        <SettingRow
          label="No-Show Time Window"
          description="Appointment auto-flagged as No Show this many minutes after the scheduled start if the patient hasn't arrived"
        >
          <NumStepper value={noShowWindow} onChange={setNoShowWindow} min={5} max={120} step={5} unit="min after start" />
        </SettingRow>
        <div className="h-px bg-slate-100 dark:bg-slate-800" />
        <SettingRow
          label="Past Appointment Rescheduling"
          description="Only appointments that started within this window can be rescheduled retroactively"
        >
          <NumStepper value={rescheduleWindow} onChange={setRescheduleWindow} min={1} max={720} step={1} unit="hrs" />
        </SettingRow>
        <div className="h-px bg-slate-100 dark:bg-slate-800" />
        <SettingRow
          label="No-Show Fee"
          description="Default fee charged when a patient no-shows (staff can override per case)"
        >
          <CurrencyInput value={noShowFee} onChange={setNoShowFee} />
        </SettingRow>
        <div className="h-px bg-slate-100 dark:bg-slate-800" />
        <SettingRow
          label="Late Cancellation Fee"
          description="Default fee for cancellations within the late-cancel window (configured in Appointment Preferences)"
        >
          <CurrencyInput value={lateCancelFee} onChange={setLateCancelFee} />
        </SettingRow>
      </SectionCard>

      {/* 5. Waitlist */}
      <SectionCard
        icon={ListChecks}
        iconBg="bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400"
        title="Waitlist"
        description="How long a waitlisted patient has to respond to a freed slot offer"
      >
        <SettingRow
          label="Waitlist Offer Expiry"
          description="After a slot offer is sent to a waitlisted patient, this is how long they have to accept before it moves to the next patient"
        >
          <NumStepper value={offerExpiry} onChange={setOfferExpiry} min={1} max={72} step={1} unit="hrs" />
        </SettingRow>
      </SectionCard>

      {/* Save */}
      <div className="flex items-center gap-3 pb-4">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
        {saved && (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Saved successfully
          </div>
        )}
      </div>
    </div>
  );
}
