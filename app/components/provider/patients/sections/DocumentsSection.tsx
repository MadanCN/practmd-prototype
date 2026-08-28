"use client";

import { useState } from "react";
import { Files, FileText, FlaskConical, ImageIcon, ArrowRightLeft, ShieldCheck, Pill, ChevronRight, Check, X, RotateCcw, Download } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import type { DocType } from "@/data/patient-portal";
import { PATIENT_DOCS_BY_ID } from "@/data/provider-patient-clinical";
import type { PatientProfile } from "@/data/provider-patients";
import { cn } from "@/lib/utils";
import { fmtShortDate } from "./shared";

type Review = "pending" | "approved" | "needs-review" | "rejected";

const DOC_ICON: Record<DocType, React.ElementType> = {
  "lab-result": FlaskConical,
  imaging: ImageIcon,
  referral: ArrowRightLeft,
  "discharge-summary": FileText,
  consent: ShieldCheck,
  prescription: Pill,
  other: FileText,
};

const REVIEW_CFG: Record<Review, { label: string; cls: string }> = {
  pending: { label: "Awaiting review", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  approved: { label: "Accepted", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
  "needs-review": { label: "Needs revision", cls: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400" },
  rejected: { label: "Rejected", cls: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400" },
};

export function DocumentsSection({ patient }: { patient: PatientProfile }) {
  const docs = PATIENT_DOCS_BY_ID[patient.id] ?? [];
  const [reviews, setReviews] = useState<Record<string, Review>>(() =>
    Object.fromEntries(docs.map((d, i) => [d.id, (["approved", "pending", "needs-review"] as Review[])[i % 3]])),
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const open = docs.find((d) => d.id === openId) ?? null;

  return (
    <div>
      {docs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-14 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <Files className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-400">No documents on file for {patient.firstName}.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
          {docs.map((d) => {
            const Icon = DOC_ICON[d.type];
            const r = reviews[d.id];
            return (
              <button key={d.id} onClick={() => setOpenId(d.id)} className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                <span className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{d.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {fmtShortDate(d.date)} · {d.size} · uploaded by {d.uploadedBy}{d.provider ? ` · ${d.provider}` : ""}
                  </p>
                </div>
                <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0", REVIEW_CFG[r].cls)}>{REVIEW_CFG[r].label}</span>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      <Drawer
        open={!!open}
        onClose={() => setOpenId(null)}
        title={open?.name ?? ""}
        description={open ? `${open.type.replace("-", " ")} · ${open.size}` : undefined}
        footer={open && (
          <div className="flex items-center gap-2">
            <button onClick={() => setReviews((p) => ({ ...p, [open.id]: "approved" }))} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
              <Check className="w-3.5 h-3.5" /> Accept
            </button>
            <button onClick={() => setReviews((p) => ({ ...p, [open.id]: "needs-review" }))} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-orange-200 dark:border-orange-900 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30">
              <RotateCcw className="w-3.5 h-3.5" /> Needs revision
            </button>
            <button onClick={() => setReviews((p) => ({ ...p, [open.id]: "rejected" }))} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30">
              <X className="w-3.5 h-3.5" /> Reject
            </button>
          </div>
        )}
      >
        {open && (
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-8 flex flex-col items-center gap-2 text-center">
              <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              <p className="text-xs text-slate-400">Document preview is not available in this prototype.</p>
              <button className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-400 hover:underline"><Download className="w-3.5 h-3.5" /> Download</button>
            </div>
            <DRow label="Type"><span className="capitalize">{open.type.replace("-", " ")}</span></DRow>
            <DRow label="Document date">{fmtShortDate(open.date)}</DRow>
            <DRow label="Uploaded">{fmtShortDate(open.uploadedAt.split("T")[0])} · by {open.uploadedBy}</DRow>
            {open.provider && <DRow label="Provider">{open.provider}</DRow>}
            {open.clinic && <DRow label="Clinic">{open.clinic}</DRow>}
            <DRow label="Size">{open.size}</DRow>
            <DRow label="Review status">
              <span className={cn("text-xs font-semibold px-1.5 py-0.5 rounded", REVIEW_CFG[reviews[open.id]].cls)}>{REVIEW_CFG[reviews[open.id]].label}</span>
            </DRow>
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
