"use client";

import { useState } from "react";
import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import { AvailabilityCalendar } from "@/components/provider/availability/AvailabilityCalendar";
import { PROVIDERS } from "@/data/providers";
import { CLINICS } from "@/data/clinics";
import { DAYS, type DayName } from "@/data/clinics";
import {
  useProviderAvailabilityStore, submitLeaveRequest, submitBlockTimeRequest, submitHoursChangeRequest,
  type AvailabilityRequest, type AvailabilityRequestType, type WorkingHoursDraftDay,
} from "@/lib/provider-availability-store";
import {
  CalendarRange, X, Clock, CheckCircle, XCircle, PlaneTakeoff,
  CalendarX2, ClockArrowUp, Lock, ShieldCheck, MapPin, Video,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CURRENT_PROVIDER_ID = "p1";
const ME = "Dr. Sarah Mitchell";

function fmt12(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function todayStr() { return new Date().toISOString().split("T")[0]; }

const TYPE_CFG: Record<AvailabilityRequestType, { label: string; icon: React.ElementType; cls: string }> = {
  leave: { label: "Leave", icon: PlaneTakeoff, cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  "block-time": { label: "Block Time", icon: CalendarX2, cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  "hours-change": { label: "Hours Change", icon: ClockArrowUp, cls: "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400" },
};

const STATUS_CFG: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  pending: { label: "Pending Approval", icon: Clock, cls: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" },
  approved: { label: "Approved", icon: CheckCircle, cls: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" },
  "auto-approved": { label: "Auto-Approved", icon: CheckCircle, cls: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" },
  rejected: { label: "Rejected", icon: XCircle, cls: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" },
};

function ModalShell({ title, subtitle, onClose, children, footer }: { title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h2>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">{children}</div>
        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex gap-3 shrink-0">{footer}</div>
      </div>
    </div>
  );
}

const fieldClass = "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-brand-500";

export default function ProviderAvailabilityPage() {
  const provider = PROVIDERS.find((p) => p.id === CURRENT_PROVIDER_ID)!;
  const store = useProviderAvailabilityStore();
  const myRequests = store.requests.filter((r) => r.providerId === CURRENT_PROVIDER_ID).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const [modal, setModal] = useState<AvailabilityRequestType | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Leave form
  const [leaveStart, setLeaveStart] = useState(() => toLocalInput(new Date(Date.now() + 86400000)));
  const [leaveEnd, setLeaveEnd] = useState(() => toLocalInput(new Date(Date.now() + 2 * 86400000)));
  const [leaveReason, setLeaveReason] = useState("");

  // Block time form
  const [blockDate, setBlockDate] = useState(todayStr());
  const [blockStart, setBlockStart] = useState("13:00");
  const [blockEnd, setBlockEnd] = useState("14:00");
  const [blockReason, setBlockReason] = useState("");

  // Hours change form
  const [draftHours, setDraftHours] = useState<WorkingHoursDraftDay[]>(() =>
    DAYS.map((day) => {
      const wh = provider.workingHours.find((w) => w.day === day);
      return { day, isOpen: wh?.isOpen ?? false, openTime: wh?.openTime || "09:00", closeTime: wh?.closeTime || "17:00", breakStart: wh?.breakStart || "", breakEnd: wh?.breakEnd || "" };
    })
  );
  const [hoursReason, setHoursReason] = useState("");

  function closeModal() {
    setModal(null);
    setSubmitted(false);
    setLeaveReason(""); setBlockReason(""); setHoursReason("");
  }

  function afterSubmit() {
    setSubmitted(true);
    setTimeout(closeModal, 1400);
  }

  function handleApplyLeave() {
    if (!leaveReason.trim()) return;
    submitLeaveRequest(CURRENT_PROVIDER_ID, ME, new Date(leaveStart).toISOString(), new Date(leaveEnd).toISOString(), leaveReason.trim());
    afterSubmit();
  }
  function handleApplyBlockTime() {
    submitBlockTimeRequest(CURRENT_PROVIDER_ID, ME, blockDate, blockStart, blockEnd, blockReason.trim() || "Time blocked via My Availability");
    afterSubmit();
  }
  function handleApplyHoursChange() {
    submitHoursChangeRequest(CURRENT_PROVIDER_ID, ME, draftHours, hoursReason.trim() || "Requested working hours update");
    afterSubmit();
  }

  function updateDraftDay(day: DayName, changes: Partial<WorkingHoursDraftDay>) {
    setDraftHours((prev) => prev.map((d) => (d.day === day ? { ...d, ...changes } : d)));
  }

  const actions: { type: AvailabilityRequestType; label: string; icon: React.ElementType; cfg: typeof store.leave }[] = [
    { type: "leave", label: "Apply for Leave", icon: PlaneTakeoff, cfg: store.leave },
    { type: "block-time", label: "Block Time", icon: CalendarX2, cfg: store.blockTime },
    { type: "hours-change", label: "Request Change in Working Hours", icon: ClockArrowUp, cfg: store.hoursChange },
  ];

  return (
    <ProviderLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">My Availability</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Your working schedule, and requests to change it</p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mb-6" data-tour="av-actions">
          {actions.map((a) => {
            const Icon = a.icon;
            if (!a.cfg.allow) {
              return (
                <div key={a.type} title="Disabled by admin configuration (Global Masters > Provider Availability)"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 text-sm text-slate-400 cursor-not-allowed">
                  <Lock className="w-3.5 h-3.5" /> {a.label}
                </div>
              );
            }
            return (
              <button key={a.type} onClick={() => setModal(a.type)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg practmd-gradient text-white text-sm font-semibold transition-colors">
                <Icon className="w-4 h-4" /> {a.label}
              </button>
            );
          })}
        </div>

        {/* Primary location */}
        {(() => {
          const clinic = CLINICS.find((c) => c.id === "penfield-psychiatry") ?? CLINICS.find((c) => provider.clinicAccess.includes(c.id));
          return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200"><MapPin className="w-4 h-4 text-brand-600 dark:text-brand-400" /> <span className="font-medium">{clinic?.name ?? "Penfield Psychiatry"}</span></span>
              <span className="text-slate-500 dark:text-slate-400">{provider.street}, {provider.city}, {provider.state} {provider.zip}</span>
              <span className="text-xs text-slate-400">{clinic?.timezone ?? "America/New_York"}</span>
              {provider.telehealthEnabled && <span className="text-xs font-medium text-brand-600 dark:text-brand-400 flex items-center gap-1"><Video className="w-3.5 h-3.5" /> Telehealth enabled</span>}
            </div>
          );
        })()}

        {/* Weekly working hours — by day name, not date */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 mb-6" data-tour="av-hours">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Weekly Working Hours</h2>
            <span className="ml-auto text-xs text-slate-400">Current schedule · edit via &quot;Request Change in Working Hours&quot;</span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-7 gap-2">
              {DAYS.map((day) => {
                const hw = provider.workingHours.find((w) => w.day === day);
                const isOpen = hw?.isOpen ?? false;
                const hasBreak = hw?.breakStart && hw.breakEnd;
                return (
                  <div key={day} className={cn("rounded-xl border p-3 text-center",
                    isOpen ? "bg-brand-50 dark:bg-brand-950/20 border-brand-200 dark:border-brand-800" : "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 opacity-60")}>
                    <p className={cn("text-[10px] font-bold uppercase tracking-wide mb-2", isOpen ? "text-brand-600 dark:text-brand-400" : "text-slate-400")}>{day}</p>
                    {isOpen ? (
                      <>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{fmt12(hw!.openTime!)}</p>
                        <p className="text-[10px] text-slate-400">to</p>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{fmt12(hw!.closeTime!)}</p>
                        {hasBreak && <p className="text-[9px] text-slate-400 mt-1.5">Break {fmt12(hw!.breakStart!)}–{fmt12(hw!.breakEnd!)}</p>}
                      </>
                    ) : (
                      <p className="text-xs text-slate-400 font-medium">Off</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Monthly calendar */}
        <div className="mb-6" data-tour="av-calendar">
          <AvailabilityCalendar />
        </div>

        {/* Requests list */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800" data-tour="av-requests">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">My Requests</h2>
          </div>
          {myRequests.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">No requests submitted yet.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {myRequests.map((req) => <RequestRow key={req.id} req={req} />)}
            </div>
          )}
        </div>
      </div>

      {/* Apply for Leave */}
      {modal === "leave" && (
        <ModalShell title="Apply for Leave" subtitle={store.leave.approvalRequired ? "Requires admin approval" : "Applied immediately — no approval required"} onClose={closeModal}
          footer={submitted ? null : <>
            <button onClick={closeModal} className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button onClick={handleApplyLeave} disabled={!leaveReason.trim()}
              className={cn("flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors", leaveReason.trim() ? "practmd-gradient text-white" : "bg-brand-200 dark:bg-brand-900/30 text-brand-400 cursor-not-allowed")}>
              Apply
            </button>
          </>}>
          {submitted ? <SubmittedState /> : <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">From</label>
                <input type="datetime-local" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">To</label>
                <input type="datetime-local" value={leaveEnd} min={leaveStart} onChange={(e) => setLeaveEnd(e.target.value)} className={fieldClass} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Reason <span className="text-red-500">*</span></label>
              <textarea value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} rows={3} placeholder="Brief reason for the leave request" className={cn(fieldClass, "resize-none")} />
            </div>
          </>}
        </ModalShell>
      )}

      {/* Block Time */}
      {modal === "block-time" && (
        <ModalShell title="Block Time" subtitle={store.blockTime.approvalRequired ? "Requires admin approval" : "Applied immediately — no approval required"} onClose={closeModal}
          footer={submitted ? null : <>
            <button onClick={closeModal} className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button onClick={handleApplyBlockTime} className="flex-1 py-2.5 rounded-lg text-sm font-semibold practmd-gradient text-white transition-colors">Apply</button>
          </>}>
          {submitted ? <SubmittedState /> : <>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Date</label>
              <input type="date" value={blockDate} min={todayStr()} onChange={(e) => setBlockDate(e.target.value)} className={fieldClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">From</label>
                <input type="time" value={blockStart} onChange={(e) => setBlockStart(e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">To</label>
                <input type="time" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)} className={fieldClass} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Reason (optional)</label>
              <input value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="e.g. admin time, CME session" className={fieldClass} />
            </div>
          </>}
        </ModalShell>
      )}

      {/* Request Working Hours Change */}
      {modal === "hours-change" && (
        <ModalShell title="Request Change in Working Hours" subtitle={store.hoursChange.approvalRequired ? "Requires admin approval" : "Applied immediately — no approval required"} onClose={closeModal}
          footer={submitted ? null : <>
            <button onClick={closeModal} className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
            <button onClick={handleApplyHoursChange} className="flex-1 py-2.5 rounded-lg text-sm font-semibold practmd-gradient text-white transition-colors">Apply</button>
          </>}>
          {submitted ? <SubmittedState /> : <>
            <div className="space-y-2.5">
              {draftHours.map((d) => (
                <div key={d.day} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{d.day}</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-[11px] text-slate-400">{d.isOpen ? "Open" : "Off"}</span>
                      <div onClick={() => updateDraftDay(d.day, { isOpen: !d.isOpen })}
                        className={cn("w-8 h-4.5 rounded-full transition-colors relative", d.isOpen ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-600")}>
                        <div className={cn("absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform", d.isOpen ? "translate-x-4" : "translate-x-0.5")} />
                      </div>
                    </label>
                  </div>
                  {d.isOpen && (
                    <div className="grid grid-cols-2 gap-2">
                      <input type="time" value={d.openTime} onChange={(e) => updateDraftDay(d.day, { openTime: e.target.value })} className={cn(fieldClass, "text-xs py-1.5")} />
                      <input type="time" value={d.closeTime} onChange={(e) => updateDraftDay(d.day, { closeTime: e.target.value })} className={cn(fieldClass, "text-xs py-1.5")} />
                      <input type="time" value={d.breakStart} placeholder="Break from" onChange={(e) => updateDraftDay(d.day, { breakStart: e.target.value })} className={cn(fieldClass, "text-xs py-1.5")} />
                      <input type="time" value={d.breakEnd} placeholder="Break to" onChange={(e) => updateDraftDay(d.day, { breakEnd: e.target.value })} className={cn(fieldClass, "text-xs py-1.5")} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Reason (optional)</label>
              <input value={hoursReason} onChange={(e) => setHoursReason(e.target.value)} placeholder="Why are you requesting this change?" className={fieldClass} />
            </div>
          </>}
        </ModalShell>
      )}
    </ProviderLayout>
  );
}

function SubmittedState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6">
      <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
        <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
      </div>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Request Submitted!</p>
    </div>
  );
}

function RequestRow({ req }: { req: AvailabilityRequest }) {
  const tc = TYPE_CFG[req.type];
  const sc = STATUS_CFG[req.status];
  const TypeIcon = tc.icon;
  const StatusIcon = sc.icon;

  return (
    <div className="px-5 py-4">
      <div className="flex items-start gap-3">
        <span className={cn("text-[10px] font-bold px-2 py-1 rounded-md mt-0.5 shrink-0 flex items-center gap-1", tc.cls)}>
          <TypeIcon className="w-3 h-3" /> {tc.label}
        </span>
        <div className="flex-1 min-w-0">
          {req.type === "leave" && req.startDateTime && req.endDateTime && (
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{fmtDateTime(req.startDateTime)} – {fmtDateTime(req.endDateTime)}</p>
          )}
          {req.type === "block-time" && req.blockDate && (
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{fmtDate(req.blockDate)} · {fmt12(req.blockStart!)} – {fmt12(req.blockEnd!)}</p>
          )}
          {req.type === "hours-change" && (
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Proposed {req.proposedHours?.filter((d) => d.isOpen).length ?? 0} working days</p>
          )}
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{req.reason}</p>
          {req.approverName && (
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Approver: {req.approverName}</p>
          )}
          <p className="text-[10px] text-slate-400 mt-2">
            Submitted {new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            {req.resolvedAt && ` · Resolved ${new Date(req.resolvedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
          </p>
        </div>
        <div className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold shrink-0", sc.cls)}>
          <StatusIcon className="w-3.5 h-3.5" /> {sc.label}
        </div>
      </div>
    </div>
  );
}
