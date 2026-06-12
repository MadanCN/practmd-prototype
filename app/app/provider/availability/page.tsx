"use client";

import { useState } from "react";
import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import { PROVIDERS } from "@/data/providers";
import { PROVIDER_LEAVE_REQUESTS, type ProviderLeaveRequest, type LeaveType } from "@/data/provider-leaves";
import {
  CalendarRange, Plus, X, Clock, CheckCircle, XCircle, AlertCircle,
  ChevronRight, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CURRENT_PROVIDER_ID = "p1";

const DAY_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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

const STATUS_CONFIG = {
  pending:  { label: "Pending Approval", icon: Clock, cls: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" },
  approved: { label: "Approved", icon: CheckCircle, cls: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" },
  rejected: { label: "Rejected", icon: XCircle, cls: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" },
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

// ── Leave request form state ──────────────────────────────────────────────────
interface FormState {
  type: LeaveType;
  startDate: string;
  endDate: string;
  isFullDay: boolean;
  startTime: string;
  endTime: string;
  reason: string;
  notes: string;
}

function todayStr() { return new Date().toISOString().split("T")[0]; }

export default function ProviderAvailabilityPage() {
  const provider = PROVIDERS.find(p => p.id === CURRENT_PROVIDER_ID)!;
  const [requests, setRequests] = useState<ProviderLeaveRequest[]>(PROVIDER_LEAVE_REQUESTS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<FormState>({
    type: "leave",
    startDate: todayStr(),
    endDate: todayStr(),
    isFullDay: true,
    startTime: "09:00",
    endTime: "17:00",
    reason: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const myRequests = requests
    .filter(r => r.providerId === CURRENT_PROVIDER_ID)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  function handleSubmit() {
    if (!form.reason.trim()) return;
    const newReq: ProviderLeaveRequest = {
      id: `lr_${Date.now()}`,
      providerId: CURRENT_PROVIDER_ID,
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      isFullDay: form.isFullDay,
      startTime: form.isFullDay ? undefined : form.startTime,
      endTime: form.isFullDay ? undefined : form.endTime,
      reason: form.reason,
      notes: form.notes || undefined,
      status: "pending",
      createdAt: new Date().toISOString(),
      conflictingAppointmentIds: [],
    };
    setRequests(prev => [newReq, ...prev]);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setDrawerOpen(false);
      setForm({ type: "leave", startDate: todayStr(), endDate: todayStr(), isFullDay: true, startTime: "09:00", endTime: "17:00", reason: "", notes: "" });
    }, 1500);
  }

  const wh = provider.workingHours;

  return (
    <ProviderLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">My Availability</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage your working schedule and time-off requests</p>
          </div>
          <button onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" />
            Request Time Off
          </button>
        </div>

        {/* Working hours */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 mb-6">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Working Hours</h2>
            <span className="ml-auto text-xs text-slate-400">Set by clinic admin · Read-only</span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-7 gap-2">
              {DAY_ORDER.map(day => {
                const hw = wh.find(w => w.day === day);
                const isOpen = hw?.isOpen ?? false;
                const hasBreak = hw?.breakStart && hw.breakEnd;
                return (
                  <div key={day} className={cn("rounded-xl border p-3 text-center",
                    isOpen
                      ? "bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800"
                      : "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 opacity-60")}>
                    <p className={cn("text-[10px] font-bold uppercase tracking-wide mb-2",
                      isOpen ? "text-violet-600 dark:text-violet-400" : "text-slate-400")}>
                      {day.slice(0, 3)}
                    </p>
                    {isOpen ? (
                      <>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{fmt12(hw!.openTime!)}</p>
                        <p className="text-[10px] text-slate-400">to</p>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{fmt12(hw!.closeTime!)}</p>
                        {hasBreak && (
                          <p className="text-[9px] text-slate-400 mt-1.5">
                            Break {fmt12(hw!.breakStart!)}–{fmt12(hw!.breakEnd!)}
                          </p>
                        )}
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

        {/* Leave requests list */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Time-Off Requests</h2>
          </div>

          {myRequests.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-400">No requests submitted yet.</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {myRequests.map(req => {
                const sc = STATUS_CONFIG[req.status];
                const StatusIcon = sc.icon;
                const days = daysBetween(req.startDate, req.endDate);
                return (
                  <div key={req.id} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      {/* Type badge */}
                      <span className={cn("text-[10px] font-bold px-2 py-1 rounded-md mt-0.5 shrink-0", LEAVE_TYPE_COLOR[req.type])}>
                        {LEAVE_TYPE_LABEL[req.type]}
                      </span>

                      <div className="flex-1 min-w-0">
                        {/* Date range */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {fmtDate(req.startDate)}
                            {req.startDate !== req.endDate && ` – ${fmtDate(req.endDate)}`}
                          </p>
                          <span className="text-xs text-slate-400">
                            {req.isFullDay ? `${days} day${days > 1 ? "s" : ""}` : `${fmt12(req.startTime!)} – ${fmt12(req.endTime!)}`}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{req.reason}</p>
                        {req.notes && <p className="text-xs text-slate-400 mt-0.5">{req.notes}</p>}

                        {/* Rejection reason */}
                        {req.status === "rejected" && req.rejectionReason && (
                          <div className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-3 py-2 rounded-lg">
                            Rejection reason: {req.rejectionReason}
                          </div>
                        )}

                        {/* Conflicting appointments notice */}
                        {req.status === "pending" && (req.conflictingAppointmentIds?.length ?? 0) > 0 && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {req.conflictingAppointmentIds!.length} conflicting appointment{req.conflictingAppointmentIds!.length > 1 ? "s" : ""} — awaiting admin resolution
                          </div>
                        )}

                        <p className="text-[10px] text-slate-400 mt-2">
                          Submitted {new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          {req.resolvedAt && ` · Resolved ${new Date(req.resolvedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                        </p>
                      </div>

                      {/* Status badge */}
                      <div className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold shrink-0", sc.cls)}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {sc.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Leave request drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setDrawerOpen(false)} />
          <div className="w-[440px] bg-white dark:bg-slate-900 flex flex-col border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Request Time Off</h2>
                <p className="text-xs text-slate-400 mt-0.5">Submitted requests require admin approval</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {submitted ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Request Submitted!</p>
                <p className="text-xs text-slate-400 text-center">Your request has been sent to the admin for approval. You&apos;ll be notified of the decision.</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                  {/* Leave type */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Request Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["leave", "vacation", "unavailable"] as LeaveType[]).map(t => (
                        <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                          className={cn("py-2 px-3 rounded-lg border text-xs font-medium transition-colors",
                            form.type === t
                              ? "bg-violet-600 text-white border-violet-600"
                              : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800")}>
                          {LEAVE_TYPE_LABEL[t]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Full day toggle */}
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div onClick={() => setForm(f => ({ ...f, isFullDay: !f.isFullDay }))}
                        className={cn("w-9 h-5 rounded-full transition-colors relative",
                          form.isFullDay ? "bg-violet-600" : "bg-slate-300 dark:bg-slate-600")}>
                        <div className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                          form.isFullDay ? "translate-x-4" : "translate-x-0.5")} />
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-300">Full day(s)</span>
                    </label>
                  </div>

                  {/* Date range */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Start Date</label>
                      <input type="date" value={form.startDate}
                        onChange={e => setForm(f => ({ ...f, startDate: e.target.value, endDate: e.target.value < f.endDate ? f.endDate : e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-violet-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">End Date</label>
                      <input type="date" value={form.endDate} min={form.startDate}
                        onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-violet-500" />
                    </div>
                  </div>

                  {/* Time range (partial day) */}
                  {!form.isFullDay && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">From</label>
                        <input type="time" value={form.startTime}
                          onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-violet-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">To</label>
                        <input type="time" value={form.endTime}
                          onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-violet-500" />
                      </div>
                    </div>
                  )}

                  {/* Reason */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Reason <span className="text-red-500">*</span></label>
                    <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                      placeholder="Brief reason for the request"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-violet-500" />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Additional Notes</label>
                    <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Any additional context for the admin…"
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-violet-500 resize-none" />
                  </div>

                  {/* Info box */}
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-400">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <p>Your request will be reviewed by the clinic admin. If you have existing appointments during this period, they will be flagged for resolution.</p>
                  </div>
                </div>

                {/* Drawer footer */}
                <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex gap-3 shrink-0">
                  <button onClick={() => setDrawerOpen(false)}
                    className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSubmit} disabled={!form.reason.trim()}
                    className={cn("flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                      form.reason.trim()
                        ? "bg-violet-600 hover:bg-violet-700 text-white"
                        : "bg-violet-200 dark:bg-violet-900/30 text-violet-400 cursor-not-allowed")}>
                    Submit Request
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </ProviderLayout>
  );
}
