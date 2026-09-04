"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import {
  PROVIDER_LEAVE_REQUESTS,
  type ProviderLeaveRequest,
  type AppointmentResolution,
  type ResolutionMethod,
  type LeaveType,
} from "@/data/provider-leaves";
import { CC_APPOINTMENTS, type CcAppointment } from "@/data/cc-appointments";
import { CC_PATIENTS } from "@/data/cc-patients";
import { PROVIDERS, STAFF } from "@/data/providers";
import {
  CheckCircle, XCircle, Clock, AlertCircle, CalendarRange, ChevronDown,
  ChevronRight, Users, RefreshCw, Bell, X, Check, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LEAVE_TYPE_LABEL: Record<LeaveType, string> = {
  leave: "Personal Leave",
  vacation: "Vacation",
  unavailable: "Unavailability",
};

const LEAVE_TYPE_COLOR: Record<LeaveType, string> = {
  leave: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  vacation: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  unavailable: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function fmt12(t: string) {
  const [h, m] = t.split(":").map(Number);
  return `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

function daysBetween(start: string, end: string) {
  const s = new Date(start + "T12:00:00");
  const e = new Date(end + "T12:00:00");
  return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
}

function getConflictingAppointments(req: ProviderLeaveRequest): CcAppointment[] {
  return CC_APPOINTMENTS.filter(a => {
    if (a.providerId !== req.providerId) return false;
    if (!["confirmed", "arrived", "in-session"].includes(a.status)) return false;
    if (a.date < req.startDate || a.date > req.endDate) return false;
    if (!req.isFullDay && req.startTime && req.endTime) {
      if (a.endTime <= req.startTime || a.startTime >= req.endTime) return false;
    }
    return true;
  });
}

// ── Approval modal ────────────────────────────────────────────────────────────
interface ApprovalModalProps {
  request: ProviderLeaveRequest;
  onClose: () => void;
  onApprove: (req: ProviderLeaveRequest, resolutions: AppointmentResolution[]) => void;
  onReject: (req: ProviderLeaveRequest, reason: string) => void;
}

type ModalPhase = "conflicts" | "resolve" | "confirm" | "reject";

function ApprovalModal({ request, onClose, onApprove, onReject }: ApprovalModalProps) {
  const provider = PROVIDERS.find(p => p.id === request.providerId)!;
  const conflicts = getConflictingAppointments(request);
  const [phase, setPhase] = useState<ModalPhase>(conflicts.length > 0 ? "conflicts" : "confirm");
  const [resolutions, setResolutions] = useState<AppointmentResolution[]>(
    conflicts.map(a => ({ appointmentId: a.id, method: null }))
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [expandedAppt, setExpandedAppt] = useState<string | null>(null);

  const ccStaff = STAFF.filter(s => s.isActive);
  const otherProviders = PROVIDERS.filter(p => p.id !== request.providerId && p.isActive);

  function setResolutionForAppt(apptId: string, changes: Partial<AppointmentResolution>) {
    setResolutions(prev => prev.map(r => r.appointmentId === apptId ? { ...r, ...changes } : r));
  }

  function allResolved() {
    return resolutions.every(r => r.method !== null);
  }

  const days = daysBetween(request.startDate, request.endDate);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-[620px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Review Leave Request</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {provider.displayName} · {LEAVE_TYPE_LABEL[request.type]} · {fmtDate(request.startDate)}
              {request.startDate !== request.endDate && ` – ${fmtDate(request.endDate)}`}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Phase: reject */}
        {phase === "reject" ? (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1">Reject Request</p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  This will notify {provider.displayName} that their request was rejected.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Reason for Rejection <span className="text-red-500">*</span>
                </label>
                <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Explain why the request cannot be approved…"
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-red-500 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex gap-3 shrink-0">
              <button onClick={() => setPhase("conflicts")} className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
                Back
              </button>
              <button onClick={() => onReject(request, rejectionReason)} disabled={!rejectionReason.trim()}
                className={cn("flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                  rejectionReason.trim() ? "bg-red-600 hover:bg-red-700 text-white" : "bg-red-200 dark:bg-red-900/30 text-red-400 cursor-not-allowed")}>
                Confirm Rejection
              </button>
            </div>
          </>
        ) : phase === "confirm" ? (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Approve Request</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  {provider.displayName} will be notified of the approval.
                  {conflicts.length > 0 && " All selected resolutions will be actioned."}
                </p>
              </div>

              {/* Request summary */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Provider</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{provider.displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Type</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{LEAVE_TYPE_LABEL[request.type]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Period</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {fmtDate(request.startDate)}{request.startDate !== request.endDate ? ` – ${fmtDate(request.endDate)}` : ""} ({days} day{days > 1 ? "s" : ""})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Conflicts resolved</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{resolutions.filter(r => r.method !== null).length} of {conflicts.length}</span>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex gap-3 shrink-0">
              <button onClick={() => setPhase(conflicts.length > 0 ? "resolve" : "conflicts")}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
                Back
              </button>
              <button onClick={() => onApprove(request, resolutions)}
                className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                Approve
              </button>
            </div>
          </>
        ) : phase === "conflicts" ? (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {conflicts.length === 0 ? (
                <div className="flex flex-col items-center py-8 gap-2">
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No conflicting appointments</p>
                  <p className="text-xs text-slate-400">No active appointments exist during this period. Safe to approve.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span><strong>{conflicts.length}</strong> active appointment{conflicts.length > 1 ? "s" : ""} conflict with this leave period. Each must be resolved before approval.</span>
                  </div>
                  <div className="space-y-2">
                    {conflicts.map(appt => {
                      const patient = CC_PATIENTS.find(p => p.id === appt.patientId);
                      return (
                        <div key={appt.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{patient?.displayName}</p>
                            <p className="text-xs text-slate-400">{appt.visitType} · {fmtDate(appt.date)} · {fmt12(appt.startTime)}–{fmt12(appt.endTime)}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex gap-3 shrink-0">
              <button onClick={() => setPhase("reject")}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors font-medium">
                <XCircle className="w-4 h-4" />
                Reject
              </button>
              <button onClick={() => setPhase(conflicts.length > 0 ? "resolve" : "confirm")}
                className="flex-1 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                {conflicts.length > 0 ? "Resolve Conflicts" : "Proceed to Approve"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          /* phase === "resolve" */
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose how to handle each conflicting appointment. All must be resolved before approving.
              </p>
              {conflicts.map((appt, idx) => {
                const patient = CC_PATIENTS.find(p => p.id === appt.patientId);
                const res = resolutions.find(r => r.appointmentId === appt.id)!;
                const isExpanded = expandedAppt === appt.id;
                return (
                  <div key={appt.id} className={cn("rounded-xl border overflow-hidden",
                    res.method ? "border-emerald-200 dark:border-emerald-800" : "border-slate-200 dark:border-slate-700")}>
                    {/* Appointment summary */}
                    <button onClick={() => setExpandedAppt(isExpanded ? null : appt.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors text-left">
                      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
                        res.method ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
                        {res.method ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{patient?.displayName}</p>
                        <p className="text-xs text-slate-400">{appt.visitType} · {fmtDate(appt.date)} · {fmt12(appt.startTime)}–{fmt12(appt.endTime)}</p>
                      </div>
                      {res.method && (
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                          {res.method === "notify-cc" ? "Notify CC" : res.method === "reschedule-time" ? "Reschedule" : "New Provider"}
                        </span>
                      )}
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                    </button>

                    {/* Resolution options */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-3 bg-slate-50 dark:bg-slate-800/30">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">How should this appointment be handled?</p>

                        {/* Option A: Notify CC */}
                        <div className={cn("rounded-lg border p-3 cursor-pointer transition-colors",
                          res.method === "notify-cc" ? "border-violet-300 dark:border-violet-700 bg-white dark:bg-slate-900" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-violet-200 dark:hover:border-violet-800")}
                          onClick={() => setResolutionForAppt(appt.id, { method: "notify-cc", notifiedStaffIds: [] })}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                              res.method === "notify-cc" ? "border-violet-600 bg-violet-600" : "border-slate-300 dark:border-slate-600")}>
                              {res.method === "notify-cc" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <Bell className="w-3.5 h-3.5 text-violet-500" />
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Notify Care Coordinator</span>
                          </div>
                          {res.method === "notify-cc" && (
                            <div onClick={e => e.stopPropagation()} className="ml-6 space-y-1.5">
                              <p className="text-xs text-slate-500 mb-2">Select staff to notify:</p>
                              {ccStaff.map(staff => {
                                const selected = res.notifiedStaffIds?.includes(staff.id);
                                return (
                                  <label key={staff.id} className="flex items-center gap-2 cursor-pointer"
                                    onClick={() => {
                                      const ids = res.notifiedStaffIds ?? [];
                                      setResolutionForAppt(appt.id, {
                                        notifiedStaffIds: selected ? ids.filter(id => id !== staff.id) : [...ids, staff.id],
                                      });
                                    }}>
                                    <div className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0",
                                      selected ? "bg-violet-600 border-violet-600" : "border-slate-300 dark:border-slate-600")}>
                                      {selected && <Check className="w-2.5 h-2.5 text-white" />}
                                    </div>
                                    <span className="text-xs text-slate-700 dark:text-slate-300">{staff.displayName}</span>
                                    <span className="text-[10px] text-slate-400">{staff.role}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Option B: Reschedule to different time */}
                        <div className={cn("rounded-lg border p-3 cursor-pointer transition-colors",
                          res.method === "reschedule-time" ? "border-violet-300 dark:border-violet-700 bg-white dark:bg-slate-900" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-violet-200 dark:hover:border-violet-800")}
                          onClick={() => setResolutionForAppt(appt.id, { method: "reschedule-time" })}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                              res.method === "reschedule-time" ? "border-violet-600 bg-violet-600" : "border-slate-300 dark:border-slate-600")}>
                              {res.method === "reschedule-time" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Reschedule to Different Time</span>
                          </div>
                          {res.method === "reschedule-time" && (
                            <div onClick={e => e.stopPropagation()} className="ml-6 grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-slate-500 block mb-1">New Date</label>
                                <input type="date" value={res.newDate ?? ""} min={new Date().toISOString().split("T")[0]}
                                  onChange={e => setResolutionForAppt(appt.id, { newDate: e.target.value })}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-violet-500" />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-500 block mb-1">New Time</label>
                                <input type="time" value={res.newStartTime ?? ""}
                                  onChange={e => setResolutionForAppt(appt.id, { newStartTime: e.target.value })}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-violet-500" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Option C: Reschedule to different provider */}
                        <div className={cn("rounded-lg border p-3 cursor-pointer transition-colors",
                          res.method === "reschedule-provider" ? "border-violet-300 dark:border-violet-700 bg-white dark:bg-slate-900" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-violet-200 dark:hover:border-violet-800")}
                          onClick={() => setResolutionForAppt(appt.id, { method: "reschedule-provider" })}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                              res.method === "reschedule-provider" ? "border-violet-600 bg-violet-600" : "border-slate-300 dark:border-slate-600")}>
                              {res.method === "reschedule-provider" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <Users className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Reassign to Different Provider</span>
                          </div>
                          {res.method === "reschedule-provider" && (
                            <div onClick={e => e.stopPropagation()} className="ml-6 space-y-2">
                              <p className="text-[10px] text-slate-500 mb-1">Select new provider:</p>
                              {otherProviders.map(prov => {
                                const selected = res.newProviderId === prov.id;
                                return (
                                  <label key={prov.id} className={cn("flex items-center gap-2.5 px-2.5 py-2 rounded-lg border cursor-pointer transition-colors",
                                    selected ? "border-violet-200 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/20" : "border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50")}
                                    onClick={() => setResolutionForAppt(appt.id, { newProviderId: prov.id })}>
                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: prov.color }} />
                                    <span className="text-xs text-slate-700 dark:text-slate-300">{prov.displayName}</span>
                                    <span className="text-[10px] text-slate-400 ml-auto">{prov.providerType}</span>
                                  </label>
                                );
                              })}
                              {res.newProviderId && (
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  <div>
                                    <label className="text-[10px] text-slate-500 block mb-1">New Date (optional)</label>
                                    <input type="date" value={res.newDate ?? ""} min={new Date().toISOString().split("T")[0]}
                                      onChange={e => setResolutionForAppt(appt.id, { newDate: e.target.value })}
                                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-violet-500" />
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-slate-500 block mb-1">New Time (optional)</label>
                                    <input type="time" value={res.newStartTime ?? ""}
                                      onChange={e => setResolutionForAppt(appt.id, { newStartTime: e.target.value })}
                                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-violet-500" />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex gap-3 shrink-0">
              <button onClick={() => setPhase("conflicts")} className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
                Back
              </button>
              <button onClick={() => setPhase("confirm")} disabled={!allResolved()}
                className={cn("flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2",
                  allResolved() ? "bg-violet-600 hover:bg-violet-700 text-white" : "bg-violet-200 dark:bg-violet-900/30 text-violet-400 cursor-not-allowed")}>
                {allResolved() ? "Continue to Approve" : `${resolutions.filter(r => r.method !== null).length}/${conflicts.length} resolved`}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LeaveApprovalsPage() {
  const [requests, setRequests] = useState<ProviderLeaveRequest[]>(PROVIDER_LEAVE_REQUESTS);
  const [selectedRequest, setSelectedRequest] = useState<ProviderLeaveRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const filtered = requests.filter(r => filterStatus === "all" || r.status === filterStatus);
  const pendingCount = requests.filter(r => r.status === "pending").length;

  function handleApprove(req: ProviderLeaveRequest, resolutions: AppointmentResolution[]) {
    setRequests(prev => prev.map(r => r.id === req.id ? {
      ...r,
      status: "approved",
      resolvedAt: new Date().toISOString(),
      resolvedBy: "admin",
      appointmentResolutions: resolutions,
    } : r));
    setSelectedRequest(null);
  }

  function handleReject(req: ProviderLeaveRequest, reason: string) {
    setRequests(prev => prev.map(r => r.id === req.id ? {
      ...r,
      status: "rejected",
      resolvedAt: new Date().toISOString(),
      resolvedBy: "admin",
      rejectionReason: reason,
    } : r));
    setSelectedRequest(null);
  }

  const STATUS_CONFIG = {
    pending:  { label: "Pending", icon: Clock, cls: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" },
    approved: { label: "Approved", icon: CheckCircle, cls: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" },
    rejected: { label: "Rejected", icon: XCircle, cls: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" },
  };

  return (
    <AppLayout>
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <CalendarRange className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Provider Leave Approvals</h1>
          {pendingCount > 0 && (
            <span className="ml-1 text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
              {pendingCount} pending
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 ml-8">Review and resolve provider unavailability requests</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
        {(["pending", "all", "approved", "rejected"] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={cn("px-3 py-1.5 rounded-md text-xs font-semibold transition-colors capitalize",
              filterStatus === s ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300")}>
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            {s === "pending" && pendingCount > 0 && ` (${pendingCount})`}
          </button>
        ))}
      </div>

      {/* Request list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-5 py-10 text-center text-sm text-slate-400">
            No {filterStatus === "all" ? "" : filterStatus} requests.
          </div>
        ) : filtered.map(req => {
          const prov = PROVIDERS.find(p => p.id === req.providerId);
          const conflicts = getConflictingAppointments(req);
          const sc = STATUS_CONFIG[req.status];
          const StatusIcon = sc.icon;
          const days = daysBetween(req.startDate, req.endDate);

          return (
            <div key={req.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <div className="flex items-start gap-4">
                {/* Provider avatar */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ backgroundColor: prov?.color ?? "#64748b" }}>
                  {prov?.firstName[0]}{prov?.lastName[0]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{prov?.displayName}</p>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md", LEAVE_TYPE_COLOR[req.type])}>
                      {LEAVE_TYPE_LABEL[req.type]}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500 mb-2">
                    <span>{fmtDate(req.startDate)}{req.startDate !== req.endDate ? ` – ${fmtDate(req.endDate)}` : ""}</span>
                    <span>·</span>
                    <span>{req.isFullDay ? `${days} full day${days > 1 ? "s" : ""}` : `${fmt12(req.startTime!)} – ${fmt12(req.endTime!)}`}</span>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400">{req.reason}</p>
                  {req.notes && <p className="text-xs text-slate-400 mt-0.5">{req.notes}</p>}

                  {conflicts.length > 0 && req.status === "pending" && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {conflicts.length} conflicting appointment{conflicts.length > 1 ? "s" : ""} need resolution
                    </div>
                  )}

                  {req.status === "rejected" && req.rejectionReason && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-1">Rejected: {req.rejectionReason}</p>
                  )}

                  <p className="text-[10px] text-slate-400 mt-2">
                    Submitted {new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>

                {/* Status + Action */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold", sc.cls)}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {sc.label}
                  </div>
                  {req.status === "pending" && (
                    <button onClick={() => setSelectedRequest(req)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors">
                      Review
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Approval modal */}
      {selectedRequest && (
        <ApprovalModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </AppLayout>
  );
}
