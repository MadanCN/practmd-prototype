"use client";

import { useState } from "react";
import { ClipboardList, ChevronRight, User, Users } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import { cn } from "@/lib/utils";
import { useOnboardingStore, type OnboardingSubmission } from "@/lib/onboarding-store";

const STEP_LABELS = ["Account for", "Your information", "About the patient", "What brings you here", "Insurance", "Intake forms"];

function patientName(sub: OnboardingSubmission) {
  return sub.patient ? `${sub.patient.firstName} ${sub.patient.lastName}` : "Not yet provided";
}

function SubmissionDrawer({ sub, onClose }: { sub: OnboardingSubmission; onClose: () => void }) {
  const store = useOnboardingStore();
  const worklistItem = store.worklist.find((w) => w.submissionId === sub.id);

  return (
    <Drawer open onClose={onClose} title={patientName(sub)} description={`Onboarding started ${new Date(sub.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}>
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Account For</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5 capitalize">{sub.accountFor === "self" ? "Self" : "Guardian / Caregiver"}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Coordinator</p>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">{sub.coordinator ?? "Unassigned"}</p>
          </div>
        </div>

        {sub.accountHolder && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Account Holder</p>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-700 dark:text-slate-300">
              {sub.accountHolder.firstName} {sub.accountHolder.lastName} ({sub.accountHolder.relationship}) · {sub.accountHolder.mobile}
            </div>
          </div>
        )}

        {sub.patient && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Patient</p>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-700 dark:text-slate-300">
              {sub.patient.firstName} {sub.patient.lastName} · DOB {sub.patient.dob} {sub.patient.pronouns ? `· ${sub.patient.pronouns}` : ""}
            </div>
          </div>
        )}

        {sub.careIntent && !sub.careIntent.skipped && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Care Intent</p>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-700 dark:text-slate-300">
              {sub.careIntent.careTypes.join(", ") || "—"} {sub.careIntent.location ? `· ${sub.careIntent.location}` : ""}
            </div>
          </div>
        )}

        {sub.insurance && (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Insurance</p>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-700 dark:text-slate-300">
              {sub.insurance.payerName} · Member ID {sub.insurance.memberId}
              {worklistItem && <p className="text-xs text-slate-500 mt-1">Eligibility status: <span className="font-semibold">{worklistItem.state}</span></p>}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Progress</p>
          <div className="space-y-1.5">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex items-center gap-2 text-sm">
                <span className={cn("w-1.5 h-1.5 rounded-full", i < sub.step ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700")} />
                <span className={i < sub.step ? "text-slate-700 dark:text-slate-300" : "text-slate-400"}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}

export default function SubmissionsList() {
  const store = useOnboardingStore();
  const [openId, setOpenId] = useState<string | null>(null);

  const submissions = [...store.submissions].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const openSub = openId ? submissions.find((s) => s.id === openId) ?? null : null;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 flex items-center justify-center shrink-0">
          <ClipboardList className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Submissions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Patient onboarding submissions, from account creation through intake</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800/60">
        {submissions.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-slate-400">No onboarding submissions yet.</div>
        )}
        {submissions.map((sub) => {
          const Icon = sub.accountFor === "guardian" ? Users : User;
          return (
            <button key={sub.id} onClick={() => setOpenId(sub.id)} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left">
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{patientName(sub)}</p>
                <p className="text-xs text-slate-400 truncate">
                  {sub.insurance ? `${sub.insurance.payerName} submitted` : "Insurance not yet submitted"} · Step {sub.step} of 6{sub.completedAt ? " · Complete" : ""}
                </p>
              </div>
              <span className="text-[11px] text-slate-400 shrink-0 hidden sm:inline">
                {new Date(sub.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </button>
          );
        })}
      </div>

      {openSub && <SubmissionDrawer sub={openSub} onClose={() => setOpenId(null)} />}
    </div>
  );
}
