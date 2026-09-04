"use client";

import { useState } from "react";
import { ClipboardList, ChevronRight, Check, X, RotateCcw } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import type { PatientForm, ApprovalStatus } from "@/data/patient-portal";
import { PATIENT_FORMS_BY_ID } from "@/data/provider-patient-clinical";
import type { PatientProfile } from "@/data/provider-patients";
import { cn } from "@/lib/utils";
import { fmtShortDate } from "./shared";

const APPROVAL_CFG: Record<ApprovalStatus, { label: string; cls: string }> = {
  approved: { label: "Accepted", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
  pending: { label: "Awaiting review", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  "needs-review": { label: "Needs revision", cls: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400" },
};

export function FormsSection({ patient }: { patient: PatientProfile }) {
  const [forms, setForms] = useState<PatientForm[]>(() => PATIENT_FORMS_BY_ID[patient.id] ?? []);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = forms.find((f) => f.id === openId) ?? null;

  function review(id: string, status: ApprovalStatus) {
    setForms((prev) => prev.map((f) => (f.id === id ? { ...f, approvalStatus: status } : f)));
  }

  const completion = (f: PatientForm) => (f.status === "completed" ? 100 : 0);

  return (
    <div>
      {forms.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-14 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <ClipboardList className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-400">No forms assigned to {patient.firstName}.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
          {forms.map((f) => (
            <button key={f.id} onClick={() => setOpenId(f.id)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <span className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center shrink-0">
                <ClipboardList className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{f.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-24 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${completion(f)}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-400">{completion(f)}% complete</span>
                  {f.score !== undefined && f.maxScore && <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Score {f.score}/{f.maxScore}</span>}
                </div>
              </div>
              {f.approvalStatus && f.status === "completed" && (
                <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0", APPROVAL_CFG[f.approvalStatus].cls)}>{APPROVAL_CFG[f.approvalStatus].label}</span>
              )}
              {f.status === "pending" && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-400">Not started</span>}
              <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
            </button>
          ))}
        </div>
      )}

      <Drawer
        open={!!open}
        onClose={() => setOpenId(null)}
        title={open?.name ?? ""}
        description={open ? `${open.type[0].toUpperCase()}${open.type.slice(1)} · ${open.questions ?? "—"} questions` : undefined}
        footer={open && open.status === "completed" && (
          <div className="flex items-center gap-2">
            <button onClick={() => review(open.id, "approved")} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
              <Check className="w-3.5 h-3.5" /> Accept
            </button>
            <button onClick={() => review(open.id, "needs-review")} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-orange-200 dark:border-orange-900 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30">
              <RotateCcw className="w-3.5 h-3.5" /> Needs revision
            </button>
            <button onClick={() => review(open.id, "pending")} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
              <X className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        )}
      >
        {open && (
          <div className="space-y-4 text-sm">
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{open.description}</p>
            <DRow label="Status">{open.status === "completed" ? "Completed" : open.status === "overdue" ? "Overdue" : "Pending"}</DRow>
            <DRow label="Assigned">{fmtShortDate(open.assignedAt)}</DRow>
            {open.dueDate && <DRow label="Due">{fmtShortDate(open.dueDate)}</DRow>}
            {open.completedAt && <DRow label="Completed">{fmtShortDate(open.completedAt)}</DRow>}
            {open.score !== undefined && open.maxScore && (
              <DRow label="Score">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{open.score} / {open.maxScore}</span>
              </DRow>
            )}
            <DRow label="Review status">
              {open.approvalStatus ? (
                <span className={cn("text-xs font-semibold px-1.5 py-0.5 rounded", APPROVAL_CFG[open.approvalStatus].cls)}>{APPROVAL_CFG[open.approvalStatus].label}</span>
              ) : "—"}
            </DRow>
            {open.providerNotes && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Provider notes</p>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{open.providerNotes}</p>
              </div>
            )}
            {open.status !== "completed" && (
              <p className="text-xs text-slate-400 italic">The patient hasn&apos;t submitted this form yet — nothing to review.</p>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

function DRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-28 shrink-0 text-xs text-slate-400">{label}</span>
      <span className="flex-1 text-slate-700 dark:text-slate-200">{children}</span>
    </div>
  );
}
