"use client";

import { useState } from "react";
import {
  FileText, CheckCircle2, Clock, AlertTriangle, ChevronRight, Star,
  X, Check, ChevronDown, ChevronUp,
} from "lucide-react";
import { PATIENT_FORMS, type PatientForm } from "@/data/patient-portal";
import { cn } from "@/lib/utils";

function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const STATUS_CFG: Record<PatientForm["status"], { label: string; cls: string; icon: React.ElementType }> = {
  pending: { label: "Pending", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400", icon: Clock },
  completed: { label: "Completed", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400", icon: CheckCircle2 },
  overdue: { label: "Overdue", cls: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400", icon: AlertTriangle },
};

const APPROVAL_CFG: Record<NonNullable<PatientForm["approvalStatus"]>, { label: string; cls: string }> = {
  pending: { label: "Awaiting Review", cls: "text-amber-600 dark:text-amber-400" },
  approved: { label: "Reviewed & Approved", cls: "text-emerald-600 dark:text-emerald-400" },
  "needs-review": { label: "Needs Follow-up", cls: "text-red-500" },
};

// Mini form fill modal for demo
function FormFillModal({ form, onClose }: { form: PatientForm; onClose: () => void }) {
  const [answers, setAnswers] = useState<number[]>(new Array(form.questions ?? 9).fill(0));
  const [submitted, setSubmitted] = useState(false);

  const options = [
    { val: 0, label: "Not at all" },
    { val: 1, label: "Several days" },
    { val: 2, label: "More than half the days" },
    { val: 3, label: "Nearly every day" },
  ];

  const questions = Array.from({ length: Math.min(form.questions ?? 9, 9) }, (_, i) => `Question ${i + 1}`);

  const score = answers.reduce((s, a) => s + a, 0);

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl p-8 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Form Submitted!</h3>
          <p className="text-sm text-slate-500">Your {form.name} has been submitted. Score: {score}/{(form.questions ?? 9) * 3}</p>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg max-h-[85vh] rounded-2xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{form.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <p className="text-sm text-slate-500">{form.description}</p>
          {questions.map((q, i) => (
            <div key={i} className="space-y-2">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {i + 1}. Over the last 2 weeks, how often have you been bothered by: <em>symptom {i + 1}</em>?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {options.map(opt => (
                  <button key={opt.val} onClick={() => setAnswers(prev => { const n = [...prev]; n[i] = opt.val; return n; })}
                    className={cn("px-3 py-2 rounded-lg text-xs border transition-colors text-left",
                      answers[i] === opt.val
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-400")}>
                    {opt.val}. {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 shrink-0 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50">Cancel</button>
          <button onClick={() => setSubmitted(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold">
            <Check className="w-4 h-4" /> Submit Form
          </button>
        </div>
      </div>
    </div>
  );
}

function FormCard({ form }: { form: PatientForm }) {
  const [fillOpen, setFillOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CFG[form.status];
  const StatusIcon = status.icon;
  const approval = form.approvalStatus ? APPROVAL_CFG[form.approvalStatus] : null;
  const scorePercent = form.score !== undefined && form.maxScore ? Math.round((form.score / form.maxScore) * 100) : null;

  return (
    <>
      {fillOpen && <FormFillModal form={form} onClose={() => setFillOpen(false)} />}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden">
        <button onClick={() => setExpanded(e => !e)} className="w-full text-left">
          <div className="flex items-center gap-4 p-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{form.name}</p>
                <span className={cn("flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", status.cls)}>
                  <StatusIcon className="w-3 h-3" />{status.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{form.type} · {form.questions} questions</p>
              {form.dueDate && form.status === "pending" && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Due by {fmtDate(form.dueDate)}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {form.status === "pending" && (
                <button onClick={e => { e.stopPropagation(); setFillOpen(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
                  Fill Out <ChevronRight className="w-3 h-3" />
                </button>
              )}
              {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </div>
        </button>

        {expanded && (
          <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">{form.description}</p>
            {form.completedAt && (
              <p className="text-xs text-slate-500">Completed: {fmtDate(form.completedAt)}</p>
            )}
            {form.assignedAt && (
              <p className="text-xs text-slate-500">Assigned: {fmtDate(form.assignedAt)}</p>
            )}
            {scorePercent !== null && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Score</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{form.score} / {form.maxScore} ({scorePercent}%)</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", scorePercent >= 70 ? "bg-red-500" : scorePercent >= 40 ? "bg-amber-500" : "bg-emerald-500")}
                    style={{ width: `${scorePercent}%` }} />
                </div>
              </div>
            )}
            {approval && (
              <div className={cn("flex items-center gap-2 text-xs font-medium", approval.cls)}>
                <Star className="w-3.5 h-3.5" /> {approval.label}
              </div>
            )}
            {form.providerNotes && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Provider Notes</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{form.providerNotes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function FormsPage() {
  const pending = PATIENT_FORMS.filter(f => f.status === "pending");
  const completed = PATIENT_FORMS.filter(f => f.status === "completed");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Forms & Intake</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Complete assigned forms and view past submissions</p>
      </div>

      {pending.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> {pending.length} form{pending.length > 1 ? "s" : ""} pending completion
          </p>
          {pending.map(f => <FormCard key={f.id} form={f} />)}
        </div>
      )}

      <div className="space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed</p>
        {completed.map(f => <FormCard key={f.id} form={f} />)}
      </div>
    </div>
  );
}
