"use client";

// Progressive-disclosure booking flow: Location -> Provider (filtered to that
// location) -> Visit type (filtered to that provider) -> Patient -> in/out-of-
// network check -> mini calendar with day-level availability -> slot -> (if
// in-person) Room & equipment -> forms/notes -> confirm. Each answered
// section collapses to a summary chip with a "Change" link; changing an
// earlier answer clears whatever depended on it, which is what re-expands
// the flow from that point — no separate "which section is open" state to
// keep in sync by hand.
//
// A calendar-slot click hands us providerId + date + startTime already —
// those pre-fill Location/Provider/Date/Slot so the coordinator only answers
// what the click didn't already tell us (visit type, patient, resource).

import { useMemo, useState } from "react";
import {
  X, Search, UserPlus, Check, ChevronRight, ChevronDown, Phone, Mail, Shield, ShieldCheck,
  ShieldAlert, Clock, MapPin, DoorOpen, Pencil, Building2, Wallet,
} from "lucide-react";
import { CC_PATIENTS, type CcPatient } from "@/data/cc-patients";
import { PROVIDERS, providerNetworkStatus } from "@/data/providers";
import { getAllLocations, findLocation, locationsForClinics } from "@/data/clinics";
import { getResourcesForLocation, type ClinicResource, roomTypeLabel } from "@/data/resources";
import { getLastVisitForPatient, type CcAppointment, type AppointmentMode, type RecurrenceType, type ScheduleType, type AppointmentType } from "@/data/cc-appointments";
import { visitTypeDef } from "@/lib/visit-types";
import { getPrimaryPolicy, isSelfPay } from "@/lib/insurance-store";
import { generateDaySlots, getBookedSlots, isResourceFree } from "@/lib/cc-availability";
import { fmt12, fmtDateMDY, fmtDuration, addMinutes } from "@/lib/cc-date-format";
import { cn } from "@/lib/utils";
import MiniAvailabilityCalendar from "./MiniAvailabilityCalendar";

export interface PrefilledSlot {
  date?: string;
  startTime?: string;
  providerId?: string;
  /** Landed here from a patient's chart ("Book appointment" / "New Appointment") — preselect them. */
  patientId?: string;
}

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  prefilled?: PrefilledSlot | null;
  onNewAppointment?: (appt: CcAppointment) => void;
}

interface RecurrenceConfig {
  type: RecurrenceType;
  every: number;
  daysOfWeek: string[];
  endDate: string;
  occurrences: number;
  endMode: "date" | "occurrences";
}

interface FormState {
  /** Selected physical location — a `ClinicLocation.id` (see data/clinics.ts), not a `Clinic.id`. */
  locationId: string;
  providerId: string;
  visitType: string;
  mode: AppointmentMode;
  patient: CcPatient | null;
  patientSearch: string;
  scheduleType: ScheduleType;
  appointmentType: AppointmentType;
  waitlistPriority: "crisis" | "urgent" | "routine";
  date: string;
  selectedSlots: string[];
  resourceId: string | null;
  resourceSkipped: boolean;
  recurrence: RecurrenceConfig;
  forms: string[];
  notes: string;
}

const FORMS_LIBRARY = ["PHQ-9", "GAD-7", "New Patient Intake", "Medication Review", "ADHD Screening", "PTSD Checklist", "Session Notes", "Consent Form"];
const IN_PERSON_ONLY_VISIT_TYPES = new Set(["Spravato", "TMS"]);

const defaultRecurrence: RecurrenceConfig = { type: "none", every: 1, daysOfWeek: [], endDate: "", occurrences: 8, endMode: "occurrences" };

function genApptId(): string {
  return `new-${Date.now()}`;
}

function initialForm(prefilled?: PrefilledSlot | null): FormState {
  const provider = prefilled?.providerId ? PROVIDERS.find((p) => p.id === prefilled.providerId) : undefined;
  const patient = prefilled?.patientId ? CC_PATIENTS.find((p) => p.id === prefilled.patientId) ?? null : null;
  const providerLocations = provider ? locationsForClinics(provider.clinicAccess) : [];
  const providerPrimaryLocation = providerLocations.find((l) => l.isPrimary) ?? providerLocations[0];
  return {
    locationId: providerPrimaryLocation?.id ?? "",
    providerId: prefilled?.providerId ?? "",
    visitType: "",
    mode: "in-person",
    patient, patientSearch: "",
    scheduleType: "appointment", appointmentType: "fixed", waitlistPriority: "routine",
    date: prefilled?.date ?? "",
    selectedSlots: prefilled?.startTime ? [prefilled.startTime] : [],
    resourceId: null, resourceSkipped: false,
    recurrence: defaultRecurrence,
    forms: [], notes: "",
  };
}

const INPUT = "w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500";
const LABEL = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5";

const INSURANCE_STATUS_STYLES = {
  active: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
  inactive: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  pending: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
};

// ── Section shell — collapses to a summary chip once answered ──────────────

function Section({ n, title, done, summary, onChange, locked, children }: {
  n: number; title: string; done: boolean; summary?: React.ReactNode; onChange?: () => void; locked?: boolean; children: React.ReactNode;
}) {
  if (locked) {
    return (
      <div className="flex items-center gap-3 py-2.5 opacity-40">
        <span className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 text-[11px] font-semibold text-slate-400 flex items-center justify-center shrink-0">{n}</span>
        <span className="text-sm text-slate-400">{title}</span>
      </div>
    );
  }
  if (done) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-3.5 py-2.5">
        <button type="button" onClick={onChange} className="w-full flex items-center gap-3 text-left group">
          <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</p>
            <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{summary}</div>
          </div>
          {onChange && (
            <span className="flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <Pencil className="w-3 h-3" /> Change
            </span>
          )}
        </button>
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-[11px] font-semibold flex items-center justify-center shrink-0">{n}</span>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</p>
      </div>
      <div className="ml-9">{children}</div>
    </div>
  );
}

export default function NewAppointmentDrawer({ open, onClose, prefilled, onNewAppointment }: DrawerProps) {
  const [form, setForm] = useState<FormState>(() => initialForm(prefilled));
  const [formSearch, setFormSearch] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);

  // The drawer is mounted once for the page's lifetime (it just slides in/out
  // via `open`), so a `useState(() => initialForm(prefilled))` lazy
  // initializer only ever runs on that first mount — a later calendar-slot
  // click changes the `prefilled` *prop* on an already-mounted instance and
  // would otherwise never reach the form. Re-seed on every closed->open
  // transition instead, via the "adjust state during render" pattern already
  // used in TourProvider.tsx (not an effect, so no cascading-render lint).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setForm(initialForm(prefilled));
      setFormSearch("");
      setDetailsOpen(false);
    }
  }

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  const location = findLocation(form.locationId);
  const provider = PROVIDERS.find((p) => p.id === form.providerId);

  // A provider has access at the clinic (practice) level; a location just
  // narrows to one of that clinic's own sites (Clinic Management > Clinic >
  // Locations), so "providers at this location" means providers whose
  // clinicAccess includes the location's *owning* clinic.
  const providersAtLocation = useMemo(
    () => (location ? PROVIDERS.filter((p) => p.clinicAccess.includes(location.clinicId) && p.isActive) : []),
    [location],
  );

  const providerVisitTypes = useMemo(() => {
    if (!provider) return [];
    const canonical = new Set(provider.visitTypes.map((v) => visitTypeDef(v).label));
    return Array.from(canonical);
  }, [provider]);

  // ── Section 1: Location ──────────────────────────────────────────────────
  function changeLocation() {
    setForm((f) => ({ ...initialForm(null), patient: f.patient, patientSearch: f.patientSearch }));
  }
  function pickLocation(locationId: string) {
    setForm((f) => ({ ...initialForm(null), locationId, patient: f.patient, patientSearch: f.patientSearch }));
  }

  // ── Section 2: Provider ──────────────────────────────────────────────────
  function changeProvider() {
    setForm((f) => ({ ...f, providerId: "", visitType: "", mode: "in-person", date: "", selectedSlots: [], resourceId: null, resourceSkipped: false }));
  }
  function pickProvider(id: string) {
    setForm((f) => ({ ...f, providerId: id, visitType: "", date: "", selectedSlots: [], resourceId: null, resourceSkipped: false }));
  }

  // ── Section 3: Visit type (+ mode) ───────────────────────────────────────
  function changeVisitType() {
    setForm((f) => ({ ...f, visitType: "", date: "", selectedSlots: [], resourceId: null, resourceSkipped: false }));
  }
  function pickVisitType(v: string) {
    // Only clear a chosen date/slot when this is an actual change of an
    // already-picked visit type (duration may differ) — not on the first
    // pick, which would otherwise wipe a calendar-click's prefilled date and
    // time before the coordinator ever sees them.
    const forceInPerson = IN_PERSON_ONLY_VISIT_TYPES.has(v);
    setForm((f) => ({ ...f, visitType: v, mode: forceInPerson ? "in-person" : f.mode }));
  }

  // ── Section 4: Patient ───────────────────────────────────────────────────
  const patientResults = useMemo(() => {
    const q = form.patientSearch.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return CC_PATIENTS.filter((p) =>
      p.displayName.toLowerCase().includes(q) || p.mrn.toLowerCase().includes(q) || p.email.toLowerCase().includes(q),
    ).slice(0, 8);
  }, [form.patientSearch]);
  const lastVisit = useMemo(() => (form.patient ? getLastVisitForPatient(form.patient.id) : null), [form.patient]);

  // ── Network status (informational, not a gate) ──────────────────────────
  const network = useMemo(() => {
    if (!form.patient || !provider) return null;
    if (isSelfPay(form.patient.id)) return { kind: "self-pay" as const };
    const payer = getPrimaryPolicy(form.patient.id)?.payerName ?? form.patient.insuranceProvider;
    const status = providerNetworkStatus(provider.id, payer ?? null);
    return { kind: status, payer: payer ?? "their plan" };
  }, [form.patient, provider]);

  // ── Section 6: Date & time ───────────────────────────────────────────────
  const isWaitlist = form.scheduleType === "waitlist";
  const maxSelect = isWaitlist ? Infinity : form.appointmentType === "reserved" ? 3 : 1;
  const allSlots = useMemo(() => generateDaySlots(provider, form.date, form.locationId), [provider, form.date, form.locationId]);
  const bookedSlots = useMemo(() => (form.providerId && form.date ? getBookedSlots(form.providerId, form.date) : []), [form.providerId, form.date]);
  const duration = form.visitType ? visitTypeDef(form.visitType).defaultDurationMin : 30;

  function toggleSlot(slot: string) {
    if (!isWaitlist && bookedSlots.includes(slot)) return;
    if (form.selectedSlots.includes(slot)) {
      set("selectedSlots", form.selectedSlots.filter((s) => s !== slot));
    } else if (form.selectedSlots.length >= maxSelect) {
      if (form.appointmentType === "fixed" && !isWaitlist) set("selectedSlots", [slot]);
    } else {
      set("selectedSlots", [...form.selectedSlots, slot]);
    }
    set("resourceId", null);
    set("resourceSkipped", false);
  }
  function changeDateTime() {
    setForm((f) => ({ ...f, date: "", selectedSlots: [], resourceId: null, resourceSkipped: false }));
  }
  const scheduleDone = !!form.date && (isWaitlist || form.selectedSlots.length >= 1);

  // ── Section 7: Resources (in-person only) ────────────────────────────────
  const needsResource = form.mode === "in-person";
  const clinicResources = useMemo(() => (form.locationId ? getResourcesForLocation(form.locationId) : []), [form.locationId]);
  const primarySlot = form.selectedSlots[0];
  const slotEndTime = primarySlot ? addMinutes(primarySlot, duration) : undefined;

  function resourceFree(r: ClinicResource): boolean {
    if (!primarySlot || !slotEndTime || !form.date) return true;
    return isResourceFree(r.id, form.date, primarySlot, slotEndTime);
  }
  const resourceDone = !needsResource || !!form.resourceId || form.resourceSkipped;

  // ── Steps / gating ───────────────────────────────────────────────────────
  const locationDone = !!form.locationId;
  const providerDone = !!form.providerId;
  const visitTypeDone = !!form.visitType;
  const patientDone = !!form.patient;

  const canConfirm = locationDone && providerDone && visitTypeDone && patientDone && scheduleDone;

  function handleConfirmAppointment() {
    if (!canConfirm || !form.patient || !provider || !location) return;
    const slot = form.selectedSlots[0] ?? (allSlots[0] ?? "09:00");
    const newAppt: CcAppointment = {
      id: genApptId(),
      patientId: form.patient.id,
      providerId: form.providerId,
      clinicId: location.clinicId,
      locationId: location.id,
      visitType: form.visitType || "Follow-Up",
      mode: form.mode,
      date: form.date,
      startTime: slot,
      endTime: addMinutes(slot, duration),
      duration,
      status: isWaitlist ? "waitlisted" : "confirmed",
      scheduleType: form.scheduleType,
      appointmentType: form.appointmentType,
      forms: form.forms.length > 0 ? form.forms : undefined,
      notes: form.notes || undefined,
      recurrence: form.recurrence.type !== "none" ? form.recurrence : undefined,
      waitlistPriority: isWaitlist ? form.waitlistPriority : undefined,
      waitlistPosition: isWaitlist ? 99 : undefined,
      reservedSlots: form.appointmentType === "reserved" ? form.selectedSlots.map((s) => ({ date: form.date, startTime: s, endTime: addMinutes(s, duration) })) : undefined,
      resourceId: needsResource && form.resourceId ? form.resourceId : undefined,
    };
    onNewAppointment?.(newAppt);
    handleClose();
  }

  function handleClose() {
    setForm(initialForm(prefilled));
    setDetailsOpen(false);
    onClose();
  }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-40" onClick={handleClose} />}
      <div className={cn(
        "fixed top-0 right-0 h-full w-[760px] max-w-[92vw] bg-white dark:bg-slate-900 z-50 shadow-2xl flex flex-col transition-transform duration-300",
        open ? "translate-x-0" : "translate-x-full",
      )}>
        <div className="px-6 pt-5 pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">New Appointment</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Answer each step — earlier ones narrow the ones after.</p>
          </div>
          <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">

          {/* 1 — Location */}
          <Section n={1} title="Location" done={locationDone}
            summary={location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {location.name} <span className="text-slate-400 font-normal">· {location.city}, {location.state}</span></span>}
            onChange={changeLocation}>
            <div className="grid grid-cols-2 gap-3">
              {getAllLocations().map((l) => (
                <button key={l.id} type="button" onClick={() => pickLocation(l.id)}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/20 text-left transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{l.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{l.address}, {l.city}, {l.state} {l.zip}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </button>
              ))}
            </div>
          </Section>

          {/* 2 — Provider (filtered to location) */}
          <Section n={2} title="Provider" done={providerDone} locked={!locationDone}
            summary={provider && <span>{provider.displayName} <span className="text-slate-400 font-normal">· {provider.providerType}</span></span>}
            onChange={changeProvider}>
            {providersAtLocation.length === 0 ? (
              <p className="text-sm text-slate-400 py-3">No active providers at this location.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                {providersAtLocation.map((p) => (
                  <button key={p.id} type="button" onClick={() => pickProvider(p.id)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/20 text-left transition-colors">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: p.color }}>
                      {p.firstName[0]}{p.lastName[0]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{p.displayName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{p.providerType} · {p.specializations.slice(0, 2).join(", ")}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </Section>

          {/* 3 — Visit type + mode */}
          <Section n={3} title="Visit type" done={visitTypeDone} locked={!providerDone}
            summary={form.visitType && <span>{form.visitType} <span className="text-slate-400 font-normal">· {form.mode === "in-person" ? "In-Person" : form.mode === "telehealth" ? "Telehealth" : "Phone"}</span></span>}
            onChange={changeVisitType}>
            {providerVisitTypes.length === 0 ? (
              <p className="text-sm text-slate-400 py-3">This provider has no visit types configured.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  {providerVisitTypes.map((v) => (
                    <button key={v} type="button" onClick={() => pickVisitType(v)}
                      className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/20 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors">
                      {v} <span className="text-xs text-slate-400 ml-1">{fmtDuration(visitTypeDef(v).defaultDurationMin)}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </Section>

          {/* Mode toggle — visible once a visit type is chosen; folded into the same visual group */}
          {visitTypeDone && (
            <div className="ml-9 -mt-1">
              <label className={cn(LABEL, "text-xs")}>Mode</label>
              <div className="flex gap-2">
                {(["in-person", "telehealth", "phone"] as AppointmentMode[]).map((m) => {
                  const forcedInPerson = IN_PERSON_ONLY_VISIT_TYPES.has(form.visitType);
                  const disabled = forcedInPerson && m !== "in-person";
                  return (
                    <button key={m} type="button" disabled={disabled}
                      onClick={() => { set("mode", m); set("resourceId", null); set("resourceSkipped", false); }}
                      className={cn("flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors capitalize",
                        disabled ? "border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed" :
                        form.mode === m ? "bg-brand-600 border-brand-600 text-white" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-brand-400")}>
                      {m === "in-person" ? "In-Person" : m === "telehealth" ? "Telehealth" : "Phone"}
                    </button>
                  );
                })}
              </div>
              {IN_PERSON_ONLY_VISIT_TYPES.has(form.visitType) && (
                <p className="text-[11px] text-slate-400 mt-1">{form.visitType} requires an in-person visit.</p>
              )}
            </div>
          )}

          {/* 4 — Patient */}
          <Section n={4} title="Patient" done={patientDone} locked={!visitTypeDone}
            summary={form.patient && <span>{form.patient.displayName} <span className="text-slate-400 font-normal">· {form.patient.mrn}</span></span>}
            onChange={() => set("patient", null)}>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input className={cn(INPUT, "pl-9")} placeholder="Search by name, MRN, or email…"
                  value={form.patientSearch} onChange={(e) => set("patientSearch", e.target.value)} />
              </div>
              {patientResults.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                  {patientResults.map((p) => (
                    <button key={p.id} type="button" onClick={() => { set("patient", p); set("patientSearch", ""); }}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors">
                      <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-xs font-bold text-brand-700 dark:text-brand-300 shrink-0">
                        {p.firstName[0]}{p.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{p.displayName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{p.mrn} · {p.email}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                    </button>
                  ))}
                </div>
              )}
              {form.patientSearch.trim().length >= 2 && patientResults.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No patients found matching &quot;{form.patientSearch}&quot;</p>
              )}
              <button type="button" className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-sm text-slate-500 hover:border-brand-400 hover:text-brand-600 transition-colors">
                <UserPlus className="w-4 h-4" /> Register a new patient
              </button>
            </div>
          </Section>

          {/* Patient detail + network status — shown once patient is picked, folded under the section */}
          {patientDone && form.patient && (
            <div className="ml-9 -mt-1 space-y-2.5">
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <div className="flex items-center gap-3 px-3.5 py-2">
                  <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-500">Insurance</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{form.patient.insuranceProvider ?? "Self-pay"}</span>
                  {form.patient.insuranceStatus && (
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide ml-auto", INSURANCE_STATUS_STYLES[form.patient.insuranceStatus])}>{form.patient.insuranceStatus}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 px-3.5 py-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-500">Last visit</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{lastVisit ? `${fmtDateMDY(lastVisit.date)} · ${lastVisit.visitType}` : "None"}</span>
                </div>
                <div className="flex items-center gap-4 px-3.5 py-2 text-slate-500">
                  <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {form.patient.phone}</span>
                  <span className="flex items-center gap-1.5 truncate"><Mail className="w-3 h-3 shrink-0" /> <span className="truncate">{form.patient.email}</span></span>
                </div>
              </div>

              {network && network.kind === "self-pay" && (
                <div className="flex items-start gap-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                  <Wallet className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Self-pay — no insurance on file, network status not applicable.</span>
                </div>
              )}
              {network && network.kind === "in-network" && (
                <div className="flex items-start gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span><strong>In-network</strong> for {network.payer} — standard copay applies.</span>
                </div>
              )}
              {network && network.kind === "out-of-network" && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span><strong>Out-of-network</strong> for {network.payer}. Confirm the patient accepts out-of-network costs before booking.</span>
                </div>
              )}
              {network && network.kind === "unknown" && (
                <div className="flex items-start gap-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                  <Shield className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Network status unknown for this plan — verify eligibility before booking.</span>
                </div>
              )}
            </div>
          )}

          {/* 5 — Date & time */}
          <Section n={5} title="Date & time" done={scheduleDone} locked={!patientDone || !visitTypeDone}
            summary={form.date && primarySlot && (
              <span>{fmtDateMDY(form.date)} <span className="text-slate-400 font-normal">· {fmt12(primarySlot)}–{fmt12(slotEndTime!)} ({fmtDuration(duration)})</span></span>
            )}
            onChange={changeDateTime}>
            <div className="space-y-4">
              {/* Schedule type */}
              <div className="flex gap-2">
                {(["appointment", "waitlist"] as ScheduleType[]).map((t) => (
                  <button key={t} type="button" onClick={() => { set("scheduleType", t); if (t === "waitlist") set("appointmentType", "fixed"); }}
                    className={cn("flex-1 py-1.5 rounded-lg border text-xs font-medium capitalize transition-colors",
                      form.scheduleType === t ? "bg-brand-600 border-brand-600 text-white" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-brand-400")}>
                    {t === "appointment" ? "Appointment" : "Waitlist"}
                  </button>
                ))}
              </div>

              {isWaitlist && (
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">Waitlist priority</p>
                  <div className="flex gap-2">
                    {([{ v: "crisis", c: "bg-red-600 border-red-600" }, { v: "urgent", c: "bg-amber-500 border-amber-500" }, { v: "routine", c: "bg-slate-500 border-slate-500" }] as const).map((opt) => (
                      <button key={opt.v} type="button" onClick={() => set("waitlistPriority", opt.v)}
                        className={cn("flex-1 py-1.5 rounded-lg border text-xs font-semibold capitalize transition-colors",
                          form.waitlistPriority === opt.v ? `${opt.c} text-white` : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400")}>
                        {opt.v}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!isWaitlist && (
                <div className="flex gap-2">
                  {(["fixed", "reserved"] as AppointmentType[]).map((t) => (
                    <button key={t} type="button" onClick={() => { set("appointmentType", t); set("selectedSlots", []); }}
                      className={cn("flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                        form.appointmentType === t ? "bg-brand-600 border-brand-600 text-white" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-brand-400")}>
                      {t === "fixed" ? "Fixed slot" : "Offer up to 3"}
                    </button>
                  ))}
                </div>
              )}

              {/* Calendar + slots, side by side once there's room */}
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="w-full md:w-[300px] shrink-0">
                  <MiniAvailabilityCalendar provider={provider} selectedDate={form.date} locationId={form.locationId}
                    onSelectDate={(d) => { set("date", d); set("selectedSlots", []); set("resourceId", null); set("resourceSkipped", false); }} />
                </div>

                {/* Slot grid */}
                {form.date && (
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {isWaitlist ? "Preferred times (optional)" : `Select time${form.appointmentType === "reserved" ? "s" : ""}`}
                      </p>
                      <span className="text-[11px] text-slate-400">{fmtDateMDY(form.date)}</span>
                    </div>
                    {allSlots.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">Provider is not scheduled on this day.</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                        {allSlots.map((slot) => {
                          const isBooked = bookedSlots.includes(slot);
                          const isSelected = form.selectedSlots.includes(slot);
                          const disabled = isBooked && !isWaitlist;
                          return (
                            <button key={slot} type="button" disabled={disabled} onClick={() => toggleSlot(slot)}
                              className={cn("py-2 px-1 rounded-lg text-xs font-medium transition-all border",
                                disabled && "bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent cursor-not-allowed opacity-50",
                                isSelected && "bg-brand-500 border-brand-500 text-white shadow-sm",
                                !disabled && !isSelected && "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/30")}>
                              {fmt12(slot)}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {primarySlot && slotEndTime && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/20 rounded-lg px-3 py-2">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        Start {fmt12(primarySlot)} · End {fmt12(slotEndTime)} · Duration {fmtDuration(duration)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Section>

          {/* 6 — Resources (in-person only) */}
          {needsResource && (
            <Section n={6} title="Room & equipment" done={resourceDone} locked={!patientDone || !scheduleDone}
              summary={form.resourceId
                ? (() => { const r = clinicResources.find((x) => x.id === form.resourceId); return r && <span className="flex items-center gap-1.5"><DoorOpen className="w-3.5 h-3.5 text-slate-400" /> {r.name}</span>; })()
                : <span className="text-slate-400 font-normal">Not assigned yet</span>}
              onChange={() => { set("resourceId", null); set("resourceSkipped", false); }}>
              {clinicResources.length === 0 ? (
                <p className="text-sm text-slate-400 py-3">No rooms configured at this location.</p>
              ) : (
                <div>
                  <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                    {clinicResources.map((r) => {
                      const free = resourceFree(r);
                      return (
                        <button key={r.id} type="button" disabled={!free} onClick={() => set("resourceId", r.id)}
                          className={cn("flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-colors",
                            !free ? "border-slate-100 dark:border-slate-800 opacity-50 cursor-not-allowed" : "border-slate-200 dark:border-slate-700 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/20")}>
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            <DoorOpen className="w-4 h-4 text-slate-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{r.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{roomTypeLabel(r.roomType)} · Cap. {r.capacity}{r.equipment.length > 0 ? ` · ${r.equipment.join(", ")}` : ""}</p>
                          </div>
                          {!free && <span className="text-[10px] font-semibold uppercase text-red-500 shrink-0">Booked</span>}
                        </button>
                      );
                    })}
                  </div>
                  <button type="button" onClick={() => { set("resourceSkipped", true); set("resourceId", null); }}
                    className="w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-2 mt-2 text-center">
                    Skip — assign a room at check-in
                  </button>
                </div>
              )}
            </Section>
          )}

          {/* 7 — Forms, notes, recurrence (optional, always reachable once scheduling is done) */}
          {patientDone && scheduleDone && resourceDone && (
            <div className="pt-1">
              <button type="button" onClick={() => setDetailsOpen((v) => !v)}
                className="w-full flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 py-2">
                <ChevronDown className={cn("w-4 h-4 transition-transform", detailsOpen && "rotate-180")} />
                Forms, notes &amp; recurrence <span className="text-xs text-slate-400 font-normal">(optional)</span>
              </button>
              {detailsOpen && (
                <div className="space-y-4 mt-1">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className={cn(LABEL, "mb-0")}>Auto-assign forms</label>
                      <span className="text-xs text-slate-500">{form.forms.length} selected</span>
                    </div>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        placeholder="Search forms…" value={formSearch} onChange={(e) => setFormSearch(e.target.value)} />
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {FORMS_LIBRARY.filter((f) => f.toLowerCase().includes(formSearch.toLowerCase())).map((f) => (
                        <label key={f} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                          <input type="checkbox" className="accent-brand-600 w-4 h-4"
                            checked={form.forms.includes(f)} onChange={() => set("forms", form.forms.includes(f) ? form.forms.filter((x) => x !== f) : [...form.forms, f])} />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{f}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={LABEL}>Recurrence</label>
                    <div className="flex gap-2 flex-wrap">
                      {(["none", "daily", "weekly", "monthly"] as RecurrenceType[]).map((r) => (
                        <button key={r} type="button" onClick={() => set("recurrence", { ...form.recurrence, type: r })}
                          className={cn("px-3 py-1.5 rounded-lg border text-xs font-medium capitalize transition-colors",
                            form.recurrence.type === r ? "bg-brand-600 border-brand-600 text-white" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-brand-400")}>
                          {r === "none" ? "No repeat" : r}
                        </button>
                      ))}
                    </div>
                    {form.recurrence.type !== "none" && (
                      <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600 dark:text-slate-400">Every</span>
                          <input type="number" min={1} max={12} className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-center bg-white dark:bg-slate-900"
                            value={form.recurrence.every} onChange={(e) => set("recurrence", { ...form.recurrence, every: parseInt(e.target.value) || 1 })} />
                          <span className="text-sm text-slate-600 dark:text-slate-400">{form.recurrence.type === "daily" ? "day(s)" : form.recurrence.type === "weekly" ? "week(s)" : "month(s)"}</span>
                        </div>
                        {form.recurrence.type === "weekly" && (
                          <div className="flex gap-1 flex-wrap">
                            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                              <button key={day} type="button" onClick={() => {
                                const days = form.recurrence.daysOfWeek.includes(day) ? form.recurrence.daysOfWeek.filter((d) => d !== day) : [...form.recurrence.daysOfWeek, day];
                                set("recurrence", { ...form.recurrence, daysOfWeek: days });
                              }} className={cn("w-9 h-8 rounded-lg text-xs font-medium transition-colors",
                                form.recurrence.daysOfWeek.includes(day) ? "bg-brand-600 text-white" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400")}>
                                {day}
                              </button>
                            ))}
                          </div>
                        )}
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="radio" checked={form.recurrence.endMode === "occurrences"} onChange={() => set("recurrence", { ...form.recurrence, endMode: "occurrences" })} className="accent-brand-600" />
                          <span className="text-slate-700 dark:text-slate-300">After</span>
                          <input type="number" min={1} max={52} className="w-16 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-center bg-white dark:bg-slate-900"
                            value={form.recurrence.occurrences} onChange={(e) => set("recurrence", { ...form.recurrence, occurrences: parseInt(e.target.value) || 1 })} />
                          <span className="text-slate-600 dark:text-slate-400">sessions</span>
                        </label>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={LABEL}>Internal notes</label>
                    <textarea rows={3} className={cn(INPUT, "resize-none")} placeholder="Notes visible only to clinic staff…"
                      value={form.notes} onChange={(e) => set("notes", e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer — sticky summary + confirm */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
          {!canConfirm ? (
            <p className="text-xs text-slate-400 text-center py-1">Complete the steps above to create the appointment.</p>
          ) : (
            <div className="flex items-center gap-3 mb-3 text-xs text-slate-500 dark:text-slate-400">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{form.patient?.displayName} · {provider?.displayName} · {fmtDateMDY(form.date)} {primarySlot && `· ${fmt12(primarySlot)}`}</span>
            </div>
          )}
          <button onClick={handleConfirmAppointment} disabled={!canConfirm}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <Check className="w-4 h-4" />
            {isWaitlist ? "Add to Waitlist" : "Confirm Appointment"}
          </button>
        </div>
      </div>
    </>
  );
}
